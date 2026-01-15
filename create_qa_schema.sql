-- Q&A AND HOMEWORK SCHEMA

-- 1. QUESTIONS TABLE (Reddit-style)
create table if not exists public.questions (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  user_id uuid references auth.users not null,
  title text not null,
  content text, -- Rich text HTML/Markdown
  upvotes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SUBMISSIONS TABLE (Homework)
create table if not exists public.submissions (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  user_id uuid references auth.users not null,
  course_id uuid references public.courses, -- Optional link to course
  module_id text, -- string ID from the JSON structure
  lesson_id text, -- string ID from the JSON structure
  content text, -- Rich text
  status text default 'pending' check (status in ('pending', 'reviewed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COMMENTS TABLE (Polymorphic: for Questions OR Submissions)
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  question_id uuid references public.questions on delete cascade,
  submission_id uuid references public.submissions on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure comment belongs to exactly one parent type
  constraint comment_parent_check check (
    (question_id is not null and submission_id is null) or
    (question_id is null and submission_id is not null)
  )
);

-- 4. VOTES TABLE (To track user votes and prevent duplicates)
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  question_id uuid references public.questions on delete cascade,
  comment_id uuid references public.comments on delete cascade,
  value int not null check (value in (1, -1)), -- +1 or -1
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, question_id), -- One vote per question per user
  unique(user_id, comment_id),   -- One vote per comment per user
  constraint vote_target_check check (
    (question_id is not null and comment_id is null) or
    (question_id is null and comment_id is not null)
  )
);

-- RLS POLICIES

-- Enable RLS
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;

-- QUESTIONS Policies
create policy "Questions viewable by org members" on questions
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.org_id = questions.org_id)
  );

create policy "Users can create questions" on questions
  for insert with check ( auth.uid() = user_id );

create policy "Users can update own questions" on questions
  for update using ( auth.uid() = user_id );

-- SUBMISSIONS Policies
-- Public within the org (so students can see each other's work)
create policy "Submissions viewable by org members" on submissions
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.org_id = submissions.org_id)
  );

create policy "Users can create submissions" on submissions
  for insert with check ( auth.uid() = user_id );

create policy "Users can update own submissions" on submissions
  for update using ( auth.uid() = user_id );

-- COMMENTS Policies
create policy "Comments are viewable by everyone" on comments
  for select using ( true ); -- Simplified, usually depends on parent visibility but good enough for MVP

create policy "Users can create comments" on comments
  for insert with check ( auth.uid() = user_id );

-- VOTES Policies
create policy "Votes are viewable by everyone" on votes
  for select using ( true );

create policy "Users can vote" on votes
  for insert with check ( auth.uid() = user_id );

create policy "Users can change vote" on votes
  for update using ( auth.uid() = user_id );

create policy "Users can remove vote" on votes
  for delete using ( auth.uid() = user_id );
