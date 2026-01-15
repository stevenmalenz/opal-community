-- FIX COURSE DELETION V2
-- Addresses the "text vs uuid" type mismatch error and missing CASCADE deletion.

-- 1. FIX SUBMISSIONS (The likely blocker)
-- Submissions has course_id as UUID (based on schema) but lacks ON DELETE CASCADE.
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

-- Re-add with CASCADE (This will succeed as both are UUID)
ALTER TABLE public.submissions
ADD CONSTRAINT submissions_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES public.courses(id)
ON DELETE CASCADE;


-- 2. FIX USER_COURSES (Ensure Cascade)
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


-- 3. FIX USER_PROGRESS (The source of the error)
-- constraint "user_progress_course_id_fkey" cannot be implemented because course_id is TEXT.
-- Instead of a Foreign Key, we will use a TRIGGER to clean up orphans.

-- First, drop any pending invalid constraints if they partially exist (unlikely but safe)
DO $$
BEGIN
    ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_course_id_fkey;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create Trigger Function to delete progress when a course is deleted
CREATE OR REPLACE FUNCTION public.cascade_delete_course_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Cast OLD.id (UUID) to TEXT to match user_progress.course_id
    DELETE FROM public.user_progress WHERE course_id = OLD.id::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_course_delete_progress ON public.courses;
CREATE TRIGGER on_course_delete_progress
    AFTER DELETE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.cascade_delete_course_progress();

