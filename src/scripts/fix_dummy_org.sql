-- Fix Alex Chen's Org ID to match the real user
DO $$
DECLARE
    real_user_org_id uuid;
BEGIN
    -- Get the org_id of a real user (not Alex Chen)
    SELECT org_id INTO real_user_org_id
    FROM profiles
    WHERE email NOT LIKE 'alex.chen@example.com'
    LIMIT 1;

    IF real_user_org_id IS NOT NULL THEN
        -- Update Alex Chen to be in the same org
        UPDATE profiles
        SET org_id = real_user_org_id
        WHERE email = 'alex.chen@example.com';
        
        RAISE NOTICE 'Updated Alex Chen to join org %', real_user_org_id;
    ELSE
        RAISE NOTICE 'No real user found to match org with.';
    END IF;
END $$;
