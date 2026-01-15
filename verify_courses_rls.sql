-- Verify RLS policies for courses table
SELECT * FROM pg_policies WHERE tablename = 'courses';

-- Ensure authenticated users can insert
DROP POLICY IF EXISTS "allow_authenticated_insert_courses" ON courses;
CREATE POLICY "allow_authenticated_insert_courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure authenticated users can select
DROP POLICY IF EXISTS "allow_authenticated_select_courses" ON courses;
CREATE POLICY "allow_authenticated_select_courses"
ON courses FOR SELECT
TO authenticated
USING (true);
