
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function fix() {
    console.log("Attempting to fix RLS...");

    const sql = `
    -- Enable RLS on table
    ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies to avoid conflict
    DROP POLICY IF EXISTS "Enable all for authenticated" ON homework_submissions;
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON homework_submissions;
    DROP POLICY IF EXISTS "Users can view their own submissions" ON homework_submissions;

    -- Create permissive policy for MVP (authenticated users can do anything)
    -- Ideally this should be scoped to user_id, but for "Seeing other tracks" issue we handle it in UI or scope here.
    -- Let's scope it to user_id OR public if we want "classmates" to see each other (part of the request?)
    -- The user complained about seeing "other tracks", implying they WANT isolation.
    
    -- Insert Policy
    CREATE POLICY "Users can insert their own" ON homework_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    
    -- Select Policy (Own + maybe course mates? strict for now)
    CREATE POLICY "Users can view their own" ON homework_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

    -- Update Policy
    CREATE POLICY "Users can update their own" ON homework_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    `;

    // Try RPC
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error("RPC failed:", error.message);
        console.log("Start debugging: Check if exec_sql function exists in DB.");
    } else {
        console.log("RLS Fix applied successfully!");
    }
}

fix();
