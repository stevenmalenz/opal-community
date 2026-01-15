
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

async function runAudit() {
    console.log("🔍 Starting System Audit...");

    // 1. Check User Courses Schema & Data
    console.log("\n--- Checking 'user_courses' ---");
    const { data: userCourses, error: ucError } = await supabase
        .from('user_courses')
        .select('*');

    if (ucError) {
        console.error("❌ Error fetching user_courses:", ucError.message);
    } else {
        console.log(`✅ Found ${userCourses.length} user_courses records.`);
        if (userCourses.length > 0) {
            console.log("Sample Record:", JSON.stringify(userCourses[0], null, 2));
            // Check for status column
            if ('status' in userCourses[0]) {
                console.log("✅ 'status' column EXISTS.");
            } else {
                console.error("❌ 'status' column MISSING in returned data.");
            }
        } else {
            console.warn("⚠️ Table is empty, cannot verify columns.");
        }
    }

    // 2. Check Courses Schema & Data
    console.log("\n--- Checking 'courses' ---");
    const { data: courses, error: cError } = await supabase
        .from('courses')
        .select('*');

    if (cError) {
        console.error("❌ Error fetching courses:", cError.message);
    } else {
        console.log(`✅ Found ${courses.length} courses records.`);
        if (courses.length > 0) {
            console.log("Sample Record:", JSON.stringify(courses[0], null, 2));
        }
    }

    // 3. Test Insert Capability (User Courses)
    console.log("\n--- Testing Write Permissions (user_courses) ---");
    const tempId = crypto.randomUUID();
    // Assuming a valid user_id is needed, we might fail if we don't have one.
    // We will try to use the first user_id found in the table, or skip if empty.
    let testUserId = userCourses?.[0]?.user_id;

    if (!testUserId) {
        console.log("⚠️ No existing user_id found to test insert. Fetching a user...");
        const { data: users } = await supabase.auth.admin.listUsers();
        testUserId = users?.users?.[0]?.id;
    }

    if (testUserId) {
        console.log(`Testing insert for User ID: ${testUserId}`);
        const { data: insertData, error: insertError } = await supabase
            .from('user_courses')
            .insert({
                user_id: testUserId,
                title: 'AUDIT_TEST_COURSE',
                status: 'generating',
                progress: {}
            })
            .select() // Returning * to verify columns again
            .single();

        if (insertError) {
            console.error("❌ Insert Failed:", insertError);
        } else {
            console.log("✅ Insert SUCCEEDED:", insertData);
            // Cleanup
            await supabase.from('user_courses').delete().eq('id', insertData.id);
            console.log("✅ Cleanup complete.");
        }
    } else {
        console.warn("⚠️ Could not find a User ID to test insert permissions.");
    }
}

runAudit();
