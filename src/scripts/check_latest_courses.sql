-- Check the 5 most recently created courses
SELECT 
    c.id, 
    c.name, 
    c.created_at, 
    p.email as creator_email
FROM courses c
JOIN profiles p ON c.org_id = p.org_id
ORDER BY c.created_at DESC
LIMIT 5;
