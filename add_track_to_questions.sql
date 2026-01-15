-- ADD TRACK (COURSE) CONTEXT TO QUESTIONS
-- Allows filtering Q&A by the current Learning Path/Track

alter table public.questions
add column if not exists course_id uuid references public.courses;

-- No new RLS needed as existing policies cover all columns.
-- We will filter by this column in the frontend query.
