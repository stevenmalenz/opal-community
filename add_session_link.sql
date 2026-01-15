-- ADD MEETING LINK TO SESSIONS
-- Allows each session to have a specific Join Link (like Zoom/Meet)

alter table public.cohort_sessions
add column if not exists meeting_url text;

-- No new RLS needed as existing policies cover all columns.
