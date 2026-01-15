-- Create a specific table for homework comments to avoid FK conflicts with legacy exclusions
create table if not exists homework_comments (
  id uuid default gen_random_uuid() primary key,
  homework_submission_id uuid references homework_submissions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table homework_comments enable row level security;

-- Policies
create policy "Users can view comments on their submissions or if admin"
  on homework_comments for select
  using (
    exists (
      select 1 from homework_submissions
      where homework_submissions.id = homework_comments.homework_submission_id
      and (homework_submissions.user_id = auth.uid() or exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and (profiles.role = 'admin' or auth.email() ilike '%admin%')
      ))
    )
  );

create policy "Users can insert comments on their own submissions or admin"
  on homework_comments for insert
  with check (
    exists (
      select 1 from homework_submissions
      where homework_submissions.id = homework_comments.homework_submission_id
      and (homework_submissions.user_id = auth.uid() or exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and (profiles.role = 'admin' or auth.email() ilike '%admin%')
      ))
    )
  );

-- Grant access
grant all on homework_comments to authenticated;
grant all on homework_comments to service_role;
