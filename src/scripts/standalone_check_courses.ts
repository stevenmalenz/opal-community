import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhauekxxafzhckizyugq.supabase.co';
const supabaseKey = 'sb_publishable_96eDWlczRJPtKv8BKewf9w_xjVCQRLB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCourses() {
    console.log('Checking courses...');
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, name, created_at, org_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching courses:', error);
    } else {
        console.log('Latest 5 Courses:');
        if (courses.length === 0) {
            console.log('No courses found.');
        }
        courses.forEach(c => {
            console.log(`- [${c.id}] ${c.name} (${new Date(c.created_at).toLocaleString()})`);
        });
    }
}

checkCourses();
