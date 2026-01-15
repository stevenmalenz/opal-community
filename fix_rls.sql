-- FIX RLS POLICIES TO ALLOW DATA VISIBILITY

-- 1. Fix Profiles Policy (avoid infinite recursion and allow visibility)
drop policy if exists "Public profiles are viewable by org members." on profiles;
drop policy if exists "Public profiles are viewable by everyone." on profiles;

-- Allow logged-in users to view all profiles (simpler and safer for MVP to ensure joins work)
create policy "Profiles viewable by authenticated users"
  on profiles for select
  to authenticated
  using ( true );

-- 2. Verify and Simplify Question Policies
drop policy if exists "Questions viewable by org members" on questions;

create policy "Questions viewable by authenticated users"
  on questions for select
  to authenticated
  using ( true );

-- 3. Verify and Simplify Submission Policies
drop policy if exists "Submissions viewable by org members" on submissions;

create policy "Submissions viewable by authenticated users"
  on submissions for select
  to authenticated
  using ( true );

-- 4. Verify Update/Delete Policies for Questions (for the Edit/Delete feature)
drop policy if exists "Users can update own questions" on questions;
drop policy if exists "Users can delete own questions" on questions;

create policy "Users can update own questions"
  on questions for update
  using ( auth.uid() = user_id );

create policy "Users can delete own questions"
  on questions for delete
  using ( auth.uid() = user_id );
