
export interface LibraryItem {
    id: string;
    title: string;
    description: string;
    category: 'Marketing' | 'Sales' | 'Operations' | 'Data';
    author: string;
    authorRole: string;
    stats: {
        downloads: string;
        likes: string;
    };
    version: string;
    verified: boolean;
    tags: string[];
}

export interface RequestItem {
    id: string;
    title: string;
    description: string;
    category: string;
    upvotes: number;
    status: 'Under Review' | 'Planned' | 'In Progress';
    author: string;
}

export const libraryItems: LibraryItem[] = [
    {
        id: 'lib-1',
        title: 'SEO Content Auditor',
        description: 'Automatically scans your top 50 pages, checks for keyword decay, and generates a refresh brief for your writers. Saves ~4 hours per audit.',
        category: 'Marketing',
        author: 'Sarah Jenkins',
        authorRole: 'Head of SEO',
        stats: { downloads: '2.4k', likes: '856' },
        version: 'v2.1',
        verified: true,
        tags: ['SEO', 'Content', 'Automation']
    },
    {
        id: 'lib-2',
        title: 'Competitor Intel Scout',
        description: 'Monitors competitor pricing pages and press releases daily. Summarizes changes into a weekly Slack digest for the leadership team.',
        category: 'Marketing',
        author: 'Opal Team',
        authorRole: 'Official',
        stats: { downloads: '1.8k', likes: '942' },
        version: 'v1.0',
        verified: true,
        tags: ['Research', 'Strategy', 'Slack']
    },
    {
        id: 'lib-3',
        title: 'LinkedIn Personalizer Pro',
        description: 'Takes a blog post URL and generates 5 distinct LinkedIn posts in different styles (Thought Leader, Contrarian, Actionable, Story, Data).',
        category: 'Marketing',
        author: 'Marcus Chen',
        authorRole: 'Growth Lead',
        stats: { downloads: '3.1k', likes: '1.2k' },
        version: 'v3.0',
        verified: false,
        tags: ['Social Media', 'Writing', 'Viral']
    },
    {
        id: 'lib-4',
        title: 'RFP Response Assistant',
        description: 'Ingests security questionnaires and RFP docs, matches them against your knowledge base, and drafts 80% complete answers.',
        category: 'Sales',
        author: 'Priya Patel',
        authorRole: 'Sales Ops',
        stats: { downloads: '950', likes: '420' },
        version: 'v1.5',
        verified: true,
        tags: ['Sales', 'Docs', 'Efficiency']
    },
    {
        id: 'lib-5',
        title: 'Meeting Notes & Action Extractor',
        description: 'The "Gold Standard" prompt for turning messy transcripts into clean, tabled action items with owners and deadlines.',
        category: 'Operations',
        author: 'Opal Team',
        authorRole: 'Official',
        stats: { downloads: '5.2k', likes: '2.1k' },
        version: 'v4.2',
        verified: true,
        tags: ['Productivity', 'Meetings', 'Core']
    }
];

export const requestItems: RequestItem[] = [
    {
        id: 'req-1',
        title: 'HubSpot "Deal Rotting" Alert Agent',
        description: 'Need an agent that checks deals stuck in "Negotiation" for >14 days and pings the AE with a specific content piece to send to unstick it.',
        category: 'Sales',
        upvotes: 142,
        status: 'In Progress',
        author: 'Mike Ross'
    },
    {
        id: 'req-2',
        title: 'Podcast Repurposing Engine',
        description: 'Take an MP3 file, transcribe it, and turn it into a blog post, newsletter, and 10 tweets. Currently doing this manually with 4 tools.',
        category: 'Marketing',
        upvotes: 98,
        status: 'Planned',
        author: 'Jessica Day'
    },
    {
        id: 'req-3',
        title: 'Automatic Customer Churn Analysis',
        description: 'Analyze support tickets from churned customers to find common patterns and report them to product team bi-weekly.',
        category: 'Data',
        upvotes: 76,
        status: 'Under Review',
        author: 'David Rose'
    },
    {
        id: 'req-4',
        title: 'Slack "Tone Police" Bot',
        description: 'A bot that privately DMs people if their message sounds aggressive or passive-aggressive before they send it. For culture.',
        category: 'Operations',
        upvotes: 45,
        status: 'Under Review',
        author: 'Alexis Rose'
    }
];
