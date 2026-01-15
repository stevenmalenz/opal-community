-- FIX FEATURES SCRIPT
-- 1. Enable Upvoting safely
-- 2. Enable Comments on Cohort Homework

----------------------------------------------------------------
-- 1. UPVOTING FUNCTION (RPC)
----------------------------------------------------------------
-- We use a function to allow users to increment votes without giving them full update access to the questions table.
create or replace function vote_question(q_id uuid, value int)
returns void as $$
begin
  -- 1. Upsert vote record
  insert into votes (user_id, question_id, value)
  values (auth.uid(), q_id, value)
  on conflict (user_id, question_id) 
  do update set value = EXCLUDED.value;

  -- 2. Update question count
  -- We recalculate total just to be safe and consistent
  update questions
  set upvotes = (select coalesce(sum(value), 0) from votes where question_id = q_id)
  where id = q_id;
end;
$$ language plpgsql security definer;

-- Grant execute to everyone
grant execute on function vote_question to authenticated;
grant execute on function vote_question to anon;


----------------------------------------------------------------
-- 2. COHORT HOMEWORK COMMENTS
----------------------------------------------------------------
-- The existing comments table only linked to 'submissions' (Lesson Homework).
-- We need to link it to 'cohort_homework' as well.

alter table comments 
add column if not exists cohort_homework_id uuid references cohort_homework(id) on delete cascade;

-- Update the check constraint to allow this new parent type
alter table comments drop constraint if exists comment_parent_check;

alter table comments add constraint comment_parent_check check (
  (question_id is not null and submission_id is null and cohort_homework_id is null) or
  (question_id is null and submission_id is not null and cohort_homework_id is null) or
  (question_id is null and submission_id is null and cohort_homework_id is not null)
);

-- RLS should already be "View everyone, Insert own", which covers this new column automatically.
