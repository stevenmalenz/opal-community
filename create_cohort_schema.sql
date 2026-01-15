-- COHORTS SCHEMA

-- 1. COHORTS TABLE
create table if not exists public.cohorts (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  name text not null,
  description text,
  start_date date,
  end_date date,
  meeting_url text, -- Zoom/Meet link
  cover_image text,
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. COHORT MEMBERS (Who is in the cohort)
create table if not exists public.cohort_members (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts on delete cascade,
  user_id uuid references auth.users not null,
  role text default 'student' check (role in ('student', 'teacher', 'facilitator')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cohort_id, user_id)
);

-- 3. COHORT SESSIONS (Classes/Meetings)
create table if not exists public.cohort_sessions (
  id uuid default uuid_generate_v4() primary key,
  cohort_id uuid references public.cohorts on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamp with time zone,
  recording_url text,
  transcript text,
  summary text, -- AI Generated summary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE RLS
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.cohort_sessions enable row level security;

-- POLICIES (Simplified for MVP, assuming Authenticated users can see cohorts in their Org)

-- Cohorts Policies
create policy "Cohorts viewable by authenticated users"
  on cohorts for select
  to authenticated
  using ( true ); -- In real app, restrict to org_id

create policy "Admins can create cohorts"
  on cohorts for insert
  to authenticated
  with check ( true ); -- In real app, check role=admin

-- Members Policies
create policy "Members viewable by authenticated users"
  on cohort_members for select
  to authenticated
  using ( true );

create policy "Admins can manage members"
  on cohort_members for all
  to authenticated
  using ( true );

-- Sessions Policies
create policy "Sessions viewable by authenticated users"
  on cohort_sessions for select
  to authenticated
  using ( true );

create policy "Admins can manage sessions"
  on cohort_sessions for all
  to authenticated
  using ( true );
