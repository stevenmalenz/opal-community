
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config({ path: resolve(__dirname, '../../.env.local') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectContent() {
    console.log('--- Inspecting USER table (for Org ID) ---');
    const { data: users } = await supabase.auth.admin.listUsers();
    if (users && users.users.length > 0) {
        const user = users.users[0];
        console.log(`User ID: ${user.id}`);
        // console.log(`App Metadata:`, user.app_metadata);

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        console.log(`Profile Org ID:`, profile?.org_id);
    }

    console.log('\n--- Schema Inspection ---');

    // Probe columns by trying to insert
    console.log('\n--- Probing Columns ---');

    console.log("Probing 'content' column...");
    try {
        const { error } = await supabase.from('content').insert({
            id: '11111111-1111-1111-1111-111111111111',
            content: 'test',
            title: 'probe_content'
        });
        if (error) console.log("Insert 'content' failed:", error.message);
        else console.log("Insert 'content' SUCCEEDED (Column exists).");
    } catch (e) { console.log(e); }

    console.log("Probing 'raw_content' column...");
    try {
        const { error } = await supabase.from('content').insert({
            id: '22222222-2222-2222-2222-222222222222',
            raw_content: 'test',
            title: 'probe_raw_content'
        });
        if (error) console.log("Insert 'raw_content' failed:", error.message);
        else console.log("Insert 'raw_content' SUCCEEDED (Column exists).");
    } catch (e) { console.log(e); }

    // Cleanup probes
    await supabase.from('content').delete().eq('title', 'probe_content');
    await supabase.from('content').delete().eq('title', 'probe_raw_content');
}

inspectContent();
