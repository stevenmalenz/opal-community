-- DIAGNOSTIC SELECT SCRIPT (FIXED TYPES)
-- Run this and look at the "Results" table.

WITH target_user AS (
    SELECT id, email, org_id FROM profiles WHERE email = 'steven.male@hey.com'
)
SELECT 
    'Current User' as category,
    email as name,
    org_id,
    0::bigint as count -- Explicitly bigint to match COUNT(*)
FROM target_user

UNION ALL

SELECT 
    'Other User' as category,
    email as name,
    org_id,
    0::bigint as count
FROM profiles 
WHERE email IN ('steven@stevenmale.com', 'steven+learn@stevenmale.com')

UNION ALL

SELECT 
    'Course Stats' as category,
    'Courses in User Org' as name,
    (SELECT org_id FROM target_user) as org_id,
    COUNT(*) as count
FROM courses 
WHERE org_id = (SELECT org_id FROM target_user)

UNION ALL

SELECT 
    'Course Stats' as category,
    'Courses with NO Org' as name,
    NULL::uuid as org_id, -- Explicitly cast NULL to uuid
    COUNT(*) as count
FROM courses 
WHERE org_id IS NULL;
