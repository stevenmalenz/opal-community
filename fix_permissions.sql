-- ULTIMATE FIX SCRIPT
-- Run this in Supabase SQL Editor to resolve all permission and visibility issues.

----------------------------------------------------------------
-- 1. FIX MISSING ORGANIZATIONS (Critical for Q&A and Lessons)
----------------------------------------------------------------
-- Insert a default organization if none exists
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000000', 'Default Organization')
on conflict do nothing;

-- Assign this organization to any user who doesn't have one
update profiles 
set org_id = '00000000-0000-0000-0000-000000000000' 
where org_id is null;

----------------------------------------------------------------
-- 2. FIX HOMEWORK PERMISSIONS (Cohort Sessions)
----------------------------------------------------------------
-- Drop old restrictve policies
drop policy if exists "Users view own homework" on cohort_homework;
drop policy if exists "Users create own homework" on cohort_homework;
drop policy if exists "Users update own homework" on cohort_homework;
drop policy if exists "Admins view all homework" on cohort_homework;
drop policy if exists "View all homework" on cohort_homework;
drop policy if exists "Manage own homework" on cohort_homework;

-- Allow everyone to view all homework (Class Submissions)
create policy "View all cohort homework"
on cohort_homework for select
to authenticated
using ( true );

-- Allow users to manage their own
create policy "Manage own cohort homework"
on cohort_homework for all
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );


----------------------------------------------------------------
-- 3. FIX Q&A PERMISSIONS
----------------------------------------------------------------
drop policy if exists "Questions viewable by org members" on questions;
drop policy if exists "Users can create questions" on questions;
drop policy if exists "View all questions" on questions;
drop policy if exists "Manage own questions" on questions;

-- Allow everyone to view questions
create policy "View all questions"
on questions for select
to authenticated
using ( true );

-- Allow users to manage their own
create policy "Manage own questions"
on questions for all
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );


----------------------------------------------------------------
-- 4. FIX LESSON SUBMISSIONS (Module Lessons)
----------------------------------------------------------------
drop policy if exists "Submissions viewable by org members" on submissions;
drop policy if exists "Users can create submissions" on submissions;
drop policy if exists "Users can update own submissions" on submissions;

-- Allow everyone to view lesson submissions
create policy "View all lesson submissions"
on submissions for select
to authenticated
using ( true );

-- Allow users to manage their own lesson submissions
create policy "Manage own lesson submissions"
on submissions for all
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );


----------------------------------------------------------------
-- 5. FIX STORAGE PERMISSIONS (Video/Resources)
----------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('session_recordings', 'session_recordings', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('session_attachments', 'session_attachments', true) on conflict (id) do nothing;

drop policy if exists "Public Access All" on storage.objects;
drop policy if exists "Authenticated Uploads All" on storage.objects;

create policy "Public Access All"
on storage.objects for select
using ( bucket_id in ('session_recordings', 'session_attachments') );

create policy "Authenticated Uploads All"
on storage.objects for insert
to authenticated
with check ( bucket_id in ('session_recordings', 'session_attachments') );
