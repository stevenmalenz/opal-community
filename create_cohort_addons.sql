-- Add resources column to cohort_sessions if it doesn't exist
alter table cohort_sessions 
add column if not exists resources jsonb default '[]'::jsonb;

-- Create cohort_homework table
create table if not exists cohort_homework (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references cohort_sessions(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    content text, -- URL or text submission
    feedback text, -- Admin feedback
    status text default 'submitted', -- submitted, reviewed
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table cohort_homework enable row level security;

-- Policies for Homework
-- Users can view their own homework
create policy "Users view own homework"
on cohort_homework for select
to authenticated
using ( auth.uid() = user_id );

-- Users can create their own homework
create policy "Users create own homework"
on cohort_homework for insert
to authenticated
with check ( auth.uid() = user_id );

-- Users can update their own homework (if not reviewed? strictly speaking yes, but keeping simple)
create policy "Users update own homework"
on cohort_homework for update
to authenticated
using ( auth.uid() = user_id );

-- Admins can view all homework (simplified for MVP: allow public read if admin logic is handled in app, or checking profile role)
-- For true security, we need a lookup.
-- Simplification: If you can see the session, you check RLS. 
-- Let's rely on the app logic for Admin visibility for now or use a broad policy if the user is admin.
-- Ideally: 
-- create policy "Admins view all" on cohort_homework using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Admins view all homework"
on cohort_homework for select
to authenticated
using ( 
    exists (
        select 1 from profiles 
        where profiles.id = auth.uid() 
        and profiles.role = 'admin'
    )
);

create policy "Admins update feedback"
on cohort_homework for update
to authenticated
using ( 
    exists (
        select 1 from profiles 
        where profiles.id = auth.uid() 
        and profiles.role = 'admin'
    )
);

-- Storage bucket for resources (attachments)
insert into storage.buckets (id, name, public)
values ('session_attachments', 'session_attachments', true)
on conflict (id) do nothing;

create policy "Public Access Attachments"
on storage.objects for select
using ( bucket_id = 'session_attachments' );

create policy "Authenticated Uploads Attachments"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'session_attachments' );
