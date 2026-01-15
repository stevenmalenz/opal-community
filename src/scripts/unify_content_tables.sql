-- 1. Ensure 'content' table has embedding column
ALTER TABLE content ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 2. Update match_documents to query 'content' instead of 'knowledge_base'
-- This unifies the RAG source with the Admin Console source
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
      1 - (c.embedding <=> query_embedding) AS similarity
    FROM content c
    WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
    AND c.metadata @> filter
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
