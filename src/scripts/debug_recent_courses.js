
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env Vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCourses() {
    console.log("Fetching recent courses...");

    const { data: courses, error } = await supabase
        .from('user_courses')
        .select('id, title, structure')
        .limit(5);

    if (error) {
        console.error("Error fetching courses:", error.message);
        return;
    }

    if (!courses || courses.length === 0) {
        console.log("No courses found.");
        return;
    }

    console.log(`Found ${courses.length} courses.`);

    courses.forEach((c, idx) => {
        console.log(`\n[${idx}] ID: ${c.id}`);
        console.log(`    Title: ${c.title}`);
        // console.log(`    Created: ${c.created_at}`);

        const struct = c.structure || {};
        const lp = struct.learningPath || [];
        console.log(`    Modules: ${lp.length}`);

        lp.forEach((m, mIdx) => {
            console.log(`      - Mod ${mIdx + 1}: ${m.title} (${m.lessons?.length || 0} lessons)`);
        });

        // Check for context injection evidence in the first lesson of first module
        if (lp.length > 0 && lp[0].lessons?.length > 0) {
            const firstContent = lp[0].lessons[0].content || "";
            console.log(`    sample_content_start: ${firstContent.substring(0, 100).replace(/\n/g, ' ')}...`);
        }
    });
}

debugCourses();
