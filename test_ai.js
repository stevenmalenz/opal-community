// Quick AI Content Quality Test
// Purpose: Test if OpenAI is being called and returning valid content

import { generateCourseStructure } from './src/lib/aiService.js';

console.log('Testing AI Course Generation...\n');

const testContext = `
# AirOps Documentation

## Overview
AirOps is a platform for building and deploying AI workflows.

## Key Features
- Workflow Builder: Visual interface for creating AI workflows
- Data Integration: Connect to various data sources
- Model Management: Deploy and manage AI models
- Analytics: Track performance and usage
`;

try {
    const result = await generateCourseStructure('AirOps Mastery', testContext);

    console.log('\n✅ SUCCESS! AI returned a response\n');
    console.log('Structure:', JSON.stringify(result, null, 2));

    if (result && result.learningPath && result.learningPath.length > 0) {
        const firstLesson = result.learningPath[0]?.lessons?.[0];
        if (firstLesson?.content) {
            console.log('\n📝 First lesson content preview:');
            console.log(firstLesson.content.substring(0, 200) + '...');
        } else {
            console.log('\n⚠️ WARNING: Lessons missing content field!');
        }
    }
} catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('Full error:', error);
}
