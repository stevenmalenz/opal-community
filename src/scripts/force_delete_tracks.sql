-- FORCE DELETE ZOMBIE TRACKS
-- Deletes ALL courses except "docs.airops.com Mastery"
-- This is a more aggressive cleanup to remove persistent duplicates.

DO $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM courses 
    WHERE name NOT ILIKE '%docs.airops.com Mastery%';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % zombie courses.', deleted_count;
END $$;

-- Verify what remains
SELECT id, name, created_at FROM courses;
