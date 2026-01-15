
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Polyfill import.meta.env
// @ts-ignore
global.import = { meta: { env: process.env } };

async function testOpenAI() {
    console.log('🧪 Testing GPT-5.1 Service Integration...');

    if (!process.env.VITE_OPENAI_API_KEY) {
        console.error('❌ VITE_OPENAI_API_KEY is missing!');
        return;
    }

    try {
        const { generateAIResponse } = await import('./src/lib/aiService');

        console.log('Sending request to GPT-5.1...');
        const response = await generateAIResponse(
            [{ role: 'user', content: 'Write a haiku about code.' }],
            'You are a helpful assistant.'
        );

        if (response.content) {
            console.log('✅ SUCCESS:', response.content);
            console.log('Role:', response.role);
        } else {
            console.error('❌ FAILED: No content returned');
            console.log('Response object:', response);
        }
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

testOpenAI();
