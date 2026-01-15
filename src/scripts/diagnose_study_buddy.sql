-- Check org IDs for all users
SELECT id, email, full_name, org_id, is_looking_for_buddy 
FROM profiles;

-- Check if there are multiple organizations
SELECT * FROM organizations;
