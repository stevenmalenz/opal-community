-- Quick fix for course generation error
-- Run this if you haven't run ULTIMATE_RLS_FIX.sql yet

-- Allow course inserts
DROP POLICY IF EXISTS "allow_authenticated_all_courses" ON courses;

CREATE POLICY "allow_authenticated_all_courses"
  ON courses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
