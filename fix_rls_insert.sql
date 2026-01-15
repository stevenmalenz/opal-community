-- Fix RLS policies to allow inserts

-- Allow authenticated users to create organizations
drop policy if exists "Admins can create organizations." on organizations;
create policy "Admins can create organizations."
  on organizations for insert
  with check ( auth.role() = 'authenticated' );

-- Allow admins to insert content
drop policy if exists "Admins can insert content." on content;
create policy "Admins can insert content."
  on content for insert
  with check ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );
