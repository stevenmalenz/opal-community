-- 1. Robust Schema Migration (Standardize on course_id as TEXT)
do $$ 
begin 
    -- A. Drop Foreign Key constraint on course_id if it exists
    -- We need to support static program IDs (e.g., 'sales-program') which are not UUIDs in the courses table.
    -- Try to drop common constraint names.
    begin
        alter table public.user_progress drop constraint if exists user_progress_course_id_fkey;
    exception when others then null; end;

    -- B. Convert course_id to TEXT (if it exists and is UUID)
    if exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'course_id') then
        alter table public.user_progress alter column course_id type text;
    end if;

    -- C. Handle program_id -> course_id migration
    if exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'program_id') then
        -- Check if course_id ALSO exists (collision case)
        if exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'course_id') then
            -- Both exist. Migrate data from program_id to course_id where course_id is null.
            -- Cast program_id to text explicitly to be safe.
            update public.user_progress set course_id = program_id::text where course_id is null;
            -- Drop the old program_id column
            alter table public.user_progress drop column program_id;
        else
            -- Only program_id exists. Rename it to course_id.
            alter table public.user_progress rename column program_id to course_id;
        end if;
    end if;

    -- D. Ensure course_id column exists (if we started with neither)
    if not exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'course_id') then
        alter table public.user_progress add column course_id text;
    end if;

    -- E. Ensure course_id is TEXT (double check)
    alter table public.user_progress alter column course_id type text;

    -- F. Unique constraints
    alter table public.user_progress drop constraint if exists user_progress_user_id_lesson_id_program_id_key;
    
    -- Ensure correct unique constraint
    alter table public.user_progress drop constraint if exists user_progress_user_id_lesson_id_course_id_key;
    
    alter table public.user_progress add constraint user_progress_user_id_lesson_id_course_id_key unique(user_id, lesson_id, course_id);
end $$;

-- 2. Fix Missing Columns (Run this if table exists but columns are missing)
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'completed') then
        alter table public.user_progress add column completed boolean default false;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'is_mastered') then
        alter table public.user_progress add column is_mastered boolean default false;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'module_id') then
        alter table public.user_progress add column module_id text;
    end if;

    -- NEW: Add updated_at and created_at if missing
    if not exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'updated_at') then
        alter table public.user_progress add column updated_at timestamptz default now();
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'user_progress' and column_name = 'created_at') then
        alter table public.user_progress add column created_at timestamptz default now();
    end if;
end $$;

-- 3. Enable RLS
alter table public.user_progress enable row level security;

-- 4. Create Policies (Drop first to ensure idempotency)
drop policy if exists "Users can view their own progress" on public.user_progress;
create policy "Users can view their own progress" 
on public.user_progress for select 
using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress" 
on public.user_progress for insert 
with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress" 
on public.user_progress for update 
using ( auth.uid() = user_id );

-- NEW: Allow admins/managers to view progress of users in their org
drop policy if exists "Org members can view each others progress" on public.user_progress;
create policy "Org members can view each others progress"
on public.user_progress for select
using (
    exists (
        select 1
        from public.profiles as viewer
        join public.profiles as target on viewer.org_id = target.org_id
        where viewer.id = auth.uid()
        and target.id = user_progress.user_id
    )
);

-- 5. Force Schema Cache Reload (Notify PostgREST)
NOTIFY pgrst, 'reload config';
