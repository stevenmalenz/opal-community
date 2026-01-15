
-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS homework_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users,
    lesson_id text,
    module_id text,
    course_id uuid, -- Required for leakage fix
    content text,
    video_url text,
    questions text,
    status text DEFAULT 'pending',
    grade jsonb,
    feedback text
);

-- 2. Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create/Replace Policies (Permissive for now to unblock, scoped to Auth)

-- Drop potential conflicting policies
DROP POLICY IF EXISTS "Enable all for authenticated" ON homework_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON homework_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON homework_submissions;
DROP POLICY IF EXISTS "Users can insert their own" ON homework_submissions;
DROP POLICY IF EXISTS "Users can view their own" ON homework_submissions;
DROP POLICY IF EXISTS "Users can update their own" ON homework_submissions;

-- INSERT: Allow authenticated users to insert rows where user_id matches their own
CREATE POLICY "Users can insert their own" ON homework_submissions 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- SELECT: Allow authenticated users to view rows where user_id matches their own
-- Note: If you want students to see classmates, you need a different policy (e.g. based on course_id match)
-- For now, we restrict to OWN submissions to strictly solve "Seeing other tracks" complaint.
CREATE POLICY "Users can view their own" ON homework_submissions 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- UPDATE: Allow users to edit their own pending submissions?
CREATE POLICY "Users can update their own" ON homework_submissions 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- 4. Fix Questions/Content Columns if missing (Idempotent)
DO $$
BEGIN
    BEGIN
        ALTER TABLE homework_submissions ADD COLUMN questions text;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'questions column already exists';
    END;
    BEGIN
        ALTER TABLE homework_submissions ADD COLUMN module_id text;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'module_id column already exists';
    END;
END $$;
