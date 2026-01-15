-- FIX RELATIONSHIPS SCRIPT
-- The Frontend queries use `.select('*, profiles:user_id(...)')`.
-- For this to work, PostgREST needs a Foreign Key specifically pointing to the `profiles` table.
-- Currently, they point to `auth.users`, which breaks the automatic join inference.

-- 1. Fix Cohort Homework
alter table cohort_homework
drop constraint if exists cohort_homework_user_id_fkey;

alter table cohort_homework
add constraint cohort_homework_user_id_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;


-- 2. Fix Q&A Questions
alter table questions
drop constraint if exists questions_user_id_fkey;

alter table questions
add constraint questions_user_id_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;


-- 3. Fix Lesson Submissions
alter table submissions
drop constraint if exists submissions_user_id_fkey;

alter table submissions
add constraint submissions_user_id_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;


-- 4. Fix Comments (Q&A)
alter table comments
drop constraint if exists comments_user_id_fkey;

alter table comments
add constraint comments_user_id_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;

-- 5. Fix Votes (Q&A)
alter table votes
drop constraint if exists votes_user_id_fkey;

alter table votes
add constraint votes_user_id_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;

-- Verify/Ensure Profiles Exists (Safety check logic, though we can't do conditional logic easily in pure SQL script without plpgsql)
-- Assuming 'profiles' table exists as it's core to the app.
