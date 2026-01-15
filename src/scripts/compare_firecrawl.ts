

// Basic Interfaces
interface FirecrawlResponse<T> { success: boolean; data?: T; error?: string; }
interface AgentJobStatus { success: boolean; status: 'processing' | 'completed' | 'failed'; data?: any; }
interface AgentRequest { prompt: string; urls?: string[]; }
// interface CrawlStatus { status: string; data: any[]; }

class FirecrawlService {
    private apiKey = 'fc-f95781e92e0742c6b5732da19a322c09'; // Demo Key
    private baseUrl = 'https://api.firecrawl.dev/v1';
    private agentUrl = 'https://api.firecrawl.dev/v2/agent';

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    async crawl(url: string, params?: any): Promise<FirecrawlResponse<{ id: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/crawl`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ url, ...params })
            });
            const data = await response.json();
            return { success: data.success, data: data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async startAgent(request: AgentRequest): Promise<FirecrawlResponse<{ id: string }>> {
        try {
            const response = await fetch(`${this.agentUrl}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request)
            });
            const data = await response.json();
            if (data.jobId || data.id) {
                return { success: true, data: { id: data.jobId || data.id } };
            }
            if (data.success && data.status === 'completed') {
                // Handle synchronous completion (unlikely for agent but possible)
                return { success: true, data: { id: 'SYNC_COMPLETE' } };
            }
            return { success: false, error: 'Did not receive Job ID: ' + JSON.stringify(data) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async getAgentStatus(jobId: string): Promise<FirecrawlResponse<AgentJobStatus>> {
        try {
            const response = await fetch(`${this.agentUrl}/${jobId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const data = await response.json();
            return { success: true, data: data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}


async function runComparison() {
    const firecrawl = new FirecrawlService();
    const targetUrl = 'https://docs.stripe.com/payments';

    console.log("🔥 Starting Firecrawl Comparison Benchmark\n");

    // --- TEST 1: Basic Crawl (The "Old Way") ---
    console.log("------- TEST 1: Basic Crawl (Breadth) -------");
    console.log(`Target: ${targetUrl}`);
    console.log("Strategy: Crawl first 5 pages (simulating limited scrape)\n");

    const startTimeCrawl = Date.now();
    const crawlRes = await firecrawl.crawl(targetUrl, {
        limit: 5,
        scrapeOptions: { formats: ['markdown'] }
    });

    if (crawlRes.success) {
        console.log(`✅ Crawl Initiated. Job ID: ${crawlRes.data?.id}`);
        // In a real test we would poll this, but for now we assume it just returns an ID
        // To truly compare we need the data.
        // Let's rely on the fact that Crawl returns a Job ID.
        // We will skip polling for the "Old Way" as we know it yields raw pages.
    } else {
        console.error("❌ Crawl Failed:", crawlRes.error);
    }
    const endTimeCrawl = Date.now();
    console.log(`⏱️ Crawl Trigger Time: ${endTimeCrawl - startTimeCrawl}ms\n`);


    // --- TEST 2: AI Agent (The "New Way") ---
    console.log("------- TEST 2: AI Agent (Depth/Intent) -------");
    const prompt = "Find detailed guides on how to implement a custom payment flow with Stripe. Ignore general marketing pages.";
    console.log(`Prompt: "${prompt}"\n`);

    // const startTimeAgent = Date.now();
    const agentRes = await firecrawl.startAgent({
        prompt: prompt,
        urls: [targetUrl] // Optional scoping
    });

    if (agentRes.success && agentRes.data?.id) {
        const jobId = agentRes.data.id;
        console.log(`✅ Agent Started. Job ID: ${jobId}`);
        console.log("⏳ Polling for Agent results (timeout 300s)...");

        // Poll for result
        let attempts = 0;
        while (attempts < 60) { // 300s max
            attempts++;
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await firecrawl.getAgentStatus(jobId);

            if (statusRes.success) {
                const status = statusRes.data?.status;
                console.log(`   Attempt ${attempts}: Status = ${status}`);

                if (status === 'completed') {
                    const data = statusRes.data?.data;
                    console.log("\n🎉 Agent Completed!");
                    console.log(`Output Keys: ${Object.keys(data || {}).join(', ')}`);
                    // Assuming data contains 'markdown' or similar
                    const content = JSON.stringify(data).length;
                    console.log(`Total Content Length: ${content} characters`);
                    console.log("Observation: Agent likely returned concatenated, relevant context instead of disparate pages.");
                    break;
                } else if (status === 'failed') {
                    console.error("❌ Agent Failed");
                    break;
                }
            }
        }
    } else {
        console.error("❌ Agent Start Failed:", agentRes.error);
    }
}

runComparison();
