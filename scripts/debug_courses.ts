
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCourses() {
    console.log("Fetching user_courses...");
    const { data: courses, error } = await supabase
        .from('user_courses')
        .select('*');

    if (error) {
        console.error("Error fetching courses:", error);
    } else {
        console.log("Found", courses.length, "courses:");
        console.dir(courses, { depth: null });
    }
}

debugCourses();
