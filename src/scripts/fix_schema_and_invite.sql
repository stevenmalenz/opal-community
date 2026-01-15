-- COMPREHENSIVE FIX SCRIPT
-- 1. Fixes Schema (adds missing columns)
-- 2. Updates RPC function
-- 3. Fixes the specific user's invite and org state

-- PART 1: FIX SCHEMA
DO $$
BEGIN
    -- Add accepted_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'accepted_at') THEN
        ALTER TABLE team_invites ADD COLUMN accepted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added accepted_at column';
    END IF;

    -- Add track_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invites' AND column_name = 'track_id') THEN
        ALTER TABLE team_invites ADD COLUMN track_id UUID REFERENCES courses(id);
        RAISE NOTICE 'Added track_id column';
    END IF;
END $$;

-- PART 2: RE-CREATE RPC (Safe Invite Accept)
CREATE OR REPLACE FUNCTION accept_invite()
RETURNS TABLE (
  id uuid,
  role text,
  track_id uuid,
  org_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email text;
BEGIN
  current_user_email := auth.email();
  
  RETURN QUERY
  UPDATE team_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE TRIM(LOWER(email)) = TRIM(LOWER(current_user_email)) AND status = 'pending'
  RETURNING team_invites.id, team_invites.role, team_invites.track_id, team_invites.org_id;
END;
$$;

-- PART 3: MANUAL USER FIX
DO $$
DECLARE
    target_email text := 'steven@stevenmale.com'; -- <--- TARGET EMAIL
    invite_record record;
    user_record record;
BEGIN
    RAISE NOTICE 'Starting manual fix for %', target_email;

    -- Find pending invite
    SELECT * INTO invite_record 
    FROM team_invites 
    WHERE TRIM(LOWER(email)) = TRIM(LOWER(target_email)) AND status = 'pending' 
    LIMIT 1;
    
    IF invite_record.id IS NOT NULL THEN
        -- Update invite
        UPDATE team_invites 
        SET status = 'accepted', accepted_at = NOW() 
        WHERE id = invite_record.id;
        RAISE NOTICE 'Accepted invite %', invite_record.id;
        
        -- Find user
        SELECT * INTO user_record FROM auth.users WHERE email = target_email LIMIT 1;
        
        IF user_record.id IS NOT NULL THEN
            -- Fix Org and Role
            UPDATE profiles 
            SET org_id = invite_record.org_id, role = invite_record.role 
            WHERE id = user_record.id;
            RAISE NOTICE 'Fixed User Org/Role';
            
            -- Enroll
            IF invite_record.track_id IS NOT NULL THEN
                INSERT INTO user_courses (user_id, course_id, role, progress, status)
                VALUES (user_record.id, invite_record.track_id, 'learner', 0, 'not-started')
                ON CONFLICT (user_id, course_id) DO NOTHING;
                RAISE NOTICE 'Enrolled in track';
            END IF;
        ELSE
            RAISE NOTICE 'User not found (yet), but invite is ready.';
        END IF;
    ELSE
        RAISE NOTICE 'No pending invite found (might already be accepted).';
        
        -- Fallback: Check if user exists and just needs Org fix based on ANY invite
        SELECT * INTO invite_record 
        FROM team_invites 
        WHERE TRIM(LOWER(email)) = TRIM(LOWER(target_email)) 
        LIMIT 1;
        
        IF invite_record.id IS NOT NULL THEN
             SELECT * INTO user_record FROM auth.users WHERE email = target_email LIMIT 1;
             IF user_record.id IS NOT NULL AND invite_record.org_id IS NOT NULL THEN
                UPDATE profiles 
                SET org_id = invite_record.org_id 
                WHERE id = user_record.id AND org_id != invite_record.org_id;
                RAISE NOTICE 'Fallback: Aligned user Org with invite.';
             END IF;
        END IF;
    END IF;
END $$;
