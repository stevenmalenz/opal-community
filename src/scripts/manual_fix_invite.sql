-- MANUAL FIX SCRIPT
-- Run this in Supabase SQL Editor to force-fix the user state

DO $$
DECLARE
    target_email text := 'steven@stevenmale.com'; -- <--- VERIFY THIS EMAIL
    invite_record record;
    user_record record;
BEGIN
    RAISE NOTICE 'Starting manual fix for %', target_email;

    -- 1. Find the pending invite (Case insensitive)
    SELECT * INTO invite_record 
    FROM team_invites 
    WHERE TRIM(LOWER(email)) = TRIM(LOWER(target_email)) AND status = 'pending' 
    LIMIT 1;
    
    IF invite_record.id IS NULL THEN
        RAISE NOTICE 'No pending invite found for %. Checking for ANY invite...', target_email;
        -- Check if maybe it's already accepted but user is stuck?
        SELECT * INTO invite_record 
        FROM team_invites 
        WHERE TRIM(LOWER(email)) = TRIM(LOWER(target_email)) 
        LIMIT 1;
        
        IF invite_record.id IS NULL THEN
            RAISE EXCEPTION 'ABORTING: No invite record found at all for this email.';
        ELSE
            RAISE NOTICE 'Found existing invite (Status: %), proceeding to ensure profile matches...', invite_record.status;
        END IF;
    ELSE
        -- 2. Update invite status
        UPDATE team_invites 
        SET status = 'accepted', accepted_at = NOW() 
        WHERE id = invite_record.id;
        RAISE NOTICE 'Force-accepted invite %', invite_record.id;
    END IF;
        
    -- 3. Find the user
    SELECT * INTO user_record FROM auth.users WHERE email = target_email LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
        RAISE NOTICE 'Found user % (ID: %)', target_email, user_record.id;
        
        -- 4. Update Profile Org and Role to match the invite
        -- This fixes the "Wrong Org" issue
        UPDATE profiles 
        SET org_id = invite_record.org_id, role = invite_record.role 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'UPDATED PROFILE: Set Org ID to % and Role to %', invite_record.org_id, invite_record.role;
        
        -- 5. Enroll in Track
        IF invite_record.track_id IS NOT NULL THEN
            INSERT INTO user_courses (user_id, course_id, role, progress, status)
            VALUES (user_record.id, invite_record.track_id, 'learner', 0, 'not-started')
            ON CONFLICT (user_id, course_id) DO NOTHING;
            
            RAISE NOTICE 'ENROLLED: User enrolled in track %', invite_record.track_id;
        ELSE
            RAISE NOTICE 'WARNING: No track_id found on invite.';
        END IF;
        
    ELSE
        RAISE NOTICE 'User % not found in auth.users. They need to sign up first.', target_email;
    END IF;
END $$;
