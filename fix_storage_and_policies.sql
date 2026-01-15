-- 1. Create the 'lesson-content' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('lesson-content', 'lesson-content', true)
on conflict (id) do nothing;

-- 2. Allow Public Read Access (so images can be viewed in the app)
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'lesson-content' );

-- 3. Allow Authenticated Insert (so logged-in users can upload)
drop policy if exists "Authenticated Insert" on storage.objects;
create policy "Authenticated Insert"
  on storage.objects for insert
  with check ( bucket_id = 'lesson-content' and auth.role() = 'authenticated' );

-- 4. Allow Authenticated Update (optional, mainly for overwriting if needed)
drop policy if exists "Authenticated Update" on storage.objects;
create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'lesson-content' and auth.role() = 'authenticated' );

-- 5. Allow Authenticated Delete (optional)
drop policy if exists "Authenticated Delete" on storage.objects;
create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'lesson-content' and auth.role() = 'authenticated' );
