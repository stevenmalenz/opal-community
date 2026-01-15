-- Create invites table
create table if not exists public.invites (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  email text not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.invites enable row level security;

-- Policies
drop policy if exists "Invites are viewable by org members." on invites;
drop policy if exists "Admins can create invites." on invites;

create policy "Invites are viewable by org members."
  on invites for select
  using ( 
    org_id in (
      select org_id from profiles where id = auth.uid()
    )
  );

create policy "Admins can create invites."
  on invites for insert
  with check (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.org_id = invites.org_id
      and profiles.role = 'admin'
    )
  );
