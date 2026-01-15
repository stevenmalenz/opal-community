
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for diagnostics

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Service Role Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log("--- DIAGNOSTICS START ---");

    // 1. Check Profiles (to find valid org_ids)
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error("Profiles Error:", pError);
    else console.log(`Found ${profiles.length} profiles.`);

    if (profiles.length > 0) {
        console.log("Sample Profile:", profiles[0]);
    }

    // 2. Check Questions (Raw dump)
    const { data: questions, error: qError } = await supabase.from('questions').select('*');
    if (qError) console.error("Questions Error:", qError);
    else console.log(`Found ${questions.length} questions.`);
    if (questions && questions.length > 0) console.log("Sample Question:", questions[0]);


    // 3. Check Submissions
    const { data: submissions, error: sError } = await supabase.from('submissions').select('*');
    if (sError) console.error("Submissions Error:", sError);
    else console.log(`Found ${submissions.length} submissions.`);
    if (submissions && submissions.length > 0) console.log("Sample Submission:", submissions[0]);

    console.log("--- DIAGNOSTICS END ---");
}

checkDatabase();
