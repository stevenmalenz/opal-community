
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourses() {
    console.log('Fetching courses...');
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, name, description, structure');

    if (error) {
        console.error('Error fetching courses:', error);
        return;
    }

    console.log(`Found ${courses.length} courses:`);
    courses.forEach(c => {
        console.log(`- ID: ${c.id}`);
        console.log(`  Name: "${c.name}"`);
        console.log(`  Role: ${c.structure?.role}`);
        console.log('---');
    });
}

checkCourses();
