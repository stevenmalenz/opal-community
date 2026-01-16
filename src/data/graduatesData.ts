
export interface Graduate {
    id: string;
    name: string;
    role: string;
    company: string;
    companyLogo?: string;
    description: string;
    cohort: string;
    imageUrl: string;
    workflowVideo?: boolean;
}

export const graduates: Graduate[] = [
    {
        id: '1',
        name: 'Sarah Chen',
        role: 'Director of Content',
        company: 'FinTech Co',
        description: 'Built a regulatory compliance workflow that scans all marketing assets against new SEC guidelines automatically, saving the legal team 15+ hours per week.',
        cohort: 'Cohort 1',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        workflowVideo: true
    },
    {
        id: '2',
        name: 'Marcus Johnson',
        role: 'SEO Manager',
        company: 'Retail Giants',
        description: 'Created an "Inventory-to-Article" pipeline that detects low-stock items and pauses their programmatic SEO pages to prevent bounce rates.',
        cohort: 'Cohort 1',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    },
    {
        id: '3',
        name: 'Elena Rodriguez',
        role: 'Growth Lead',
        company: 'SaaS Flow',
        description: 'Automated the entire "Churn Recovery" email sequence. The AI reads the exit survey and drafts a personalized win-back offer based on the specific complaint.',
        cohort: 'Cohort 2',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    },
    {
        id: '4',
        name: 'David Kim',
        role: 'Marketing Ops',
        company: 'CloudSystems',
        description: 'Built a "Sales Battlecard" generator. It monitors competitor pricing pages and automatically updates the sales team\'s Notion docs when prices change.',
        cohort: 'Cohort 1',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        workflowVideo: true
    },
    {
        id: '5',
        name: 'Priya Patel',
        role: 'Social Media Manager',
        company: 'EcoBrand',
        description: 'Developed a "Trend Jacker" workflow. It monitors sustainability news and instantly drafts on-brand LinkedIn comments for the CEO to review.',
        cohort: 'Cohort 3',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    },
    {
        id: '6',
        name: 'Tom Baker',
        role: 'Head of SEO',
        company: 'TravelWise',
        description: 'Created a localized content engine. It takes one English article and generates 5 culturally-nuanced variations for EU markets, not just translations.',
        cohort: 'Cohort 2',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
    },
    {
        id: '7',
        name: 'Jessica Wu',
        role: 'Email Marketer',
        company: 'Newsletter Pro',
        description: 'Built a "Newsletter Remix" agent. It takes the weekly newsletter and automatically generates 7 tweets, 2 LinkedIn posts, and an Instagram story script.',
        cohort: 'Cohort 4',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    },
    {
        id: '8',
        name: 'Omar Farooq',
        role: 'Content Strategist',
        company: 'TechStart',
        description: 'Designed a "Content Gap" analyzer. It reads the company help docs and support tickets to find questions that haven\'t been answered in the blog yet.',
        cohort: 'Cohort 3',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
    },
    {
        id: '9',
        name: 'Anna Kowalski',
        role: 'Brand Manager',
        company: 'LuxuryGoods',
        description: 'Built a "Brand Police" bot. It scans every draft in Opal and flags any words that sound "cheap" or "discount," ensuring premium positioning.',
        cohort: 'Cohort 1',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
        workflowVideo: true
    },
    {
        id: '10',
        name: 'Ryan O\'Connor',
        role: 'Demand Gen',
        company: 'B2B Solutions',
        description: 'Created a lead scoring agent that reads the "Job Title" and "Company" from form fills and enriches the CRM with estimated budget before Sales calls.',
        cohort: 'Cohort 2',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan',
    },
    {
        id: '11',
        name: 'Lisa Chang',
        role: 'Product Marketer',
        company: 'SoftWarez',
        description: 'Automated release notes. The worklfow polls Jira for "Done" tickets and writes customer-facing summaries for the monthly changelog.',
        cohort: 'Cohort 4',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    },
    {
        id: '12',
        name: 'Michael Ross',
        role: 'VP of Marketing',
        company: 'AgencyX',
        description: 'Built a "Client Onboarding" agent. It takes the kickoff call transcript and auto-generates the Strategy Doc, Brief, and Asana tasks.',
        cohort: 'Cohort 3',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    },
    {
        id: '13',
        name: 'Sophie Dubois',
        role: 'Public Relations',
        company: 'Global Corp',
        description: 'Created a "Crisis Monitor." It watches for negative sentiment spikes on Twitter and drafts potential responses for the PR team to have ready.',
        cohort: 'Cohort 5',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    },
    {
        id: '14',
        name: 'James Wilson',
        role: 'Copywriter',
        company: 'Creative Studio',
        description: 'Built a "Headline optimizer." It takes one draft headline and generates 50 variations using different psychological hooks (Fear, greed, curiosity).',
        cohort: 'Cohort 1',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesW',
        workflowVideo: true
    },
    {
        id: '15',
        name: 'Emma Thompson',
        role: 'Community Mgr',
        company: 'DevTools',
        description: 'Automated the "Community Highlight." It scans the Discord server for the most helpful user answers and compiles them into a weekly "Star Users" post.',
        cohort: 'Cohort 3',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        workflowVideo: true
    },
    {
        id: '16',
        name: 'Carlos Mendez',
        role: 'SEO Specialist',
        company: 'Search Pros',
        description: 'Built an "Internal Linker." It scans new posts and suggests 5 older, relevant posts to link to, optimizing site structure automatically.',
        cohort: 'Cohort 2',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    },
    {
        id: '17',
        name: 'Nina Singh',
        role: 'Event Marketer',
        company: 'Conference Co',
        description: 'Created a "Speaker Bio" agent. It takes a speaker\'s LinkedIn URL and writes a short, medium, and long bio for the conference website.',
        cohort: 'Cohort 4',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina',
    },
    {
        id: '18',
        name: 'Alex Foster',
        role: 'Ecommerce Mgr',
        company: 'ShopNow',
        description: 'Automated product descriptions. It takes the manufacturer stats (size, weight) and writes 3 emotional, benefit-driven descriptions for A/B testing.',
        cohort: 'Cohort 5',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    },
    {
        id: '19',
        name: 'Rachel Green',
        role: 'Content Ops',
        company: 'MediaHouse',
        description: 'Built a "Voice Consistency" checker. It scans guest posts to ensure they match the publication\'s style guide before an editor ever looks at them.',
        cohort: 'Cohort 1',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RachelG',
    },
    {
        id: '20',
        name: 'Sam Lee',
        role: 'Performance Marketer',
        company: 'AdScale',
        description: 'Created an "Ad Variant" generator. It takes one winning Facebook ad and generates 20 iteratons with slightly different hooks and CTAs.',
        cohort: 'Cohort 2',
        imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    }
];
