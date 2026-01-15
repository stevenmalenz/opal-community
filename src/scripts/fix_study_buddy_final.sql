-- ==========================================
-- FIX STUDY BUDDY DUMMY USER
-- ==========================================

-- 1. Ensure Alex Chen exists
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'alex.chen@example.com', 
    'password123', 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Alex Chen"}', 
    now(), 
    now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alex.chen@example.com');

-- 2. Ensure Alex Chen has a profile
INSERT INTO public.profiles (id, email, full_name, role, is_looking_for_buddy, buddy_bio)
SELECT 
    id, 
    email, 
    'Alex Chen', 
    'learner', 
    true, 
    'Looking for someone to practice negotiation scripts with! Available Tue/Thu.'
FROM auth.users 
WHERE email = 'alex.chen@example.com'
ON CONFLICT (id) DO UPDATE 
SET is_looking_for_buddy = true,
    buddy_bio = 'Looking for someone to practice negotiation scripts with! Available Tue/Thu.';

-- 3. Fix Organization Mismatch
-- Find the first real user (not Alex) and put Alex in their org
DO $$
DECLARE
    real_user_org_id uuid;
    alex_id uuid;
BEGIN
    -- Get Alex's ID
    SELECT id INTO alex_id FROM auth.users WHERE email = 'alex.chen@example.com';

    -- Get a real user's org
    SELECT org_id INTO real_user_org_id
    FROM profiles
    WHERE id != alex_id
    AND org_id IS NOT NULL
    LIMIT 1;

    IF real_user_org_id IS NOT NULL THEN
        UPDATE profiles
        SET org_id = real_user_org_id
        WHERE id = alex_id;
        
        RAISE NOTICE 'SUCCESS: Moved Alex Chen to Org ID: %', real_user_org_id;
    ELSE
        RAISE NOTICE 'WARNING: Could not find a real user with an Org ID. Alex Chen might be lonely.';
    END IF;
END $$;
