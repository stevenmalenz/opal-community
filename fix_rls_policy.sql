-- Remove the recursive policy and replace with a simple one
drop policy if exists "Public profiles are viewable by org members." on profiles;

-- Simple policy: authenticated users can see all profiles
-- We'll filter by org_id at the application level instead
create policy "Profiles are viewable by authenticated users."
  on profiles for select
  using ( auth.role() = 'authenticated' );
