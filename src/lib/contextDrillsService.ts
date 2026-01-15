import { generateAIResponse } from './aiService';

// Context-aware practice generation functions

export async function generateExplainBackTopic(courseContext: string) {
    const prompt = `Based on this course content:

${courseContext.substring(0, 2000)}

Generate ONE specific concept/topic that a learner should be able to explain.
- Pick a concrete topic from the course material
- Make it practical and teachable
- Avoid generic concepts

Return ONLY a JSON object (no markdown) with this structure:
{
    "concept": "[Specific concept name from the course]",
    "context": "[1-2 sentence description of what learner should explain]"
}`;

    const response = await generateAIResponse([
        { role: 'user', content: prompt }
    ]);

    if (!response.content) return null;

    try {
        let jsonStr = response.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to parse explain-back topic:', e);
        return null;
    }
}

export async function generateMicroDrills(courseContent: string, count: number = 5) {
    const prompt = `Based on this course material:

${courseContent.substring(0, 3000)}

Generate ${count} multiple-choice questions to test understanding.
- Questions must be specific to the course content
- Include realistic scenarios from the documentation
- Avoid generic knowledge questions
- Make them practical and applicable

Return ONLY valid JSON (no markdown) with this structure:
{
    "drills": [
        {
            "question": "[Specific question about course content]",
            "options": ["option1", "option2", "option3", "option4"],
            "correct": 0
        }
    ]
}`;

    const response = await generateAIResponse([
        { role: 'user', content: prompt }
    ]);

    if (!response.content) return null;

    try {
        let jsonStr = response.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        const parsed = JSON.parse(jsonStr);
        return parsed.drills || [];
    } catch (e) {
        console.error('Failed to parse micro drills:', e);
        return null;
    }
}

export async function generateScenario(courseContent: string) {
    const prompt = `Based on this course material:

${courseContent.substring(0, 3000)}

Generate ONE realistic roleplay scenario where a learner practices explaining a concept from the course.
- Base it on actual content from the documentation
- Create a realistic context (e.g., explaining to a colleague, troubleshooting with a user)
- Make it practical and applicable to real work

Return ONLY valid JSON (no markdown) with this structure:
{
    "title": "[Scenario title from course content]",
    "context": "[2-3 sentence setup of the situation]",
    "role": "[Who the learner is playing]",
    "goal": "[What they need to accomplish]"
}`;

    const response = await generateAIResponse([
        { role: 'user', content: prompt }
    ]);

    if (!response.content) return null;

    try {
        let jsonStr = response.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to parse scenario:', e);
        return null;
    }
}
