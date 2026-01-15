-- Create user_courses table to track course assignments
create table if not exists user_courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  course_id uuid references courses(id) on delete cascade not null,
  role text default 'learner', -- 'learner', 'instructor'
  assigned_at timestamptz default now(),
  unique(user_id, course_id)
);

-- Enable RLS
alter table user_courses enable row level security;

-- Policies for user_courses

-- Org members can view assignments in their org
create policy "Org members can view assignments"
  on user_courses for select
  using (
    exists (
      select 1 from courses c
      join profiles p on p.org_id = c.org_id
      where c.id = user_courses.course_id
      and p.id = auth.uid()
    )
  );

-- Admins can manage assignments for their org's courses
create policy "Admins can insert assignments"
  on user_courses for insert
  with check (
    exists (
      select 1 from courses c
      join profiles p on p.org_id = c.org_id
      where c.id = user_courses.course_id
      and p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create policy "Admins can delete assignments"
  on user_courses for delete
  using (
    exists (
      select 1 from courses c
      join profiles p on p.org_id = c.org_id
      where c.id = user_courses.course_id
      and p.id = auth.uid()
      and p.role = 'admin'
    )
  );
