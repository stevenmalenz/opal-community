-- Create user_progress table to track lesson completion
create table if not exists user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  course_id uuid references courses(id) on delete cascade not null,
  module_id text not null,
  lesson_id text not null,
  completed_at timestamptz default now(),
  unique(user_id, course_id, lesson_id)
);

-- Enable RLS
alter table user_progress enable row level security;

-- Policies for user_progress

-- Users can view their own progress
create policy "Users can view own progress"
  on user_progress for select
  using (auth.uid() = user_id);

-- Users can insert/update their own progress
create policy "Users can update own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress update"
  on user_progress for update
  using (auth.uid() = user_id);
