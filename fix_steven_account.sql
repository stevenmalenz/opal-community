-- Fix steven.male@hey.com account specifically
-- This creates an org and links your existing profile to it

do $$
declare
  v_user_id uuid;
  v_org_id uuid;
begin
  -- Find your user ID from email
  select id into v_user_id
  from auth.users
  where email = 'steven.male@hey.com'
  limit 1;

  if v_user_id is null then
    raise exception 'User not found for email: steven.male@hey.com';
  end if;

  -- Create an organization
  insert into public.organizations (name)
  values ('Steven''s Organization')
  returning id into v_org_id;

  -- Update your profile with the org_id and ensure you're an admin
  update public.profiles
  set 
    org_id = v_org_id,
    role = 'admin',
    full_name = coalesce(full_name, 'Steven Male')
  where id = v_user_id;

  raise notice 'Created organization % and linked to user %', v_org_id, v_user_id;
end $$;
