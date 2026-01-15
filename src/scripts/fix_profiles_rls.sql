-- FIX PROFILES RLS
-- The previous user_courses policy relies on querying 'profiles'.
-- If profiles is restricted, the join fails.

-- 1. Enable RLS on profiles (if not already)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Org members can view team profiles" ON profiles;

-- 3. Allow viewing profiles in same org
CREATE POLICY "Org members can view team profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id -- Own profile
  OR
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) -- Same org
);

-- 4. Allow Admins to update profiles in same org (e.g. changing roles)
CREATE POLICY "Admins can update team profiles" ON profiles
FOR UPDATE USING (
  auth.uid() = id -- Own
  OR
  (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- 5. Re-apply user_courses policy just in case (idempotent-ish)
DROP POLICY IF EXISTS "Org members can view team enrollments" ON user_courses;
CREATE POLICY "Org members can view team enrollments" ON user_courses
FOR SELECT USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM profiles viewer
    JOIN profiles target ON target.org_id = viewer.org_id
    WHERE viewer.id = auth.uid() AND target.id = user_courses.user_id
  )
);
