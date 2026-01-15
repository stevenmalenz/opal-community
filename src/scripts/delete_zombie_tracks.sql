-- DELETE ZOMBIE TRACKS
-- Deletes courses by name that the user wants removed.

DO $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM courses 
    WHERE name IN ('Sales Negotiation Mastery', 'Customer Retention & Expansion');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % zombie courses.', deleted_count;
END $$;
