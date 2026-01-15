-- CONSOLIDATE ORG & INSPECT ENROLLMENTS

DO $$
DECLARE
    main_org_id uuid := '2477b1e5-9e48-4af4-832c-8d098ca563fa'; -- The Org ID of steven.male@hey.com
    stray_email text := 'steven+learn@stevenmale.com';
    target_user_email text := 'steven@stevenmale.com';
    user_record record;
    enrollment_record record;
    course_record record;
BEGIN
    RAISE NOTICE '--- STARTING CONSOLIDATION ---';
    
    -- 1. Move steven+learn to the main org
    UPDATE profiles 
    SET org_id = main_org_id 
    WHERE email = stray_email AND org_id != main_org_id;
    
    IF FOUND THEN
        RAISE NOTICE 'Moved % to Org %', stray_email, main_org_id;
    ELSE
        RAISE NOTICE '% is already in the correct org (or not found)', stray_email;
    END IF;

    -- 2. Inspect Enrollments for steven@stevenmale.com
    SELECT id INTO user_record FROM profiles WHERE email = target_user_email;
    
    RAISE NOTICE '--- ENROLLMENT INSPECTION FOR % ---', target_user_email;
    
    FOR enrollment_record IN SELECT * FROM user_courses WHERE user_id = user_record.id LOOP
        -- Check if this course exists in the org
        SELECT * INTO course_record FROM courses WHERE id = enrollment_record.course_id;
        
        IF course_record.id IS NOT NULL THEN
            RAISE NOTICE 'Enrolled in VALID Course: % (ID: %) - Org: %', course_record.title, course_record.id, course_record.org_id;
            
            IF course_record.org_id != main_org_id THEN
                 RAISE NOTICE 'WARNING: Course is in WRONG Org (%)', course_record.org_id;
            END IF;
        ELSE
            RAISE NOTICE 'Enrolled in INVALID/MISSING Course ID: % (This causes "Unknown Track")', enrollment_record.course_id;
            
            -- AUTO-FIX: If invalid, try to find a matching course title in the current org and re-map
            -- For now, we just report.
        END IF;
    END LOOP;
    
    -- 3. List Available Courses in Main Org (for reference)
    RAISE NOTICE '--- AVAILABLE COURSES IN ORG % ---', main_org_id;
    FOR course_record IN SELECT * FROM courses WHERE org_id = main_org_id LOOP
        RAISE NOTICE 'Course: % (ID: %)', course_record.title, course_record.id;
    END LOOP;

END $$;
