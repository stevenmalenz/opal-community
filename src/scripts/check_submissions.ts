
import { supabase } from '../lib/supabase';

async function checkSubmissions() {
    console.log("🕵️ Checking Homework Submissions...");

    // 1. Raw Count
    const { count, error: countError } = await supabase
        .from('homework_submissions')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("❌ Error counting submissions:", countError.message);
    } else {
        console.log(`📊 Total Submissions in DB: ${count}`);
    }

    // 2. Fetch Sample
    const { data, error } = await supabase
        .from('homework_submissions')
        .select(`
            id, 
            lesson_id, 
            course_id, 
            user_id,
            content,
            created_at
        `)
        .limit(5);

    if (error) {
        console.error("❌ Error fetching sample:", error);
    } else {
        console.log("📝 Sample Submissions:", JSON.stringify(data, null, 2));
    }

    // 3. Check Comments Table Existence
    const { error: commentError } = await supabase
        .from('homework_comments')
        .select('id')
        .limit(1);

    if (commentError) {
        console.warn("⚠️ Comment check failed (Table might be missing?):", commentError.message);
    } else {
        console.log("✅ 'homework_comments' table exists and is accessible.");
    }
}

checkSubmissions();
