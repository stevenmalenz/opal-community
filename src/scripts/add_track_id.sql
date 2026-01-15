ALTER TABLE team_invites ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES courses(id);
