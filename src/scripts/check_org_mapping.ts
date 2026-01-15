import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhauekxxafzhckizyugq.supabase.co';
const supabaseKey = 'sb_publishable_96eDWlczRJPtKv8BKewf9w_xjVCQRLB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrgMapping() {
    console.log('Checking User & Org...');

    // 1. Get all profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, org_id, full_name');

    if (profileError) console.error('Profile Error:', profileError);
    else {
        console.log(`Found ${profiles.length} profiles:`);
        profiles.forEach(p => console.log(`- ${p.email} (Org: ${p.org_id})`));
    }

    // 2. Get all courses
    const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('id, name, org_id');

    if (courseError) console.error('Course Error:', courseError);
    else {
        console.log(`Found ${courses.length} courses:`);
        courses.forEach(c => console.log(`- ${c.name} (Org: ${c.org_id})`));
    }
}

checkOrgMapping();
