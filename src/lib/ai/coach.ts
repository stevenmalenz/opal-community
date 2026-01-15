import { generateAIResponse } from '../aiService';

export type ResourceSuggestion = {
    title: string;
    url: string;
    type: 'documentation' | 'blog' | 'video' | 'website';
    reason: string;
};


/**
 * Suggests resources (URLs) for a given topic to help an Admin build a course.
 */
export async function suggestResources(topic: string): Promise<ResourceSuggestion[]> {
    try {
        const systemPrompt = `You are an expert curriculum developer. 
        The user wants to build a course on a specific topic. 
        Your job is to find/suggest high-quality OFFICIAL documentation, guides, or key resources (URLs) that should be scraped/ingested to build this course.
        
        Focus on:
        1. Official Documentation
        2. Getting Started Guides
        3. Core Concepts / API References
        
        Return a JSON array of objects with keys: title, url, type, reason.`;

        const response = await generateAIResponse(
            [{ role: 'user', content: `I want to build a course about: "${topic}". Suggest 3-5 high-quality resources.` }],
            systemPrompt,
            true // jsonMode
        );

        const content = response.content;
        if (!content) return [];

        // Parse JSON (handle markdown wrapping)
        let jsonStr = content;
        if (jsonStr.includes('```')) {
            jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        const result = JSON.parse(jsonStr);
        return result.resources || result.urls || result.items || [];
    } catch (error) {
        console.error("Error suggesting resources:", error);
        return [];
    }
}

/**
 *  Interactive Coach: Chat with the user to understand their goals.
 */
export async function chatWithCoach(history: { role: 'system' | 'user' | 'assistant', content: string }[]) {
    // Extract system prompt if present in history
    const systemMessage = history.find(m => m.role === 'system');
    const systemPrompt = systemMessage ? systemMessage.content : undefined;

    // Filter out system message from history passed to generateAIResponse as it handles system prompt separately
    const validHistory = history.filter(m => m.role !== 'system');

    const response = await generateAIResponse(validHistory, systemPrompt);
    return response.content;
}
