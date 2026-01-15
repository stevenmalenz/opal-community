
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDb() {
    console.log('Setting up database...');

    // 1. Check if user_progress table exists by trying to select
    const { error: selectError } = await supabase.from('user_progress').select('*').limit(1);

    if (selectError && selectError.code === '42P01') {
        console.log('Table user_progress does not exist. Attempting to create via RPC if available, or logging instructions.');
        // Since we can't create tables via JS client without RPC, we have to rely on the user running SQL.
        // BUT, we can try to use the 'rpc' method to call a function if it exists, OR just log the SQL.
        // Wait, if I have the service role key, I can use the Management API if it was available, but it's not in supabase-js.

        console.error('CRITICAL: Table user_progress is missing.');
        console.error('Please run the SQL in src/scripts/fix-db.ts in your Supabase SQL Editor.');
        return;
    } else {
        console.log('Table user_progress exists.');
    }

    // 2. Test Insert (to verify Schema)
    console.log('Verifying table schema...');
    const { error: insertError } = await supabase.from('user_progress').insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        lesson_id: 'test-lesson',
        program_id: 'test-program',
        module_id: 'test-module',
        completed: true,
        is_mastered: false,
        updated_at: new Date().toISOString()
    });

    if (insertError) {
        if (insertError.code === '23503') { // Foreign key violation - means columns exist!
            console.log('Schema check passed (Foreign Key check triggered).');
        } else if (insertError.message.includes('column')) {
            console.error('Schema Mismatch:', insertError.message);
            console.log('Please run the SQL in src/scripts/fix-db.ts to update the table schema.');
        } else {
            // If it's not a column error, the schema is likely fine (could be RLS if we weren't using service key, but we are).
            // Actually, with service key, RLS is bypassed. So if this fails, it's a constraint or schema error.
            console.log('Schema check result:', insertError.message);
        }
    } else {
        console.log('Schema check passed (Insert successful).');
        // Clean up
        await supabase.from('user_progress').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
    }

    console.log('Database check complete. If saving still fails for users, it is RLS policies.');
    console.log('Please ensure the following policies exist:');
    console.log(`
    create policy "Users can view their own progress" on user_progress for select using ( auth.uid() = user_id );
    create policy "Users can insert their own progress" on user_progress for insert with check ( auth.uid() = user_id );
    create policy "Users can update their own progress" on user_progress for update using ( auth.uid() = user_id );
    `);
}


setupDb();
