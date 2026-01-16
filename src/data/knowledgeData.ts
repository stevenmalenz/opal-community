export interface KnowledgeSource {
    id: string;
    type: 'url' | 'file';
    title: string;
    content: string;
    status: 'ready' | 'processing' | 'error';
    metadata?: string;
}

export const GLOBAL_SOURCES: KnowledgeSource[] = [
    {
        id: 'global_1',
        type: 'url',
        title: 'Optimizely Opal Docs (Official)',
        content: `
# Optimizely Opal Overview

Optimizely Opal is a **Marketing Resource Management (MRM)** platform designed to help marketing teams plan, create, and orchestrate content and campaigns.

## Key Features
- **Campaign Planning**: Centralized calendar and timeline views for all marketing activities.
- **Content Creation**: Collaborative tools for drafting social posts, emails, and articles.
- **Approvals**: Automated workflows to ensure brand compliance and legal review.
- **AI Assistant**: Built-in AI for generating variations, summarizing threads, and translating content.

## User Roles
- **Admin**: Full control over settings, users, and workflows.
- **Editor**: Can create and edit content.
- **Viewer**: Read-only access to calendars and finalized assets.

## Integration
Opal integrates with downstream systems like CMS (Optimizely CMS, WordPress), Social Networks (LinkedIn, Twitter), and DAMs.
        `,
        status: 'ready',
        metadata: 'https://docs.optimizely.com/opal'
    }
];
