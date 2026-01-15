
-- Add missing columns to user_courses to support Custom Courses and Skeleton/Generating states

-- 1. Title (for courses without a course_id or just to override)
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS title text;

-- 2. Description
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS description text;

-- 3. Structure (for storing the course structure directly on the user_course)
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS structure jsonb;

-- 4. Status (Already added, but verifying)
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 5. Ensure RLS doesn't block inserts (Optional safety, usually covered by existing policies)
-- This part is just a comment, assuming RLS is handled elsewhere.
