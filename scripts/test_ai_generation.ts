import dotenv from 'dotenv';

// Load env vars BEFORE importing app code
dotenv.config();

// Polyfill import.meta.env for Node.js execution
// @ts-ignore
global.import = { meta: { env: process.env } };

async function test() {
    console.log('🧪 Testing AI Course Generation...');
    console.log('API Key present:', !!process.env.VITE_OPENAI_API_KEY);

    // Dynamic import to ensure env vars are loaded first
    const { generateCourseStructure } = await import('../src/lib/aiService');

    const topic = 'AirOps Mastery';
    const context = `
    # AirOps Documentation
    AirOps is a platform for building AI workflows.
    Key features:
    - Workflow Builder
    - Data Integration
    - Model Management
    `;

    try {
        const result = await generateCourseStructure(topic, context);

        if (result) {
            console.log('\n✅ SUCCESS! AI returned a valid structure.');
            console.log('Skills:', result.skills?.length);
            console.log('Modules:', result.learningPath?.length);

            const firstLesson = result.learningPath?.[0]?.lessons?.[0];
            if (firstLesson?.content && firstLesson.content.length > 50) {
                console.log('\n📝 Content Preview:');
                console.log(firstLesson.content.substring(0, 200) + '...');
            } else {
                console.log('\n⚠️ WARNING: Lesson content is missing or too short!');
            }
        } else {
            console.log('\n❌ FAILED: AI returned null.');
        }
    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }
}

test();
