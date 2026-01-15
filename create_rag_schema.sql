-- RAG SCHEMA: Vector Search for Knowledge Base

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create Knowledge Base Table
create table if not exists public.knowledge_base (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.organizations not null,
  content text not null,
  metadata jsonb, -- e.g., { "source": "cohort_session", "sessionId": "...", "title": "..." }
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RLS Policies
alter table public.knowledge_base enable row level security;

create policy "Knowledge Base viewable by authenticated users"
  on knowledge_base for select
  to authenticated
  using ( true );

create policy "Admins can insert knowledge"
  on knowledge_base for insert
  to authenticated
  with check ( true ); -- Real app: check role=admin

-- 4. Similarity Search Function (RPC)
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query(
    select
      kb.id,
      kb.content,
      kb.metadata,
      1 - (kb.embedding <=> query_embedding) as similarity
    from knowledge_base kb
    where 1 - (kb.embedding <=> query_embedding) > match_threshold
    order by kb.embedding <=> query_embedding
    limit match_count
  );
end;
$$;
