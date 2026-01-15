-- ADD STUDY BUDDY SCHEMA
-- Adds columns to profiles table for the Study Buddy feature.

DO $$
BEGIN
    -- 1. is_looking_for_buddy
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_looking_for_buddy') THEN
        ALTER TABLE profiles ADD COLUMN is_looking_for_buddy BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_looking_for_buddy column';
    END IF;

    -- 2. buddy_bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buddy_bio') THEN
        ALTER TABLE profiles ADD COLUMN buddy_bio TEXT;
        RAISE NOTICE 'Added buddy_bio column';
    END IF;

    -- 3. buddy_id (Self-reference)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'buddy_id') THEN
        ALTER TABLE profiles ADD COLUMN buddy_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added buddy_id column';
    END IF;

END $$;
