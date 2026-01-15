import { supabase } from './supabase';

const BUCKET_NAME = 'lesson-content';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload
 * @param path Optional path within the bucket (default: 'uploads/{timestamp}_{filename}')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, path?: string): Promise<string> {
    try {
        // 1. Sanitize filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = path || `uploads/${timestamp}_${cleanName}`;

        // 2. Upload
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            // Check if bucket missing
            if (error.message.includes('bucket not found')) {
                throw new Error(`Storage bucket '${BUCKET_NAME}' not found. Please create it in Supabase dashboard.`);
            }
            throw error;
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return publicUrl;

    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}
