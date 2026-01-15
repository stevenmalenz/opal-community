-- Function to safely accept invites for the authenticated user
-- This runs with SECURITY DEFINER to bypass RLS on the team_invites table
-- It also handles case-insensitive email matching and whitespace trimming

CREATE OR REPLACE FUNCTION accept_invite()
RETURNS TABLE (
  id uuid,
  role text,
  track_id uuid,
  org_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email text;
BEGIN
  -- Get the email of the currently logged-in user
  current_user_email := auth.email();
  
  -- Update pending invites for this email
  RETURN QUERY
  UPDATE team_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE TRIM(LOWER(email)) = TRIM(LOWER(current_user_email)) AND status = 'pending'
  RETURNING team_invites.id, team_invites.role, team_invites.track_id, team_invites.org_id;
END;
$$;
