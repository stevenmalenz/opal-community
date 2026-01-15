-- FIX COURSE DELETION RPC (NUCLEAR OPTION)
-- Creates a secure server-side function to delete courses and all related data, bypassing RLS.

CREATE OR REPLACE FUNCTION public.delete_course_by_id(course_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/superuser), bypassing RLS
AS $$
DECLARE
    curr_user_id uuid;
    course_org_id uuid;
    is_admin boolean;
BEGIN
    -- 1. Get current user
    curr_user_id := auth.uid();

    -- 2. Verify Permission: Is the user an admin of the course's org?
    SELECT org_id INTO course_org_id FROM public.courses WHERE id = course_uuid;

    IF course_org_id IS NULL THEN
        RAISE EXCEPTION 'Course not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = curr_user_id
        AND org_id = course_org_id
        AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Access Denied: You must be an Organization Admin to delete courses.';
    END IF;

    -- 3. Perform Deletion (Order matters for Foreign Keys without Cascade)

    -- A. Delete User Progress (Handling Text ID Mismatch)
    DELETE FROM public.user_progress WHERE course_id = course_uuid::text;

    -- B. Delete Submissions
    DELETE FROM public.submissions WHERE course_id = course_uuid;

    -- C. Delete User Courses (Assignments)
    DELETE FROM public.user_courses WHERE course_id = course_uuid;
    
    -- D. Delete Content/Modules if stored separately? (Assuming JSON structure in courses table)
    -- If there were a 'modules' table, we'd delete here. Currently seems to be JSON in 'courses'.

    -- E. Finally, Delete the Course
    DELETE FROM public.courses WHERE id = course_uuid;

END;
$$;
