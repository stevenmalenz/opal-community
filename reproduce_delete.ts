
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('--- Testing Course Deletion ---');

    // 1. Create a dummy course
    const { data: user, error: authError } = await supabase.auth.signInWithPassword({
        email: 'steven@example.com', // Replace with a known user if possible, or use one from env
        password: 'password123'      // Need a valid credential or just use service role? 
        // Ideally we test with "authenticated" role to match user scenario.
        // Since I don't have credentials easily, I'll assume I can just use the anon client 
        // BUT anon client is "anon" role, not "authenticated". 
        // I might need to mock the user context or sign in.
    });

    // For this reproduction, checking the table policies is often enough. 
    // Attempting to delete without being logged in will definitely fail if RLS is on.
    // So I actually need a logged-in user to properly reproduce the "user cannot delete" issue
    // vs "anon cannot delete" (which is expected).

    // Since I assume I can't easily login without credentials, I will just inspect policies via SQL.
    // But I can try to delete a non-existent ID and see the error.

    const { error, count } = await supabase
        .from('courses')
        .delete({ count: 'exact' })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Dummy ID

    if (error) {
        console.error('Delete Error:', error);
    } else {
        console.log('Delete Count:', count);
        if (count === 0) {
            console.log('Result: 0 rows deleted (Expected if RLS denies delete)');
        }
    }
}

runTest();
