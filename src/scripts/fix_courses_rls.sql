
-- Enable RLS on courses table
alter table courses enable row level security;

-- Allow all authenticated users to view courses
drop policy if exists "Authenticated users can view courses" on courses;
create policy "Authenticated users can view courses"
  on courses for select
  to authenticated
  using ( true );

-- Allow all authenticated users to insert courses
drop policy if exists "Authenticated users can insert courses" on courses;
create policy "Authenticated users can insert courses"
  on courses for insert
  to authenticated
  with check ( true );

-- Allow all authenticated users to update courses
drop policy if exists "Authenticated users can update courses" on courses;
create policy "Authenticated users can update courses"
  on courses for update
  to authenticated
  using ( true );
