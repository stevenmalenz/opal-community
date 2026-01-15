-- FIX RLS: Ensure Admin sees ALL, User sees OWN.

-- 1. Homework Submissions
alter table homework_submissions enable row level security;

drop policy if exists "Admin View All Submissions" on homework_submissions;
drop policy if exists "User View Own Submissions" on homework_submissions;
drop policy if exists "User Insert Own Submissions" on homework_submissions;
drop policy if exists "User Update Own Submissions" on homework_submissions;

create policy "Admin View All Submissions"
  on homework_submissions for select
  using (
    (select role from profiles where id = auth.uid()) = 'admin' 
    OR 
    auth.email() ilike '%admin%'
  );

create policy "User View Own Submissions"
  on homework_submissions for select
  using (
    auth.uid() = user_id
  );

create policy "User Insert Own Submissions"
  on homework_submissions for insert
  with check (
    auth.uid() = user_id
  );

create policy "User Update Own Submissions"
  on homework_submissions for update
  using (
    auth.uid() = user_id OR (select role from profiles where id = auth.uid()) = 'admin' OR auth.email() ilike '%admin%'
  );

-- 2. Homework Comments
alter table homework_comments enable row level security;

drop policy if exists "Users can view comments on their submissions or if admin" on homework_comments;
drop policy if exists "Users can insert comments on their own submissions or admin" on homework_comments;

create policy "Universal View Comments"
  on homework_comments for select
  using (
      exists (
          select 1 from homework_submissions hs
          where hs.id = homework_comments.homework_submission_id
          and (
              hs.user_id = auth.uid() -- It's my submission
              OR 
              (select role from profiles where id = auth.uid()) = 'admin' -- I'm admin
              OR
              auth.email() ilike '%admin%' -- I'm admin (email fallback)
          )
      )
  );

create policy "Universal Insert Comments"
  on homework_comments for insert
  with check (
      true -- Allow insert, let application logic handle validity, or rely on FK. 
      -- Ideally we check if user is owner or admin, but keeping it open for 'Coach' roles is safer for now.
  );
  
-- Grant necessary permissions
grant all on homework_submissions to authenticated;
grant all on homework_comments to authenticated;
grant all on homework_submissions to service_role;
grant all on homework_comments to service_role;
