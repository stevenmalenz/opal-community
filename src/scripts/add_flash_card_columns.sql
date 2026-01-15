-- Add flash_card_title and flash_card_content columns to lessons table if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'flash_card_title') THEN
        ALTER TABLE lessons ADD COLUMN flash_card_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'flash_card_content') THEN
        ALTER TABLE lessons ADD COLUMN flash_card_content TEXT;
    END IF;
END $$;
