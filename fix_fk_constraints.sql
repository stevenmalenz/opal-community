-- FIX FOREIGN KEY CONSTRAINTS TO ALLOW DELETION
-- Problem: Deleting a course fails because 'user_progress' and 'submissions' reference it without ON DELETE CASCADE.
-- Solution: Drop existing foreign keys and re-add them with CASCADE.

-- 1. FIX USER_PROGRESS
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name for course_id on user_progress
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.user_progress'::regclass
    AND confrelid = 'public.courses'::regclass
    AND contype = 'f';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_progress DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add it back with CASCADE
ALTER TABLE public.user_progress
ADD CONSTRAINT user_progress_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES public.courses(id)
ON DELETE CASCADE;


-- 2. FIX SUBMISSIONS (if linkage exists)
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.submissions'::regclass
    AND confrelid = 'public.courses'::regclass
    AND contype = 'f';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.submissions DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.submissions
ADD CONSTRAINT submissions_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES public.courses(id)
ON DELETE CASCADE;

-- 3. VERIFY user_courses (It should already be CASCADE, but enforcing it ensures consistency)
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.user_courses'::regclass
    AND confrelid = 'public.courses'::regclass
    AND contype = 'f';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_courses DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.user_courses
ADD CONSTRAINT user_courses_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES public.courses(id)
ON DELETE CASCADE;
