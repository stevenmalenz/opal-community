-- Add course_context to user_courses for "North Star" data
ALTER TABLE user_courses 
ADD COLUMN IF NOT EXISTS course_context JSONB DEFAULT '{}'::jsonb;

-- Create homework_submissions table
CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    content TEXT, -- Text submission
    video_url TEXT, -- Loom/Video link
    questions TEXT, -- Questions for the reviewer
    status TEXT DEFAULT 'pending', -- pending, graded, reviewed
    grade JSONB, -- AI or Manual grade data
    feedback TEXT, -- Feedback text
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for homework_submissions
CREATE POLICY "Users can view their own submissions" 
    ON homework_submissions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" 
    ON homework_submissions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
    ON homework_submissions FOR UPDATE 
    USING (auth.uid() = user_id);

-- Admins can view all submissions (assuming admin check logic exists or separate policy needed)
-- For now, allowing read for all authenticated users might be too broad, so let's stick to owner + granular later if needed.
-- Ideally we check profiles.role = 'admin' but complex policies can be tricky without helper functions.
-- Let's add a basic admin policy if profiles table is accessible.

CREATE POLICY "Admins can view all submissions"
    ON homework_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all submissions"
    ON homework_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
