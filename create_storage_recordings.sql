-- Create a storage bucket for session recordings
insert into storage.buckets (id, name, public)
values ('session_recordings', 'session_recordings', true)
on conflict (id) do nothing;

-- Remove existing policies if any to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Uploads" on storage.objects;
drop policy if exists "Owners Update" on storage.objects;
drop policy if exists "Owners Delete" on storage.objects;

-- Policy: Allow public read access to the bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'session_recordings' );

-- Policy: Allow authenticated users to upload files
create policy "Authenticated Uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'session_recordings' );

-- Policy: Allow users to update their own files
create policy "Owners Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'session_recordings' and owner = auth.uid() );

-- Policy: Allow users to delete their own files
create policy "Owners Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'session_recordings' and owner = auth.uid() );
