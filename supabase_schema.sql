-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Step 1: Create organizations table WITHOUT policies referencing profiles.org_id yet
create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  domain text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.organizations enable row level security;

-- Step 2: Add org_id to profiles FIRST
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'org_id'
  ) then
    alter table public.profiles add column org_id uuid references public.organizations;
  end if;
end $$;

-- Step 3: NOW create policies that reference org_id (column exists now)
drop policy if exists "Organizations are viewable by members." on organizations;
create policy "Organizations are viewable by members."
  on organizations for select
  using ( 
    exists (
      select 1 from profiles 
      where profiles.org_id = organizations.id 
      and profiles.id = auth.uid()
    )
  );

-- Update profiles policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Public profiles are viewable by org members." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

create policy "Public profiles are viewable by org members."
  on profiles for select
  using ( 
    org_id is null or org_id in (
      select org_id from profiles where id = auth.uid()
    )
  );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- CONTENT table
create table if not exists public.content (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  title text not null,
  url text,
  content_type text check (content_type in ('webpage', 'pdf', 'video', 'notion', 'slack')),
  raw_content text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.content enable row level security;

drop policy if exists "Content is viewable by org members." on content;
drop policy if exists "Admins can manage content." on content;

create policy "Content is viewable by org members."
  on content for select
  using ( 
    org_id in (
      select org_id from profiles where id = auth.uid()
    )
  );

create policy "Admins can manage content."
  on content for all
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.org_id = content.org_id
      and profiles.role = 'admin'
    )
  );

-- COURSES table
create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  name text not null,
  description text,
  structure jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.courses enable row level security;

drop policy if exists "Courses are viewable by org members." on courses;
drop policy if exists "Admins can manage courses." on courses;

create policy "Courses are viewable by org members."
  on courses for select
  using ( 
    org_id in (
      select org_id from profiles where id = auth.uid()
    )
  );

create policy "Admins can manage courses."
  on courses for all
  using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.org_id = courses.org_id
      and profiles.role = 'admin'
    )
  );

-- Add course_id to user_progress
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'user_progress' 
    and column_name = 'course_id'
  ) then
    alter table public.user_progress add column course_id uuid references public.courses(id);
  end if;
end $$;
