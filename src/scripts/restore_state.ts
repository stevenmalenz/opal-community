import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhauekxxafzhckizyugq.supabase.co';
const supabaseKey = 'sb_publishable_96eDWlczRJPtKv8BKewf9w_xjVCQRLB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreState() {
    console.log('Restoring State...');

    // 1. Create/Get Org
    const { data: org } = await supabase
        .from('organizations')
        .insert({ name: 'FlowLearn Demo Org' })
        .select()
        .single();

    // If error (likely already exists or RLS), try to fetch any org
    let orgId = org?.id;
    if (!orgId) {
        console.log('Could not create org, fetching existing...');
        const { data: existingOrg } = await supabase.from('organizations').select('id').limit(1).single();
        orgId = existingOrg?.id;
    }

    if (!orgId) {
        console.error('CRITICAL: Could not get an organization ID.');
        return;
    }
    console.log('Using Org ID:', orgId);

    // 2. Create "Welcome" Course
    const welcomeCourse = {
        title: "FlowLearn Onboarding",
        description: "Welcome to FlowLearn! This is a sample course to get you started.",
        skills: [{ id: '1', name: 'Platform Basics', score: 0, target: 100, category: 'General' }],
        learningPath: [{
            id: 'm1',
            title: "Getting Started",
            status: 'unlocked',
            lessons: [
                {
                    title: "Welcome to FlowLearn",
                    type: "Article",
                    duration: "2 min",
                    content: "# Welcome!\n\nThis is your first course. Try creating a new one from the 'Knowledge' tab!"
                }
            ]
        }],
        scenarios: []
    };

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
            org_id: orgId,
            name: welcomeCourse.title,
            description: welcomeCourse.description,
            structure: welcomeCourse
        })
        .select()
        .single();

    if (courseError) {
        console.error('Error creating course:', courseError);
    } else {
        console.log('✅ Created Welcome Course:', course.name);
    }
}

restoreState();
