
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Fallback if dotenv doesn't pick up local .env (sometimes happens in scripts)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env Vars. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCourse() {
    const courseId = '6772f4b2-a1a9-4917-b0f5-b18aeb7f138c'; // ID from user

    console.log(`Inspecting course: ${courseId}`);

    // Check user_courses first (custom courses)
    const { data: userCourse, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (userCourse) {
        console.log("Found in user_courses:");
        console.log("Title:", userCourse.title);
        console.log("Structure Keys:", Object.keys(userCourse.structure || {}));
        if (userCourse.structure?.learningPath) {
            console.log("Module Count:", userCourse.structure.learningPath.length);
            userCourse.structure.learningPath.forEach((m, i) => {
                console.log(`Module ${i + 1}: ${m.title}`);
                console.log(` - Lessons: ${m.lessons?.length || 0}`);
            });
        } else {
            console.log("No learningPath in structure!");
            console.log("Full Structure:", JSON.stringify(userCourse.structure, null, 2));
        }
        return;
    }

    if (error) console.log("Error checking user_courses:", error.message);

    console.log("Not found in user_courses or error occurred.");
}

inspectCourse();
