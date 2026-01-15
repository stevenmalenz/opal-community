-- FIX COURSE DELETION RPC V2 (Handles Custom Tracks)
-- "Custom Courses" are stored as user_courses rows with no parent course. 
-- This function detects the ID type and deletes accordingly.

CREATE OR REPLACE FUNCTION public.delete_course_by_id(course_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_user_id uuid;
    course_org_id uuid;
    is_admin boolean;
    target_type text; -- 'course' or 'user_course'
BEGIN
    curr_user_id := auth.uid();

    -- 1. Identify Target
    -- Check if it's a Global Course
    SELECT org_id INTO course_org_id FROM public.courses WHERE id = course_uuid;

    IF course_org_id IS NOT NULL THEN
        target_type := 'course';
    ELSE
        -- Check if it's a Custom User Course (Legacy/Custom Track)
        -- We need the org_id of the USER who owns this enrollment
        SELECT p.org_id INTO course_org_id 
        FROM public.user_courses uc
        JOIN public.profiles p ON p.id = uc.user_id
        WHERE uc.id = course_uuid;

        IF course_org_id IS NOT NULL THEN
            target_type := 'user_course';
        ELSE
            RAISE EXCEPTION 'Course or Track not found (ID: %)', course_uuid;
        END IF;
    END IF;

    -- 2. Verify Admin Privileges
    -- User must be admin of the organization that owns the data
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = curr_user_id
        AND org_id = course_org_id
        AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access Denied: You must be an Organization Admin.';
    END IF;

    -- 3. Execute Deletion
    IF target_type = 'course' THEN
        -- Delete User Progress (Text ID match)
        DELETE FROM public.user_progress WHERE course_id = course_uuid::text;
        -- Delete Submissions
        DELETE FROM public.submissions WHERE course_id = course_uuid;
        -- Delete Assignments
        DELETE FROM public.user_courses WHERE course_id = course_uuid;
        -- Delete Course
        DELETE FROM public.courses WHERE id = course_uuid;
        
    ELSIF target_type = 'user_course' THEN
        -- Linkage check: Custom courses use their own ID as the 'course_id' in user_progress
        DELETE FROM public.user_progress WHERE course_id = course_uuid::text;
        
        -- Delete the user_course row itself
        DELETE FROM public.user_courses WHERE id = course_uuid;
    END IF;

END;
$$;
