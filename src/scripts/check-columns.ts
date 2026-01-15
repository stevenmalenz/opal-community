
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for user_progress...');

    // We can't query information_schema directly easily via supabase-js client usually, 
    // but we can try to select * from user_progress limit 1 and see what keys come back,
    // OR we can try to insert a dummy record and see if it fails.

    // Let's try to just get one row.
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        console.log('Success. Row data keys:', data && data.length > 0 ? Object.keys(data[0]) : 'No rows found');
    }

    // Also try to inspect the error when inserting with program_id
    console.log('Attempting dummy insert with program_id...');
    const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID, might fail FK but will check columns first
            program_id: 'test-program',
            lesson_id: 'test-lesson',
            completed: true
        });

    if (insertError) {
        console.log('Insert error:', insertError.message);
    } else {
        console.log('Insert initiated (might fail FK later but column exists)');
    }
}

checkColumns();
