-- FIX COURSE DELETION RLS
-- Updated to remove reference to non-existent 'created_by' column

-- 1. Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 2. Allow Admins to DELETE courses
-- We join with profiles to check if the user is an Admin of the same Org.
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

CREATE POLICY "Admins can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.org_id = courses.org_id
        AND p.role = 'admin'
    )
  );

-- 3. Verify user_courses delete policy
-- Ensure admins can delete user_courses (assignments) directly
DROP POLICY IF EXISTS "Admins can delete user_courses" ON user_courses;

CREATE POLICY "Admins can delete user_courses"
  ON user_courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN courses c ON c.id = user_courses.course_id
        WHERE p.id = auth.uid()
        AND p.org_id = c.org_id
        AND p.role = 'admin'
    )
  );
