-- FIX RLS POLICIES FOR MANAGER VISIBILITY

-- 1. Enable RLS on user_courses (ensure it's on)
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own enrollments" ON user_courses;
DROP POLICY IF EXISTS "Org members can view team enrollments" ON user_courses;

-- 3. Create comprehensive SELECT policy
-- Allows users to see:
-- a) Their own enrollments
-- b) Enrollments of users in the same organization
CREATE POLICY "Org members can view team enrollments" ON user_courses
FOR SELECT USING (
  auth.uid() = user_id -- Own data
  OR
  EXISTS ( -- Same Org data
    SELECT 1 FROM profiles viewer
    JOIN profiles target ON target.org_id = viewer.org_id
    WHERE viewer.id = auth.uid() AND target.id = user_courses.user_id
  )
);

-- 4. Create INSERT/UPDATE/DELETE policies for Admins
-- Allows Admins to manage enrollments for their org
CREATE POLICY "Admins can manage team enrollments" ON user_courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles viewer
    JOIN profiles target ON target.org_id = viewer.org_id
    WHERE viewer.id = auth.uid() 
    AND target.id = user_courses.user_id
    AND viewer.role = 'admin'
  )
);

-- 5. Ensure basic "Own data" modification policy exists for learners (e.g. updating progress)
CREATE POLICY "Users can update own progress" ON user_courses
FOR UPDATE USING (
  auth.uid() = user_id
);
