
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

async function checkData() {
    console.log('Checking courses...');
    const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('*');

    if (courseError) console.error('Course Error:', courseError);
    else console.log(`Found ${courses.length} courses.`);
    if (courses.length > 0) {
        console.log('First course structure:', JSON.stringify(courses[0].structure, null, 2));
    }

    console.log('\nChecking content...');
    const { data: content, error: contentError } = await supabase
        .from('content')
        .select('id, title, url');

    if (contentError) console.error('Content Error:', contentError);
    else console.log(`Found ${content.length} content items.`);
    if (content.length > 0) {
        console.log('First 5 content items:', content.slice(0, 5));
    }
}

checkData();
