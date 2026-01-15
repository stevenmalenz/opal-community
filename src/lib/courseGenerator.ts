import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export async function generateCourseFromContent(user: User, courseContext?: string, url?: string, courseId?: string) {
    console.log('🔄 Starting course generation...');

    // 1. Get Org ID
    let { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    let orgId = profile?.org_id;

    if (!orgId) {
        throw new Error('User does not belong to an organization');
    }

    // 2. Fetch ALL content
    const { data: allContent } = await supabase
        .from('content')
        .select('title, raw_content, url, metadata')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(2000);

    // 3. Determine Course Title/Domain
    // If we have a URL provided (e.g. from onboarding input), use it.
    // Otherwise try to find a URL from the content.
    let currentUrl = url;
    if (!currentUrl && allContent && allContent.length > 0) {
        const webSource = allContent.find(s => s.url);
        if (webSource) currentUrl = webSource.url || '';
    }

    const domain = currentUrl ? new URL(currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`).hostname : 'Enterprise';
    const courseTitle = currentUrl ? `${domain.replace('www.', '')} Mastery` : 'Enterprise Mastery';

    // 4. Build Context
    let contextText = `Course Purpose: ${courseContext || courseTitle}\n\nSource Documentation:\n\n`;
    let imageUrls: string[] = [];
    let totalCharsUsed = 0;
    const maxContextChars = 800000;

    if (allContent && allContent.length > 0) {
        contextText += `## Available Documentation Pages (${allContent.length} total):\n`;
        allContent.forEach((item, idx) => {
            contextText += `${idx + 1}. ${item.title} - ${item.url || 'No URL'}\n`;
        });
        contextText += `\n\n`;

        allContent.forEach((item, idx) => {
            if (totalCharsUsed >= maxContextChars) return;

            contextText += `\n## Source ${idx + 1}: ${item.title}\n`;
            if (item.url) contextText += `URL: ${item.url}\n\n`;

            if (item.metadata && item.metadata.images && Array.isArray(item.metadata.images)) {
                imageUrls.push(...item.metadata.images);
                contextText += `Images: ${item.metadata.images.slice(0, 20).join(', ')}\n\n`;
            }

            // Save source metadata for the course object
            // @ts-ignore
            if (!global.sourcesList) global.sourcesList = [];
            // @ts-ignore
            global.sourcesList.push({ id: idx + 1, title: item.title, url: item.url });

            if (item.raw_content) {
                const rawContent = typeof item.raw_content === 'string'
                    ? item.raw_content
                    : JSON.stringify(item.raw_content);

                const contentChunk = rawContent.substring(0, 30000);
                contextText += contentChunk + '\n\n';
                totalCharsUsed += contentChunk.length;
            }
        });

        if (imageUrls.length > 0) {
            contextText += `\n\nAvailable Images (${imageUrls.length} total):\n${imageUrls.slice(0, 100).join('\n')}\n`;
        }
    } else {
        contextText += `URL: ${currentUrl}\nUser wants to learn about: ${domain}\n`;
    }

    console.log('📚 Context built, passing to AI...');

    // 5. Generate Structure
    const { generateCourseStructure } = await import('./aiService');
    const generatedStructure = await generateCourseStructure(courseTitle, contextText);

    // 6. Fallback
    if (!generatedStructure) {
        console.warn('⚠️ AI generation failed or returned null. Using fallback structure.');
        // Do not throw, proceed to use fallback
    }

    const finalStructure = generatedStructure || {
        skills: [{ id: '1', name: 'Core Concepts', score: 0, target: 100, category: 'General' }],
        learningPath: [{
            id: 'm1',
            title: `${courseTitle} Fundamentals`,
            status: 'unlocked',
            lessons: [
                {
                    id: 'l1',
                    title: 'Introduction',
                    type: 'Article',
                    duration: '5 min',
                    content: `# Introduction to ${courseTitle}\n\nWelcome to your learning journey!\n\n## Getting Started\nThis course will help you master the key concepts.`
                }
            ]
        }],
        scenarios: [{
            id: 's1',
            title: `${courseTitle} Practice`,
            difficulty: 'Beginner',
            duration: '5 min',
            context: `Practice applying ${courseTitle} concepts.`
        }],
        // @ts-ignore
        sources: global.sourcesList || []
    };

    // Clean up global
    // @ts-ignore
    delete global.sourcesList;

    // 7. Save to DB
    // Use the title from the generated structure if available, otherwise fallback
    const finalCourseTitle = generatedStructure?.title || courseTitle;

    const mockCourse = {
        title: finalCourseTitle,
        description: `Mastery path for ${domain}, generated from your documentation.`,
        skills: finalStructure.skills,
        learningPath: finalStructure.learningPath,
        scenarios: finalStructure.scenarios
    };

    let courseData;

    if (courseId) {
        // Update existing course
        const { data, error: updateError } = await supabase
            .from('courses')
            .update({
                name: mockCourse.title,
                description: mockCourse.description,
                structure: mockCourse,
                updated_at: new Date().toISOString()
            })
            .eq('id', courseId)
            .select()
            .single();

        if (updateError) throw updateError;
        courseData = data;
    } else {
        // Insert new course
        const { data, error: insertError } = await supabase
            .from('courses')
            .insert({
                org_id: orgId,
                name: mockCourse.title,
                description: mockCourse.description,
                structure: mockCourse
            })
            .select() // CRITICAL: Fetch the ID
            .single();

        if (insertError) throw insertError;
        courseData = data;
    }

    // 7b. Enroll User (CRITICAL FIX: Ensure user sees the course)
    // We try to insert; if it fails (duplicate), that's fine.
    try {
        const { error: enrollError } = await supabase
            .from('user_courses')
            .insert({
                user_id: user.id,
                course_id: courseData.id,
                status: 'active'
            });

        if (enrollError && enrollError.code !== '23505') {
            console.error('Failed to enroll user in generated course:', enrollError);
        }
    } catch (err) {
        console.error('Enrollment step failed:', err);
    }

    // 8. Auto-generate Flash Cards
    try {
        await generateFlashCards(user);
    } catch (e) {
        console.error('Auto-generation of flash cards failed:', e);
        // Don't fail the whole course generation if this fails
    }

    return courseData; // Return the REAL course with ID
}

export async function createPersonalizedCourse(user: User, goal: string, userLevel: string, timeCommitment: string, role: string = "", outcome: string = "") {
    console.log('🚀 Creating personalized course...');

    // 1. Get Org ID
    let { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id) throw new Error('User org not found');

    // 2. Generate Structure via AI
    const { generatePersonalizedPath } = await import('./aiService');
    const courseStructure = await generatePersonalizedPath(goal, userLevel, timeCommitment, role, outcome);

    if (!courseStructure) throw new Error('Failed to generate course structure');

    // 3. Save to DB
    const { data: course, error } = await supabase
        .from('courses')
        .insert({
            org_id: profile.org_id,
            name: courseStructure.title,
            description: courseStructure.description || `Personalized path for ${goal}`,
            structure: courseStructure
            // created_by: user.id // Column missing in DB, removing to fix PGRST204
        })
        .select()
        .single();

    if (error) throw error;

    // 4. Enroll User (create user_course)
    const { error: programError } = await supabase
        .from('user_courses')
        .insert({
            user_id: user.id,
            course_id: course.id,
            course_context: {
                goal,
                role,
                outcome,
                // Add defaults for other fields
                kpi: '',
                workflowToBuild: '',
                roiOutcome: outcome,
                timeline: timeCommitment
            }
        });

    if (programError) console.error('Failed to auto-enroll user:', programError);

    return course;
}
export async function generateFlashCards(_user: User) {
    console.log('⚡️ Starting Flash Card generation...');

    // Initialize OpenAI
    // Note: Using client-side key is not recommended for production but acceptable for this prototype/admin tool
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing VITE_OPENAI_API_KEY');
    }

    // 1. Fetch all courses
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*');

    if (error) throw error;

    let totalUpdated = 0;

    for (const course of courses || []) {
        console.log(`Processing Course: ${course.name}`);
        let structure = course.structure || {};
        let learningPath = structure.learningPath || [];
        let modified = false;

        for (const module of learningPath) {
            for (const lesson of module.lessons || []) {
                // Only generate if missing
                if (!lesson.flash_card_title) {
                    console.log(`Generating for Lesson: ${lesson.title}`);
                    try {
                        const { generateAIResponse } = await import('./aiService');
                        const response = await generateAIResponse([
                            {
                                role: "user",
                                content: `Lesson Title: ${lesson.title}\n\nLesson Content:\n${(lesson.content || '').substring(0, 5000)}`
                            }
                        ], `You are an expert instructional designer. Your task is to convert a standard lesson into a specific "Job to be Done" Flash Card.
                        
                        1. **Title**: Create a specific, action-oriented "How to..." title. It should solve a specific problem. (e.g., instead of "API Keys", use "How to Generate an API Key").
                        2. **Content**: Create a concise, step-by-step guide or summary. Use Markdown. Keep it under 200 words. Focus on the "Action" or "Solution".
                        
                        Return JSON format: { "title": "string", "content": "string" }`, true);

                        const content = response.content;
                        if (content) {
                            let jsonStr = content;
                            if (jsonStr.includes('```')) {
                                jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
                            }
                            const result = JSON.parse(jsonStr);

                            if (result.title && result.content) {
                                lesson.flash_card_title = result.title;
                                lesson.flash_card_content = result.content;
                                modified = true;
                                totalUpdated++;
                                console.log(`Generated: ${result.title}`);
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to process lesson ${lesson.title}:`, e);
                    }
                }
            }
        }

        if (modified) {
            console.log(`Saving updates for course: ${course.name}`);
            const { error: updateError } = await supabase
                .from('courses')
                .update({ structure: structure })
                .eq('id', course.id);

            if (updateError) {
                console.error(`Failed to update course ${course.name}:`, updateError);
            }
        }
    }

    return totalUpdated;
}
