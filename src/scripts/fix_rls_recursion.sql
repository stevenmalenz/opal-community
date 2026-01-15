-- FIX INFINITE RECURSION IN RLS
-- The issue is that checking "my org id" by querying the profiles table triggers the profiles RLS policy again.
-- Solution: Use a SECURITY DEFINER function to get the org_id without triggering RLS.

-- 1. Create Helper Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

-- 2. Fix Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view team profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update team profiles" ON profiles;

-- Allow viewing own profile OR profiles in same org (using helper)
CREATE POLICY "Org members can view team profiles" ON profiles
FOR SELECT USING (
  auth.uid() = id 
  OR
  org_id = get_my_org_id()
);

-- Allow Admins to update profiles in same org
CREATE POLICY "Admins can update team profiles" ON profiles
FOR UPDATE USING (
  auth.uid() = id
  OR
  (
    org_id = get_my_org_id()
    AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- 3. Fix User Courses RLS (Use helper to avoid join recursion if possible, or keep join now that profiles is fixed)
-- We can simplify it now that we have the helper
DROP POLICY IF EXISTS "Org members can view team enrollments" ON user_courses;

CREATE POLICY "Org members can view team enrollments" ON user_courses
FOR SELECT USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM profiles target
    WHERE target.id = user_courses.user_id
    AND target.org_id = get_my_org_id()
  )
);

-- 4. Fix Courses RLS (Use helper)
DROP POLICY IF EXISTS "Org members can view courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

CREATE POLICY "Org members can view courses" ON courses
FOR SELECT USING (
    org_id IS NULL 
    OR
    org_id = get_my_org_id()
);

CREATE POLICY "Admins can manage courses" ON courses
FOR ALL USING (
    org_id = get_my_org_id()
    AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
