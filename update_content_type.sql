-- Drop the existing check constraint
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_content_type_check;

-- Add the new check constraint with 'sitemap' included
ALTER TABLE public.content ADD CONSTRAINT content_content_type_check 
CHECK (content_type IN ('webpage', 'pdf', 'video', 'notion', 'slack', 'sitemap'));
