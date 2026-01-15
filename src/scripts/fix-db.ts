
// import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: resolve(__dirname, '../../.env.local') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

// const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDb() {
  console.log('Fixing user_progress table RLS...');

  // We can't run SQL directly via JS client usually, but we can try to use the 'rpc' if available.
  // However, since we likely don't have an 'exec_sql' function, we might be limited.
  // BUT, we can try to insert a row to test if it works.

  // Actually, if the table exists but RLS is blocking, we can't fix it from here without SQL access.
  // But wait, if I have the SERVICE ROLE KEY, I bypass RLS!
  // So the app (using ANON key) might be blocked, but this script (using SERVICE key) works.

  // The issue is likely that the table was created without policies for the ANON key.
  // Since I cannot run SQL, I cannot create policies.
  // I must assume the user has to run SQL or I have to find another way.

  // Wait, if I use the `pg` library I can connect directly to the DB if I have the connection string.
  // I don't have the connection string in the env usually, only the URL and Key.

  // Let's try to see if there is a `supabase/migrations` folder I can use? No.

  // Okay, I will try to use the `rpc` method just in case there is a helper.
  // If not, I will have to ask the user to run the SQL.

  console.log("NOTE: If persistence fails, please run the following SQL in your Supabase Dashboard:");
  console.log(`
    -- 1. Create Table (if not exists)
    create table if not exists public.user_progress (
        id uuid default gen_random_uuid() primary key,
        user_id uuid references auth.users not null,
        lesson_id text not null,
        program_id text not null,
        module_id text,
        completed boolean default false,
        is_mastered boolean default false,
        updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
        unique(user_id, lesson_id, program_id)
    );

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
    end $$;

    -- 3. Enable RLS
    alter table user_progress enable row level security;

    create policy "Users can view their own progress"
      on user_progress for select
      using ( auth.uid() = user_id );

    create policy "Users can insert their own progress"
      on user_progress for insert
      with check ( auth.uid() = user_id );

    create policy "Users can update their own progress"
      on user_progress for update
      using ( auth.uid() = user_id );
    `);
}

fixDb();
