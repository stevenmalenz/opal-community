-- Add created_by column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Check if it exists and notify
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'created_by') THEN
        RAISE NOTICE 'Column created_by successfully added to courses table.';
    END IF;
END $$;
