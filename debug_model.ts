
const GEMINI_API_KEY = 'AIzaSyC1QFVfuMWt14FKSRlE4iMR3WIid4_Z1Ik';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

async function test() {
    console.log('Testing gemini-3-pro-preview...');
    try {
        const response = await fetch(
            `${GEMINI_API_BASE}/models/gemini-3-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
                })
            }
        );

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
