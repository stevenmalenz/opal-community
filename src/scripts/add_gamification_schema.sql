-- Add gamification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS copilot_level INTEGER DEFAULT 1;

-- Create a function to update streaks (can be called via RPC or just handled in app logic for MVP)
-- For MVP, we will handle logic in the application layer to avoid complex PL/PGSQL for now, 
-- but having the columns is the first step.
