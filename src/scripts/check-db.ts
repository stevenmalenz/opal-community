
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

async function checkDb() {
    console.log('Checking user_progress table...');

    // Try to select from the table
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing user_progress table:', error.message);
        if (error.code === '42P01') {
            console.log('Table does not exist.');
        }
    } else {
        console.log('Table exists and is accessible.');
        console.log('Sample data:', data);
    }
}

checkDb();
