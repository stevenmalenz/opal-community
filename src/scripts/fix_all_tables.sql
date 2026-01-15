-- Ensure homework_submissions exists with all columns
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

-- 2. FIX RAG TABLE: Ensure 'content' table has embedding column
ALTER TABLE content ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. FIX RAG SEARCH: Update match_documents to query 'content' instead of 'knowledge_base'
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT
      c.id,
      c.content,
      c.metadata,
      1 - (c.embedding <=> query_embedding) as similarity
    FROM content c
    WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
    AND c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
