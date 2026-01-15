import { generateAIResponse } from './aiService';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class OpenAIService {
    // Mock key check since we are using Gemini backend now
    hasKey(): boolean {
        return true;
    }

    async getChatCompletion(messages: ChatMessage[], _model: string = 'gemini-3-pro-preview'): Promise<string> {
        console.log("🔄 Routing OpenAIService call to Gemini...");
        try {
            // Map 'system' role to systemPrompt if possible, or prepend to messages
            const systemMsg = messages.find(m => m.role === 'system');
            const otherMessages = messages.filter(m => m.role !== 'system');

            const response = await generateAIResponse(
                otherMessages.map(m => ({ role: m.role, content: m.content })),
                systemMsg?.content,
                false
            );

            if (response.content && response.content.startsWith('[SYSTEM ERROR]')) {
                throw new Error(response.content);
            }

            return response.content || "No response generated.";
        } catch (error) {
            console.error("Gemini (via OpenAIService) Error:", error);
            throw error;
        }
    }

    async getAudioCompletion(_messages: any[], _audioInput?: string): Promise<{ text: string, audioData?: string }> {
        // Fallback or todo: Gemini Audio not yet implemented in this shim
        // For now, return a text-only response saying it's not supported to prevent crash
        console.warn("Audio completion requested but not supported in Gemini transition.");
        return { text: "Audio features are temporarily unavailable while we upgrade our AI engine." };
    }

    async rewriteContent(content: string, memory: any): Promise<string> {
        console.log("🔄 Routing rewriteContent to Gemini...");

        // 1. protect media
        const { protectedContent, mediaMap } = this.preserveMedia(content);

        const prompt = `
        You are an expert instructional designer.
        Your goal is to rewrite the following lesson content to be highly personalized for the user based on their profile.

        User Profile:
        - Role: ${memory.Role || 'General Learner'}
        - Industry: ${memory.Industry || 'General Business'}
        - Goal: ${memory.Goal || 'Mastery'}
        - Additional Context: ${memory.Context || 'None'}

        Instructions:
        1. Keep the core learning objectives and key concepts EXACTLY the same.
        2. Change examples, scenarios, and analogies to match the user's Industry and Role.
        3. Adjust the tone to align with their Goal (e.g., if "Promotion", make it more leadership-focused).
        4. Maintain Markdown formatting.
        5. Do NOT shorten the content; keep it comprehensive.
        6. **CRITICAL:** The content contains media tokens like [[MEDIA_0]], [[MEDIA_1]]. You MUST preserve these tokens in the output, placing them in the relevant sections where the original image/video would be. DO NOT REMOVE THEM.

        Original Content:
        ${protectedContent}
        `;

        // Use getChatCompletion which we just redirected to Gemini
        const response = await this.getChatCompletion([
            { role: 'system', content: "You are a helpful AI that personalizes learning content." },
            { role: 'user', content: prompt }
        ]);

        // 2. Restore media
        return this.restoreMedia(response, mediaMap);
    }

    private preserveMedia(content: string): { protectedContent: string, mediaMap: Map<string, string> } {
        const mediaMap = new Map<string, string>();
        let counter = 0;

        // Regex for Markdown Images: ![alt](url)
        // Regex for HTML tags (img, video, iframe, figure) - simple assumption they are one line or block
        // We use a placeholder [[MEDIA_X]]

        const replace = (match: string) => {
            const key = `[[MEDIA_${counter++}]]`;
            mediaMap.set(key, match);
            return key;
        };

        // 1. Markdown Images
        let protectedContent = content.replace(/!\[.*?\]\(.*?\)/g, replace);

        // 2. HTML Video/Iframe/Img tags (naive but effective for standard embeds)
        protectedContent = protectedContent.replace(/<(img|video|iframe|figure)[^>]*>.*?<\/\1>|<(img|video|iframe)[^>]*\/>/gs, replace);

        return { protectedContent, mediaMap };
    }

    private restoreMedia(content: string, mediaMap: Map<string, string>): string {
        let restored = content;
        mediaMap.forEach((original, placeholder) => {
            restored = restored.replace(placeholder, original);
        });
        return restored;
    }

    async getEmbeddings(text: string): Promise<number[]> {
        // Use real Gemini embeddings via aiService
        try {
            // Import dynamically or assume it's available since they are in same project
            // But wait, circular dependency? openAi uses aiService. aiService doesn't use openAi. Safe.
            const { generateEmbedding } = await import('./aiService');
            return await generateEmbedding(text);
        } catch (e) {
            console.error("Embedding generation failed in Shim:", e);
            return new Array(1536).fill(0);
        }
    }

    async transcribeAudio(_file: File): Promise<string> {
        console.warn("Transcription requested but not supported in Gemini transition.");
        return "Transcription unavailable.";
    }
}

export const openAIService = new OpenAIService();
