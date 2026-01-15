-- ============================================
-- COMPREHENSIVE RLS POLICY FIX
-- This removes all existing policies and sets up complete, working policies
-- ============================================

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
drop policy if exists "Organizations are viewable by members." on organizations;
drop policy if exists "Admins can create organizations." on organizations;
drop policy if exists "Admins can update organizations." on organizations;

-- Anyone authenticated can create an org (for signup)
create policy "Anyone can create organizations"
  on organizations for insert
  with check ( auth.role() = 'authenticated' );

-- Members can view their org
create policy "Members can view their organization"
  on organizations for select
  using ( 
    id in (
      select org_id from profiles where id = auth.uid()
    )
  );

-- Admins can update their org
create policy "Admins can update their organization"
  on organizations for update
  using ( 
    id in (
      select org_id from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- PROFILES TABLE
-- ============================================
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Public profiles are viewable by org members." on profiles;
drop policy if exists "Profiles are viewable by authenticated users." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Authenticated users can see all profiles (simplified)
create policy "Authenticated users can view profiles"
  on profiles for select
  using ( auth.role() = 'authenticated' );

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- Users can update their own profile
create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- ============================================
-- CONTENT TABLE
-- ============================================
drop policy if exists "Content is viewable by org members." on content;
drop policy if exists "Admins can manage content." on content;
drop policy if exists "Admins can insert content." on content;

-- Org members can view their org's content
create policy "Org members can view content"
  on content for select
  using ( 
    org_id in (
      select org_id from profiles where id = auth.uid()
    )
  );

-- Authenticated users can insert content (we check admin role in app)
create policy "Authenticated users can insert content"
  on content for insert
  with check ( auth.role() = 'authenticated' );

-- Admins can update their org's content
create policy "Admins can update content"
  on content for update
  using ( 
    org_id in (
      select org_id from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete their org's content
create policy "Admins can delete content"
  on content for delete
  using ( 
    org_id in (
      select org_id from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- COURSES TABLE
-- ============================================
drop policy if exists "Courses are viewable by org members." on courses;
drop policy if exists "Admins can manage courses." on courses;

-- Org members can view their org's courses
create policy "Org members can view courses"
  on courses for select
  using ( 
    org_id in (
      select org_id from profiles where id = auth.uid()
    )
  );

-- Authenticated users can insert courses (we check admin role in app)
create policy "Authenticated users can insert courses"
  on courses for insert
  with check ( auth.role() = 'authenticated' );

-- Admins can update their org's courses
create policy "Admins can update courses"
  on courses for update
  using ( 
    org_id in (
      select org_id from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete their org's courses
create policy "Admins can delete courses"
  on courses for delete
  using ( 
    org_id in (
      select org_id from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- USER_PROGRESS TABLE
-- ============================================
drop policy if exists "Users can view own progress." on user_progress;
drop policy if exists "Users can insert own progress." on user_progress;
drop policy if exists "Users can update own progress." on user_progress;

create policy "Users can view their own progress"
  on user_progress for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own progress"
  on user_progress for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own progress"
  on user_progress for update
  using ( auth.uid() = user_id );

-- ============================================
-- SKILL_SCORES TABLE
-- ============================================
drop policy if exists "Users can view own scores." on skill_scores;
drop policy if exists "Users can update own scores." on skill_scores;

create policy "Users can view their own scores"
  on skill_scores for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own scores"
  on skill_scores for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own scores"
  on skill_scores for update
  using ( auth.uid() = user_id );
