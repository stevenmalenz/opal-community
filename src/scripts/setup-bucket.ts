
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Assuming script is in src/scripts, .env is in root (2 levels up)
const envPath = resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Try loading from .env.local if .env doesn't exist
    dotenv.config({ path: resolve(__dirname, '../../.env.local') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBucket() {
    console.log('Checking Supabase Storage buckets...');

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const bucketName = 'lesson-content';
    const existingBucket = buckets.find(b => b.name === bucketName);

    if (existingBucket) {
        console.log(`Bucket '${bucketName}' already exists.`);
        console.log('Is Public:', existingBucket.public);

        if (!existingBucket.public) {
            console.log(`Attempting to make bucket '${bucketName}' public...`);
            const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
                public: true
            });
            if (updateError) {
                console.error('Failed to update bucket:', updateError);
            } else {
                console.log(`Bucket '${bucketName}' is now public.`);
            }
        }
    } else {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true
        });

        if (createError) {
            console.error('Failed to create bucket:', createError);
        } else {
            console.log(`Bucket '${bucketName}' created successfully.`);
        }
    }
}

setupBucket();
