
import dotenv from 'dotenv';

dotenv.config();

// @ts-ignore
global.import = { meta: { env: process.env } };

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const OPENAI_API_BASE = 'https://api.openai.com/v1';

async function testGPT51() {
    console.log('🧪 Testing GPT-5.1...');

    if (!OPENAI_API_KEY) {
        console.error('❌ VITE_OPENAI_API_KEY is missing!');
        return;
    }

    // Test 1: Standard Chat Completions with model="gpt-5.1"
    console.log('\n--- Test 1: Chat Completions (gpt-5.1) ---');
    try {
        const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-5.1',
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('✅ Chat Completions SUCCESS:', data);
        } else {
            console.log('❌ Chat Completions FAILED:', data.error?.message);
        }
    } catch (e) {
        console.error('Test 1 Error:', e);
    }

    // Test 2: Hypothetical "Responses" Endpoint
    console.log('\n--- Test 2: Responses Endpoint (/v1/responses) ---');
    try {
        const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-5.1',
                input: 'Hello',
                reasoning: { effort: 'low' },
                text: { verbosity: 'low' }
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('✅ Responses Endpoint SUCCESS:', data);
        } else {
            console.log('❌ Responses Endpoint FAILED:', data.error?.message || response.statusText);
        }
    } catch (e) {
        console.error('Test 2 Error:', e);
    }
}

testGPT51();
