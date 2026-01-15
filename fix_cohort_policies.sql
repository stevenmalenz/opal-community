-- Fix RLS policies to allow Deletion and Member Management

-- 1. Allow Admins (or creators) to DELETE cohorts
-- Existing policy was only for INSERT/SELECT. we need DELETE.
-- We'll use a broad policy for Authenticated users to DELETE for now, relying on frontend checks or ownership.
-- In a real prod app, checking `created_by` or `org_id` role would be better.
-- For this MVP/Demo:
create policy "Authenticated users can delete cohorts"
  on cohorts for delete
  to authenticated
  using ( true );

-- 2. Allow Authenticated users (Admins) to INSERT members
-- Existing policy was: create policy "Admins can manage members" on cohort_members for all ... using (true);
-- So member insertion *should* work if that policy exists.
-- But let's make sure.
drop policy if exists "Admins can manage members" on public.cohort_members;

create policy "Admins can manage members"
  on public.cohort_members for all
  to authenticated
  using ( true )
  with check ( true );

-- 3. Ensure Cascade works by verifying FK constraints (This is schema, not policy, but good to note)
-- The schema definition had "on delete cascade" for cohort_sessions and cohort_members.
-- If deletion still fails, it might be RLS on the *child* tables preventing deletion?
-- Postgres RLS is checked on child rows during cascade delete.
-- So we need DELETE policies on child tables too!

create policy "Authenticated users can delete cohort members"
  on cohort_members for delete
  to authenticated
  using ( true );

create policy "Authenticated users can delete cohort sessions"
  on cohort_sessions for delete
  to authenticated
  using ( true );
