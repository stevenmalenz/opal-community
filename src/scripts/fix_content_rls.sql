
-- Enable RLS on content table
alter table content enable row level security;

-- Allow all authenticated users to view content
drop policy if exists "Authenticated users can view content" on content;
create policy "Authenticated users can view content"
  on content for select
  to authenticated
  using ( true );

-- Allow all authenticated users to insert content
drop policy if exists "Authenticated users can insert content" on content;
create policy "Authenticated users can insert content"
  on content for insert
  to authenticated
  with check ( true );

-- Allow all authenticated users to update content
drop policy if exists "Authenticated users can update content" on content;
create policy "Authenticated users can update content"
  on content for update
  to authenticated
  using ( true );
