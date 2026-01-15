export interface FirecrawlResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ScrapeResult {
    markdown: string;
    metadata?: any;
}

export interface MapResult {
    links: string[];
}

export interface CrawlStatus {
    status: 'scraping' | 'completed' | 'failed';
    total: number;
    completed: number;
    creditsUsed: number;
    data: any[];
}

export interface AgentJobStatus {
    success: boolean;
    status: 'processing' | 'completed' | 'failed';
    data?: any;
    expiresAt?: string;
    creditsUsed?: number;
    error?: string;
}

export interface AgentRequest {
    prompt: string;
    schema?: any; // JSON schema
    urls?: string[];
}

export class FirecrawlService {
    private apiKey: string;
    private baseUrl = 'https://api.firecrawl.dev/v1';
    private agentUrl = 'https://api.firecrawl.dev/v2/agent'; // v2 for Agent
    // Hardcoded key for demo purposes as requested ("keys across all accounts")
    private globalKey = 'fc-f95781e92e0742c6b5732da19a322c09';

    private static syncResults = new Map<string, any>();

    constructor(apiKey?: string) {
        this.apiKey = apiKey || localStorage.getItem('firecrawl_api_key') || this.globalKey;
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }
    async scrapeUrl(url: string, params?: any): Promise<FirecrawlResponse<any>> {
        if (!this.apiKey) return { success: false, error: 'API Key missing' };

        try {
            const response = await fetch(`${this.baseUrl}/scrape`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ url, ...params })
            });
            const data = await response.json();
            return { success: data.success, data: data.data, error: data.error };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async scrape(url: string, params?: any): Promise<FirecrawlResponse<any>> {
        return this.scrapeUrl(url, params);
    }

    async map(url: string, search?: string): Promise<FirecrawlResponse<MapResult>> {
        if (!this.apiKey) return { success: false, error: 'API Key missing' };

        try {
            const response = await fetch(`${this.baseUrl}/map`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ url, search })
            });
            const data = await response.json();
            return { success: data.success, data: data.data || data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async crawl(url: string, params?: any): Promise<FirecrawlResponse<{ id: string }>> {
        if (!this.apiKey) return { success: false, error: 'API Key missing' };
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
        if (!this.apiKey) return { success: false, error: 'API Key missing' };

        console.log('🕵️‍♀️ Starting Agent Job:', request);

        try {
            const response = await fetch(`${this.agentUrl}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request)
            });

            const data = await response.json();
            console.log('🕵️‍♀️ Agent Response:', data);

            // If it returns a job ID (async)
            if (data.jobId || data.id) {
                return {
                    success: true,
                    data: { id: data.jobId || data.id }
                };
            }

            // If it returns completed data immediately (sync)
            if (data.success && data.status === 'completed') {
                const syncId = 'SYNC_COMPLETE_' + Date.now();
                // Store the data so getAgentStatus can find it
                // SAFETY NET: If data.data is missing, use the whole data object
                FirecrawlService.syncResults.set(syncId, data.data || data);
                return { success: true, data: { id: syncId } };
            }

            return { success: false, error: 'Did not receive Job ID' };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async getAgentStatus(jobId: string): Promise<FirecrawlResponse<AgentJobStatus>> {
        if (!this.apiKey) return { success: false, error: 'API Key missing' };

        // Handle our fake sync id
        if (jobId.startsWith('SYNC_COMPLETE_')) {
            const storedData = FirecrawlService.syncResults.get(jobId);
            return {
                success: true,
                data: {
                    success: true,
                    status: 'completed',
                    data: storedData // Return the stored data
                }
            };
        }

        try {
            const response = await fetch(`${this.agentUrl}/${jobId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async checkCrawlStatus(jobId: string): Promise<FirecrawlResponse<CrawlStatus>> {
        if (!this.apiKey) return { success: false, error: 'API Key missing' };

        try {
            const response = await fetch(`${this.baseUrl}/crawl/${jobId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const data = await response.json();
            return { success: data.success, data: data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
