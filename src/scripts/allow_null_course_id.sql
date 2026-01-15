
-- Allow course_id to be NULL in user_courses
-- This is required for "Custom Courses" that are defined directly in user_courses
-- or for the "Generating..." placeholder state.

ALTER TABLE user_courses ALTER COLUMN course_id DROP NOT NULL;
