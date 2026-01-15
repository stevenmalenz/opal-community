
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectContent() {
    const { data, error } = await supabase
        .from('content')
        .select('title, url, raw_content, metadata')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error fetching content:', error);
    } else {
        console.log('Recent Content Items:');
        data.forEach((item, idx) => {
            console.log(`\n--- Item ${idx + 1} ---`);
            console.log('Title:', item.title);
            console.log('URL:', item.url);
            console.log('Metadata:', JSON.stringify(item.metadata, null, 2));
            const content = typeof item.raw_content === 'string' ? item.raw_content : JSON.stringify(item.raw_content);
            console.log('Content Snippet:', content.substring(0, 500));
            console.log('Content Length:', content.length);
        });
    }
}

inspectContent();
