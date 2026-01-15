-- Create a dummy user for Study Buddy testing
DO $$
DECLARE
    dummy_id uuid := gen_random_uuid();
    org_id_val uuid;
BEGIN
    -- Get the first org id found (assuming user is in one)
    SELECT id INTO org_id_val FROM organizations LIMIT 1;

    -- Insert dummy profile
    INSERT INTO profiles (id, email, full_name, role, org_id, is_looking_for_buddy, buddy_bio)
    VALUES (
        dummy_id,
        'alex.chen@example.com',
        'Alex Chen',
        'learner',
        org_id_val,
        true,
        'Looking for someone to practice objection handling with! I''m usually free on Tuesdays.'
    );

    RAISE NOTICE 'Created dummy user Alex Chen looking for a buddy.';
END $$;
