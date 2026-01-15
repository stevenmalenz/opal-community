
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from project root
dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log("Probing columns...");

    // 1. Check columns by selecting
    const { data, error: selectError } = await supabase.from('homework_submissions').select('id, course_id, content, questions, module_id').limit(1);

    if (selectError) {
        console.error("Column check error:", selectError.message);
        // If error says specifically about a column, we know it's missing.
    } else {
        console.log("Columns likely exist. Data:", data);
    }

    console.log("Probing INSERT...");

    // 2. Try to insert
    // const { data: userData } = await supabase.auth.getUser();
    // const userId = userData.user?.id; // might be undefined if not logged in via this client

    // Note: This client is ANON. It relies on RLS. If we are not logged in, we are anon.
    // If policy allows anon insert, it works (bad). If policy requires auth, it fails.
    // But we can't easily login as the user here without their password.
    // However, if the error is "new row violates RLS", we know RLS is active but maybe blocking.
    // If error is "permission denied for table", then RLS/Grant issue.

    const { error } = await supabase.from('homework_submissions').insert({
        content: 'Probe test',
        lesson_id: 'probe-1',
        module_id: 'probe-mod-1',
        // course_id: '...' // optional
    });

    if (error) {
        console.error("Insert error:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
    } else {
        console.log("Insert successful (warning: table might be public info)");
    }
}

probe();
