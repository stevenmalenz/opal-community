import { generateText } from 'ai';

// API Keys - Strictly following AGENTS.MD rules
const AI_GATEWAY_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.AI_GATEWAY_API_KEY) || (typeof process !== 'undefined' ? process.env?.AI_GATEWAY_API_KEY : undefined);
const FIRE_CRAWL_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.FIRE_CRAWL_API_KEY) || (typeof process !== 'undefined' ? process.env?.FIRE_CRAWL_API_KEY : undefined) || 'fc-f95781e92e0742c6b5732da19a322c09';
const FIRE_CRAWL_API_BASE = 'https://api.firecrawl.dev/v1';

/**
 * Core AI Response generator.
 * Strictly using Vercel AI Gateway pattern with provider/model string identifiers.
 */
export async function generateAIResponse(messages: { role: string; content: string }[], systemPrompt?: string, jsonMode: boolean = false, useSearch: boolean = false): Promise<{ content: string; role: string; groundingMetadata?: any }> {
    try {
        if (!AI_GATEWAY_API_KEY) {
            throw new Error('AI_GATEWAY_API_KEY is not configured. Please add it to your .env file or Vercel environment.');
        }

        // AGENTS.MD Rule: "Always specify models using provider/model identifiers"
        // and "Always use the ai SDK (generateText, streamText, etc.)"
        const userMessage = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

        console.log('✨ Sending request via Vercel AI Gateway (google/gemini-3-pro-preview)...');

        const result = await generateText({
            model: 'google/gemini-3-pro-preview' as any, // Cast to any because the string identifier might be a new SDK feature
            system: systemPrompt,
            prompt: userMessage,
        });

        console.log('📦 AI Response received, length:', result.text?.length);

        return {
            content: result.text || '',
            role: 'assistant'
        };
    } catch (error: any) {
        console.error('AI Service Error:', error);
        return {
            content: `[SYSTEM ERROR] AI Service Failed: ${error.message || String(error)}`,
            role: 'assistant'
        };
    }
}

import { embed } from 'ai';

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        if (!AI_GATEWAY_API_KEY) {
            throw new Error('AI_GATEWAY_API_KEY is not configured.');
        }

        const { embedding } = await embed({
            model: 'google/text-embedding-004' as any,
            value: text,
        });

        return embedding;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        // Fallback to zero vector to avoid crashing the app
        return new Array(768).fill(0); // Gemini 3 embeddings fallback
    }
}

export async function generateCourseStructure(topic: string, context: string) {
    console.log('🤖 generateCourseStructure called with:', { topic, contextLength: context.length });

    // Extract parameters from context
    const lines = context.split('\n');
    const coursePurpose = lines.find(l => l.includes('Course Purpose:')) || '';

    // Extract User Role or infer it
    let userRole = lines.find(l => l.includes('User Role:'))?.replace('User Role:', '').trim();
    if (!userRole || userRole === 'undefined') userRole = 'Aspiring Expert'; // Default if extraction fails

    // Extract Capstone or use Goal
    let capstoneGoal = lines.find(l => l.includes('Capstone Project:'))?.replace('Capstone Project:', '').trim();
    const userGoal = lines.find(l => l.includes('User Goal:'))?.replace('User Goal:', '').trim();

    if (!capstoneGoal || capstoneGoal === 'undefined') {
        capstoneGoal = userGoal ? `Complete the goal: "${userGoal}"` : 'Final Project';
    }

    // Extract images from markdown context
    const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
    let match;
    const extractedImages: string[] = [];
    while ((match = markdownImageRegex.exec(context)) !== null) {
        if (match[1] && !extractedImages.includes(match[1])) {
            extractedImages.push(match[1]);
        }
    }

    // Also check for "Available Images" list if present
    const explicitMatches = context.match(/Available Images.*?:\\n([^]*?)(?=\\n\\n|$)/);
    if (explicitMatches) {
        const urls = explicitMatches[1].split('\\n').filter(Boolean);
        urls.forEach(url => !extractedImages.includes(url) && extractedImages.push(url));
    }

    const imageUrls = extractedImages;

    const systemPrompt = `ROLE: You are an Elite Learning Architect and Creative Coach (Artist's Way Style).
    Your goal is NOT just to teach a tool, but to guide the user (${userRole}) to build their "Masterpiece" (${capstoneGoal}).

    CONTEXT:
    - User Role: ${userRole} (If generic, invent a specific professional persona based on the context)
    - Capstone Goal: ${capstoneGoal} (Ensure this drives the curriculum)
    - Assets: ${imageUrls.length > 0 ? `Available Images: ${JSON.stringify(imageUrls)}` : 'No images found from research.'}
    - Doc Content:
    ${context}

    CRITICAL INSTRUCTION:
    The "User Role" and "Capstone Goal" provided above are the SOURCE OF TRUTH. 
    Even if the "Doc Content" suggests a different audience or use case, you MUST build the course for THIS specific User Role and THIS Capstone Goal. 
    Do not hallucinate a different goal. Stick to: "${capstoneGoal}".

    THE PEDAGOGY (The Artist's Journey):
    1. **Capstone-First:** Every module MUST contribute a piece to the "${capstoneGoal}". 
       - Module 1: Foundation/Sketching
       - Module 2: Building Core Components
       - Module 3: Refining & automating
       - Module 4: The Final Polish & Launch
    2. **Visual Thinking:** You MUST explicitly embed images from the "Assets" list.
       - **CRITICAL:** Use at least 2 images per lesson IF they are in the Assets list.
       - **DO NOT** use placeholders or external URLs (like Unsplash). If no asset fits, use NO image.
    3. **Action-Oriented:** Every concept must be followed by a "## The Challenge" section with *numbered, step-by-step instructions* (e.g. "1. Open Clay. 2. Click 'New Table'.").
    4. **Depth:** Each Module MUST have 3-5 lessons. 
    5. **Comprehensive Content:** Target 800+ words per lesson. Explain "Why", "How", and "What if".
    6. **No Wall of Text:** Use bullet points, bolding, and code blocks to break up text.

    COURSE ARCHITECTURE (JSON):
    Create a course that feels "Premium".
    - **Title:** Catchy, Benefit-Driven (e.g., "Automating the Impossible: The Guide to X").
    - **Modules:** Grouped by "Jobs to be Done".
    - **Lessons:** 
        - **Content Structure (Markdown string):**
            # [Title]
            
            ## The Hook
            [Provocative story/question. Embed an image here if relevant]
            
            ## The Concept
            [Clear explanation. Use bolding for key terms.]
            
            > [!NOTE]
            > [Key insight or "Aha!" moment]
            
            ## Real World Example
            [Specific Use Case or Code Snippet]
            
            ## The Challenge
            [Interactive prompt: "Open your editor and..."]

    CONSTRAINTS:
    - Use information from ALL provided pages.
    - **CRITICAL:** Use Markdown formatting heavily in the 'content' field.
    - **CRITICAL:** Embed at least 1 image per lesson if available in the Assets list.
    - **Tone:** Professional, energetic, intelligent.

    OUTPUT FORMAT:
    {
        "title": "[Title]",
        "inferredCapstone": "[A specific, actionable project title. Do NOT include labels like 'Capstone:' or 'Project:']",
        "skills": [{ "id": "1", "name": "[Skill]", "score": 0, "target": 100, "category": "[Category]" }],
        "learningPath": [
            {
                "id": "m1",
                "title": "[Module Title]",
                "lessons": [
                    {
                        "title": "[Lesson Title]",
                        "type": "Article",
                        "duration": "10 min",
                        "content": "[Markdown Content string with images]"
                    }
                ]
            }
        ],
        "scenarios": [
            {
                "id": "s1",
                "title": "[Scenario Title]",
                "difficulty": "Intermediate",
                "duration": "15 min",
                "context": "[Context]",
                "role": "Builder",
                "goal": "[Goal]"
            }
        ]
    }`;

    try {
        // CRITICAL FIX: Pass the full context (Research + User Chat) to the model
        const response = await generateAIResponse([
            {
                role: 'user',
                content: `Generate a complete course structure for: ${coursePurpose}.
                
                RESEARCHED CONTENT & CONTEXT:
                ${context}
                
                Generate the JSON now.`
            }
        ], systemPrompt, true);

        if (!response.content) {
            console.log('⚠️ AI returned null content');
            return null;
        }

        // Check for system error pass-through
        if (response.content.startsWith('[SYSTEM ERROR]')) {
            console.error('❌ AI returned system error:', response.content);
            throw new Error(response.content);
        }

        console.log('📦 Raw AI Response (first 500 chars):', response.content.substring(0, 500));

        // Attempt to parse JSON
        let jsonStr = response.content;

        // Clean up markdown blocks if present
        if (jsonStr.includes('```')) {
            jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        // Find JSON boundaries
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsedResponse = JSON.parse(jsonStr);
        console.log('✅ Successfully parsed AI response');

        return parsedResponse;
    } catch (error: any) {
        console.error('❌ Error generating course structure:', error);
        // Throw instead of returning null so caller can see the actual error
        throw new Error(`Course structure generation failed: ${error?.message || String(error)}`);
    }
}


export async function generatePersonalizedPath(goal: string, userLevel: string, timeCommitment: string, role?: string, outcome?: string) {
    console.log('🎯 generatePersonalizedPath called with:', { goal, userLevel, timeCommitment, role, outcome });

    const systemPrompt = `ROLE: You are an expert Learning Coach and Curriculum Designer.
    
    GOAL: Create a personalized learning path for a user with the following profile:
    - **Goal:** ${goal}
    - **Current Knowledge Level:** ${userLevel}
    - **Time Commitment:** ${timeCommitment}
    ${role ? `- **User Role:** ${role}` : ''}
    ${outcome ? `- **Desired Outcome / ROI:** ${outcome}` : ''}

    DIRECTIVES:
    1. **Personalization:** Tailor the difficulty and pacing to the user's level and time.
    2. **Actionable:** Each lesson must have a clear takeaway.
    3. **Structure:** Create a logical progression of modules.
    4. **Tone:** Encouraging but professional.
    5. **ROI & Career Focus:** Your FINAL module MUST be titled "Career ROI & Application". It must explicitly cover how to apply these skills to their specific role (${role || "their field"}), how to measure impact/ROI, and how to achieve their outcome (${outcome || "career growth"}). 
    
    OUTPUT FORMAT:
    Return ONLY valid JSON with this structure (no markdown code blocks):
    {
        "title": "[Engaging Course Title]",
        "description": "[Brief description of the path, mentioning career impact]",
        "skills": [
            { "id": "1", "name": "[Core Skill 1]", "score": 0, "target": 100, "category": "Core" }
        ],
        "learningPath": [
            {
                "id": "m1",
                "title": "[Module 1 Title]",
                "status": "unlocked",
                "lessons": [
                    {
                        "id": "l1",
                        "title": "[Lesson 1 Title]",
                        "type": "Article", // or "Video", "Quiz"
                        "duration": "10 min",
                        "content": "# [Lesson Title]....content..."
                    }
                ]
            }
        ]
    }`;

    try {
        const response = await generateAIResponse([
            { role: 'user', content: `Create a learning path for: ${goal}` }
        ], systemPrompt, true);

        if (!response.content) return null;

        // Check for System Error pass-through
        if (response.content.startsWith('[SYSTEM ERROR]')) {
            throw new Error(response.content);
        }

        // Parse JSON
        let jsonStr = response.content;

        // 1. Try to extract strictly from markdown code block first
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1];
        }

        // 2. Find JSON boundaries (curly braces)
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse Failed. Raw content:", response.content);
            throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`);
        }

    } catch (error) {
        console.error('❌ Error generating personalized path:', error);
        throw error; // Rethrow so the UI can see the specific error
    }
}

export async function gradeHomework(assignment: string, submission: string, userContext?: any) {
    console.log('📝 gradeHomework called');
    const systemPrompt = `ROLE: You are an expert Grading Assistant and Coach.
    
    TASK: Grade the user's homework submission against the assignment.
    
    CONTEXT:
    - Assignment: "${assignment}"
    - User Submission: "${submission}"
    ${userContext ? `- User Context: ${JSON.stringify(userContext)}` : ''}
    
    OUTPUT:
    Return JSON:
    {
        "grade": "Pass" | "Fail" | "Needs Improvement",
        "score": number (0-100),
        "feedback": "Constructive feedback...",
        "nextSteps": "What they should focus on next..."
    }`;

    try {
        const response = await generateAIResponse([{ role: 'user', content: "Grade this submission." }], systemPrompt, true);
        if (!response.content) return null;

        let jsonStr = response.content;
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Grading failed:", e);
        return null;
    }
}

export async function generateNextLessonContent(prevLessonTitle: string, prevHomeworkFeedback: string, nextLessonTitle: string, userGoal: string) {
    console.log('⏭️ generateNextLessonContent called');
    const systemPrompt = `ROLE: You are an Adaptive Learning Designer.
    
    TASK: Write the content for the NEXT lesson in a sequence, adapting specifically to the user's recent performance.
    
    CONTEXT:
    - User Goal: ${userGoal}
    - Just Completed: "${prevLessonTitle}"
    - Feedback on previous work: "${prevHomeworkFeedback}"
    - Target Lesson Title: "${nextLessonTitle}"
    
    DIRECTIVES:
    1. Acknowledge their previous work briefly (e.g., "Great job on [topic]...").
    2. Transition smoothly to the new topic: "${nextLessonTitle}".
    3. If they struggled (based on feedback), include extra scaffolding or review.
    4. If they excelled, offer an "Advanced Tip" or challenge.
    5. Content must be comprehensive (Hook, Concept, Example, Challenge).
    
    OUTPUT:
    Return Markdown content.`;

    try {
        const response = await generateAIResponse([{ role: 'user', content: `Generate content for lesson: ${nextLessonTitle}` }], systemPrompt, false);
        return response.content;
    } catch (e) {
        console.error("Next lesson generation failed:", e);
        return null;
    }
}

export async function searchResources(topic: string) {
    console.log('🔍 searchResources called for:', topic);
    // Use Gemini to "guess" good documentation URLs (cheaper/faster than real search API for this prototype)
    const prompt = `You are a helpful research assistant. The user wants to learn about "${topic}".
    Provide 3-5 high-quality, official documentation or tutorial URLs for this topic.
    Return ONLY a JSON array of strings. Example: ["https://docs.example.com", "https://tutorial.com"]`;

    try {
        const response = await generateAIResponse([{ role: 'user', content: prompt }], undefined, true);
        if (!response.content) return [];

        let jsonStr = response.content;
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];

        const firstBracket = jsonStr.indexOf('[');
        const lastBracket = jsonStr.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Search failed:", e);
        return [];
    }
}

export async function scrapeUrl(url: string) {
    console.log('🔥 scrapeUrl called for:', url);

    if (!FIRE_CRAWL_API_KEY) {
        throw new Error("Missing FIRE_CRAWL_API_KEY");
    }

    try {
        const response = await fetch(`${FIRE_CRAWL_API_BASE}/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIRE_CRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url: url,
                formats: ['markdown']
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FireCrawl Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.data?.markdown || data.markdown || "";

    } catch (e) {
        console.error("Scrape failed:", e);
        throw e;
    }
}

export async function crawlUrl(url: string) {
    console.log('🕷️ crawlUrl called for:', url);

    if (!FIRE_CRAWL_API_KEY) {
        throw new Error("Missing FIRE_CRAWL_API_KEY");
    }

    try {
        const response = await fetch(`${FIRE_CRAWL_API_BASE}/crawl`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIRE_CRAWL_API_KEY}`
            },
            body: JSON.stringify({
                url: url,
                limit: 50,
                scrapeOptions: {
                    formats: ['markdown']
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FireCrawl Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.id; // Return the ID for polling

    } catch (e) {
        console.error("Crawl failed:", e);
        throw e;
    }
}

export async function generateClarifyingQuestions(toolName: string, researchContext: string, userGoal: string) {
    console.log('❓ generateClarifyingQuestions called for:', toolName);

    // Safety check: specific logic request from user
    // The user wants questions about: Role, Audience, Domain.

    const systemPrompt = `ROLE: You are an expert Enablement Architect. The user wants to build a course about "${toolName}".
    
    GOAL: You need to ask 3 targeted questions to refine the curriculum.
    Do NOT ask generic questions. Use the provided RESEARCH to be specific.
    
    CONTEXT:
    - Tool: ${toolName}
    - User Goal: ${userGoal}
    - Research Summary: ${researchContext.substring(0, 3000)}... (truncated for token limit)
    
    REQUIRED QUESTIONS:
    1. **User's Role**: Specific to how this tool defines permissions (e.g. Admin vs. Editor vs. Viewer). Look for this in the research.
    2. **Audience**: Who are they teaching? (e.g. Technical users vs. Business users).
    3. **Domain/Use Case**: What is the primary business value? (e.g. Marketing vs. Engineering vs. Sales).
    
    OUTPUT JSON FORMAT:
    {
        "intro": "A short, intelligent insight about the tool based on research (max 2 sentences).",
        "questions": [
            {
                "id": "role",
                "text": "Are you a [Role A] or [Role B]?",
                "options": ["Option A", "Option B", "Option C"]
            },
            {
                "id": "audience",
                "text": "Who is this course for?",
                "options": ["Option A", "Option B", "Option C"]
            },
            {
                "id": "domain",
                "text": "What is the primary use case?",
                "options": ["Option A", "Option B", "Option C"]
            }
        ]
    }`;

    try {
        const response = await generateAIResponse([
            { role: 'user', content: "Analyze the research and generate the clarifying questions." }
        ], systemPrompt, true);

        if (!response.content) return null;

        let jsonStr = response.content;
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Question generation failed:", e);
        // Fallback static questions if AI fails
        return {
            intro: `I've analyzed the documentation for ${toolName}. To customize the path, I need a few details.`,
            questions: [
                { id: 'role', text: "What is your role?", options: ["Admin", "Builder", "User"] },
                { id: 'audience', text: "Who is the audience?", options: ["Technical", "Non-technical", "Mixed"] },
                { id: 'domain', text: "What is the focus domain?", options: ["General", "Sales", "Support"] }
            ]
        };
    }
}

export async function checkCrawlStatus(id: string) {
    console.log('👀 checkCrawlStatus called for:', id);
    if (!FIRE_CRAWL_API_KEY) throw new Error("Missing FIRE_CRAWL_API_KEY");

    try {
        const response = await fetch(`${FIRE_CRAWL_API_BASE}/crawl/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FIRE_CRAWL_API_KEY}`
            }
        });
        return await response.json();
    } catch (e) {
        console.error("Check crawl status failed:", e);
        throw e;
    }
}

export async function generateCourseUpdates(currentStructure: any, userRequest: string) {
    console.log('✨ generateCourseUpdates called');
    const systemPrompt = `ROLE: You are an expert Curriculum Designer.
    GOAL: Update the existing course structure based on the user's request.
    
    INPUT:
    - Current Structure (JSON)
    - User Request: "${userRequest}"
    
    OUTPUT:
    - valid JSON of the updated structure.
    - KEEP existing IDs if possible.
    - ONLY return JSON.`;

    try {
        const response = await generateAIResponse([
            { role: 'user', content: `Current Structure: ${JSON.stringify(currentStructure)}\n\nRequest: ${userRequest}` }
        ], systemPrompt, true);

        if (!response.content) return null;

        let jsonStr = response.content;
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1];

        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Update course failed:", e);
        return null;
    }
}
