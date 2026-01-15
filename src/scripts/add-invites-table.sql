-- Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'learner',
    org_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view invites for their own org
CREATE POLICY "Users can view invites for their org" ON public.team_invites
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Allow users to create invites for their org
CREATE POLICY "Users can create invites for their org" ON public.team_invites
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Allow users to delete invites for their org
CREATE POLICY "Users can delete invites for their org" ON public.team_invites
    FOR DELETE
    USING (
        org_id IN (
            SELECT org_id FROM public.profiles WHERE id = auth.uid()
        )
    );
