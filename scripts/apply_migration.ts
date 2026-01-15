
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
-- Drop the existing check constraint
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_content_type_check;

-- Add the new check constraint with 'sitemap' included
ALTER TABLE public.content ADD CONSTRAINT content_content_type_check 
CHECK (content_type IN ('webpage', 'pdf', 'video', 'notion', 'slack', 'sitemap'));
`;

async function applyMigration() {
    console.log('Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    // If exec_sql is not available (it usually isn't by default), we might need another way.
    // But often in these environments we have a way.
    // If rpc fails, we might have to just hope the user runs it or use the dashboard.
    // actually, let's try to use the 'postgres' connection if we can, but we don't have psql.
    // The user has `supabase_schema.sql` which suggests they might be using `supabase db push` or similar.
    // But I can't run that.

    // ALTERNATIVE: Use the `pg` library if installed? 
    // Let's check package.json first.

    if (error) {
        console.error('Error applying migration via RPC:', error);
        console.log('Attempting to use direct SQL query if possible (not supported by JS client directly for DDL usually)');
    } else {
        console.log('Migration applied successfully via RPC!');
    }
}

// Actually, the JS client cannot execute DDL directly unless there is a helper function.
// Since I cannot run psql, and I don't know if `supabase` CLI is authenticated,
// I will try to use the `pg` driver if available.
// Let's check package.json.
