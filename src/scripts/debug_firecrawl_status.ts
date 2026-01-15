
// Native fetch used

const API_KEY = 'fc-f95781e92e0742c6b5732da19a322c09';
const AGENT_URL = 'https://api.firecrawl.dev/v2/agent';
const JOB_ID = '019b3da6-6c78-7178-99f3-5c79f815bdfa'; // Result from previous run

async function testFirecrawlStatus() {
    console.log(`🕵️‍♀️ Checking Status for Job: ${JOB_ID}`);

    try {
        const response = await fetch(`${AGENT_URL}/${JOB_ID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        console.log('📥 Response Status:', response.status);
        const text = await response.text();
        console.log('📥 Raw Response Body:');
        console.log(text);

        try {
            const data = JSON.parse(text);
            console.log('✅ Parsed JSON Keys:', Object.keys(data));
            if (data.data) {
                console.log('   -> data property type:', typeof data.data);
                if (typeof data.data === 'object') {
                    console.log('   -> data keys:', Object.keys(data.data));
                }
            }
        } catch (e) {
            console.log('⚠️ Could not parse JSON');
        }

    } catch (error) {
        console.error('❌ Request Failed:', error);
    }
}

testFirecrawlStatus();
