-- DIAGNOSTIC SCRIPT
-- Check org_id alignment for User, Courses, and Team

DO $$
DECLARE
    target_email text := 'steven.male@hey.com'; -- The Admin user reporting issues
    user_record record;
    user_org uuid;
BEGIN
    -- 1. Get the User's current Org
    SELECT * INTO user_record FROM profiles WHERE email = target_email;
    user_org := user_record.org_id;
    
    RAISE NOTICE '--- DIAGNOSTIC REPORT FOR % ---', target_email;
    RAISE NOTICE 'User ID: %', user_record.id;
    RAISE NOTICE 'Current Org ID: %', user_org;
    
    -- 2. Count Courses in this Org vs Total Courses
    RAISE NOTICE '--- COURSES ---';
    RAISE NOTICE 'Courses in Org %: %', user_org, (SELECT COUNT(*) FROM courses WHERE org_id = user_org);
    RAISE NOTICE 'Courses with NO Org: %', (SELECT COUNT(*) FROM courses WHERE org_id IS NULL);
    RAISE NOTICE 'Total Courses: %', (SELECT COUNT(*) FROM courses);
    
    -- 3. Count Team Members in this Org
    RAISE NOTICE '--- TEAM MEMBERS ---';
    RAISE NOTICE 'Profiles in Org %: %', user_org, (SELECT COUNT(*) FROM profiles WHERE org_id = user_org);
    
    -- 4. Check specific missing users (e.g. the invited one)
    RAISE NOTICE '--- SPECIFIC USERS ---';
    FOR user_record IN SELECT * FROM profiles WHERE email IN ('steven@stevenmale.com', 'steven+learn@stevenmale.com') LOOP
        RAISE NOTICE 'User: % | Org ID: % | Match? %', user_record.email, user_record.org_id, (user_record.org_id = user_org);
    END LOOP;

    -- 5. Check Invites in this Org
    RAISE NOTICE '--- INVITES ---';
    RAISE NOTICE 'Invites in Org %: %', user_org, (SELECT COUNT(*) FROM team_invites WHERE org_id = user_org);

END $$;
