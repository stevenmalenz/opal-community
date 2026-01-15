-- COMPREHENSIVE FIX FOR ORG, COURSES, AND ENROLLMENTS (MINIMAL COLUMNS)

DO $$
DECLARE
    v_main_org_id uuid := '2477b1e5-9e48-4af4-832c-8d098ca563fa'; -- steven.male@hey.com's Org
    v_stray_email text := 'steven+learn@stevenmale.com';
    v_target_user_email text := 'steven@stevenmale.com';
    v_valid_course_id uuid;
    v_user_id uuid;
    v_stray_user_id uuid;
BEGIN
    RAISE NOTICE '--- STARTING COMPREHENSIVE FIX ---';

    -- 1. FIX COURSES RLS (Ensure visibility)
    -- Enable RLS
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    
    -- Drop restrictive policies
    DROP POLICY IF EXISTS "Org members can view courses" ON courses;
    DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
    
    -- Create visibility policy
    CREATE POLICY "Org members can view courses" ON courses
    FOR SELECT USING (
        org_id IS NULL -- Public templates
        OR
        org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) -- Same Org
    );
    
    -- Create management policy
    CREATE POLICY "Admins can manage courses" ON courses
    FOR ALL USING (
        org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
        AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    
    RAISE NOTICE 'Fixed Courses RLS policies';

    -- 2. CONSOLIDATE STRAY USER
    SELECT id INTO v_stray_user_id FROM profiles WHERE email = v_stray_email;
    IF v_stray_user_id IS NOT NULL THEN
        UPDATE profiles SET org_id = v_main_org_id WHERE id = v_stray_user_id AND org_id != v_main_org_id;
        RAISE NOTICE 'Moved stray user % to Org %', v_stray_email, v_main_org_id;
    END IF;

    -- 3. DEDUPLICATE COURSES (Keep the latest one in this Org)
    -- Find the latest course ID for "docs.airops.com Mastery" in this Org
    SELECT id INTO v_valid_course_id 
    FROM courses 
    WHERE org_id = v_main_org_id AND name ILIKE '%docs.airops.com Mastery%'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF v_valid_course_id IS NOT NULL THEN
        RAISE NOTICE 'Identified Valid Course ID: %', v_valid_course_id;
        
        -- Delete duplicates (older ones)
        DELETE FROM courses 
        WHERE org_id = v_main_org_id 
          AND name ILIKE '%docs.airops.com Mastery%'
          AND id != v_valid_course_id;
          
        RAISE NOTICE 'Deleted duplicate courses, kept %', v_valid_course_id;
        
        -- 4. FIX ENROLLMENT FOR LEARNER
        SELECT id INTO v_user_id FROM profiles WHERE email = v_target_user_email;
        
        IF v_user_id IS NOT NULL THEN
            -- Remove old/broken enrollments
            DELETE FROM user_courses WHERE user_id = v_user_id;
            
            -- Re-enroll in the valid course (MINIMAL COLUMNS)
            INSERT INTO user_courses (user_id, course_id, role)
            VALUES (v_user_id, v_valid_course_id, 'learner')
            ON CONFLICT (user_id, course_id) DO NOTHING;
            
            RAISE NOTICE 'Re-enrolled % in course %', v_target_user_email, v_valid_course_id;
        END IF;
        
        -- 5. FIX ENROLLMENT FOR STRAY USER (if they exist)
        IF v_stray_user_id IS NOT NULL THEN
             -- Remove old/broken enrollments
            DELETE FROM user_courses WHERE user_id = v_stray_user_id;
            
            -- Re-enroll (MINIMAL COLUMNS)
            INSERT INTO user_courses (user_id, course_id, role)
            VALUES (v_stray_user_id, v_valid_course_id, 'learner')
            ON CONFLICT (user_id, course_id) DO NOTHING;
             RAISE NOTICE 'Re-enrolled % in course %', v_stray_email, v_valid_course_id;
        END IF;
        
    ELSE
        RAISE NOTICE 'WARNING: No valid course found in this Org. Cannot fix enrollments.';
    END IF;

END $$;
