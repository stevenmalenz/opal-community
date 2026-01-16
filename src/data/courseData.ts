
export interface CourseResource {
    type: 'Video' | 'Article' | 'Guide' | 'Tool' | 'Template' | 'Technical' | 'Case Study' | 'Platform' | 'Case Sudy';
    title: string;
    url: string;
    duration?: string;
}

export interface CourseExperiment {
    title: string;
    duration: string;
    description: string;
    steps: string[];
}

export interface CourseLevel {
    id: string;
    levelNumber: number;
    title: string;
    duration: string;
    goal: string;
    description?: string;
    experiments: CourseExperiment[];
    resources: CourseResource[];
    milestone: string;
    hook?: string;
    concept?: string;
    realWorldExample?: string;
}

export const aiFluencyCourse: CourseLevel[] = [
    {
        id: 'level-1',
        levelNumber: 1,
        title: 'Your First "Safe" Experiment',
        duration: '15 minutes',
        goal: 'Experience AI as a helper, not a replacement, by solving the "Blank Page Problem".',
        description: 'The hardest part of writing is starting. We\'ll use Opal to get you from "Stuck" to "Started" without replacing your creative voice.',
        hook: 'AI isn\'t here to do your job. It\'s here to handle the boring parts so you can do the brilliant parts.',
        concept: 'Most fear comes from thinking AI will take over. But the best way to use it is as a "Junior Assistant." You are the Director.\n\nWe\'ll start with the "Blank Page Problem." You know what you want to write (a project brief), but typing the structure is tedious. Opal\'s **Smart Brief** acts like a sketch artist—you give the concept, it draws the outlines. You fill in the color.',
        realWorldExample: 'Instead of staring at a blinking cursor, you type: "I need a project for a Q1 Customer Webinar about reliability."\n\nOpal drafts the skeleton: The Title, The Audience, The Goals. It\'s not perfect—it needs YOU to refine it. But the terrifying blank page is gone.',
        experiments: [
            {
                title: 'The "Getting Unstuck" Test',
                duration: '5 minutes',
                description: 'Drastically reduce the anxiety of starting a new project.',
                steps: [
                    'Open Opal -> Create New -> Task',
                    'Think of a project you\'ve been putting off.',
                    'Use the "Sparkle" icon and type one sentence about it.',
                    'Watch Opal build the structure. Then, *edit* one sentence to make it yours. Feel the control you still have.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Opal for Creatives', url: 'https://optimizely.com/opal', duration: '3 min' }
        ],
        milestone: 'Create a draft project using AI, then edit it to match your voice. Realize you are still the pilot.'
    },
    {
        id: 'level-2',
        levelNumber: 2,
        title: 'Teaching the AI Used to Be You',
        duration: '30 minutes',
        goal: 'Move from "Generic Robot" text to "Personal Executive Assistant" by teaching Opal your style.',
        description: 'If AI sounds like a robot, it\'s because it doesn\'t know you yet. Let\'s introduce it to your unique voice.',
        hook: 'You wouldn\'t hire an assistant and never speak to them. Don\'t do that to your AI.',
        concept: 'The fear is that AI dilutes your brand. The reality is that *untrained* AI dilutes your brand.\n\nOpal has **Brand Profiles**. Think of this as "Onboarding" your new digital teammate. You tell it: "We are funny, not silly. We are professional, not stiff." Once you teach it *who* you are, it stops guessing and starts supporting your actual identity.',
        realWorldExample: 'The "Manager Toggle."\n\nSometimes you need to be an "Encouraging Coach" (for team updates). Sometimes you need to be a "Data-Driven Strategist" (for board reports).\n\nYou can set up these profiles in Opal. Now, you can draft a rough thought, and ask Opal: "Polish this for the Board." It respects your intent but adjusts the suit it\'s wearing.',
        experiments: [
            {
                title: 'The Voice Mirror',
                duration: '10 minutes',
                description: 'Teach Opal to sound like YOU.',
                steps: [
                    'Go to Brand Profiles in Opal.',
                    'Create a profile called "My Professional Voice".',
                    'Feed it 3 examples of emails or posts you\'re proud of.',
                    'Ask it to write a short update. See how much closer it feels to "human".'
                ]
            }
        ],
        resources: [
            { type: 'Template', title: 'Defining Your Digital Voice', url: '#', duration: 'Download' }
        ],
        milestone: 'Create a Brand Profile that sounds 80% like you. The last 20% is where your magic lives.'
    },
    {
        id: 'level-3',
        levelNumber: 3,
        title: 'Automating the Drudgery',
        duration: '45 minutes',
        goal: 'Identify the "low-value" tasks that drain your energy and hand them off.',
        description: 'You were hired to think, not to format tickets or summarize meeting notes. Let\'s reclaim that time.',
        hook: 'Every minute you spend formatting a Jira ticket is a minute you aren\'t leading your team.',
        concept: 'We all have "High Value" work (strategy, creative, people) and "Low Value" work (formatting, tagging, summarizing).\n\nOpal\'s **Smart Actions** let you build push-button solutions for the Low Value stuff. By automating the drudgery, you buy back time for the work that actually gets you promoted.',
        realWorldExample: 'The "Meeting Rescue."\n\nYou have a messy transcript. You need a clean list of valid tasks. Instead of spending 20 minutes parsing it, you build a "Summarize & Extract" action. One click, and you have the Thinking Time back.',
        experiments: [
            {
                title: 'The Time-Back Button',
                duration: '15 minutes',
                description: 'Create a button that does your least favorite chore.',
                steps: [
                    'Identify a text task you hate doing (e.g., "Shortening headlines").',
                    'Go to AI Actions.',
                    'Create "The Shortener": "Rewrite this to be punchy and under 50 characters."',
                    'Use it on your next task. Feel the relief.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'The Art of Delegation', url: '#', duration: '5 min' },
            { type: 'Guide', title: 'Managing AI Actions', url: '#', duration: '15 min' }
        ],
        milestone: 'Automate one task you dislike. reclaim 15 minutes of your week.'
    },
    {
        id: 'level-4',
        levelNumber: 4,
        title: 'Expanding Your Capabilities',
        duration: '1 hour',
        goal: 'Do things you couldn\'t do before (like instant SEO research or visual design).',
        description: 'AI doesn\'t just do your work faster; it gives you skills you didn\'t have. Become a "Full-Stack" Creator.',
        hook: 'Suddenly, you are an SEO expert. Suddenly, you represent the Design team.',
        concept: 'Specialized Agents act like "Power-Ups" for your career. You might be a great writer but bad at SEO. Opal\'s **SEO Agent** bridges that gap.\n\nIt doesn\'t replace the SEO team; it lets you speak their language. You can draft content that is *already optimized*, making their review process faster and making you look like a pro.',
        realWorldExample: 'The "Design-Ready" Brief.\n\nUsually, you send a text brief to designers and they struggle to visualize it. Now, you use the **Image Agent** to generate a "Mood Board" or rough concept. You send that *with* the brief. The designers love you because they know exactly what you want.',
        experiments: [
            {
                title: 'The Super-Skill Test',
                duration: '20 minutes',
                description: 'Try a task outside your core job description.',
                steps: [
                    'If you are a writer, use the Image Agent to create a concept art.',
                    'If you are a distinct visual thinker, use the SEO Agent to find keywords.',
                    'See how it feels to have "backup" in areas where you aren\'t an expert.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Opal Agent Library', url: '#', duration: '10 min' }
        ],
        milestone: 'Complete a task using an Agent that covers a skill set you don\'t usually possess.'
    },
    {
        id: 'level-5',
        levelNumber: 5,
        title: 'The Invisible Organizer',
        duration: '2 hours',
        goal: 'Let AI handle the taxonomy and organization so you can focus on the content.',
        description: 'The most underrated superpower is being organized. Opal uses AI to keep your house clean automatically.',
        hook: 'Searching for files is the enemy of flow.',
        concept: 'Messy data creates stress. AI can be the "Librarian" that follows you around, putting books back on the shelf.\n\nOpal\'s **Auto-Tagging** analyzes your work and files it correctly. It adds the "Persona", the "Stage", the "Region". This means when your boss asks "What did we do for EMEA last quarter?", you can answer instantly. You look like the most organized person in the room, without doing the filing.',
        realWorldExample: 'You write a post about "Banking Trends." You hit save. Opal secretly tags it: Industry=Finance, Region=Global, Persona=CFO.\n\nSix months later, you search "Finance content" and it\'s right there. You just saved future-you an hour of digging.',
        experiments: [
            {
                title: 'The "No-Click" File',
                duration: '15 minutes',
                description: 'Experience the magic of auto-classification.',
                steps: [
                    'Draft a task description with specific industry keywords.',
                    'Click "Suggest Attributes".',
                    'Watch Opal categorize it correctly.',
                    'Realize you never have to manually select from 15 dropdowns again.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Smart Fields Configuration', url: '#', duration: '20 min' }
        ],
        milestone: 'Use auto-tagging to categorize a project. Feel the satisfaction of a clean database.'
    },
    {
        id: 'level-6',
        levelNumber: 6,
        title: 'Visual Storytelling',
        duration: '1.5 hours',
        goal: 'Enhance your written words with instant visual concepts.',
        description: 'We live in a visual world. Learn to pair your strategy with imagery that sells the idea.',
        hook: 'A text-only slide deck puts people to sleep. A visual concept wakes them up.',
        concept: 'You don\'t need to be an artist to have vision. Opal\'s **Image Engine** allows you to "Brainstorm Visually."\n\nThis isn\'t about replacing the final production art. It\'s about communicating your *intent*. "I want it to look like THIS." It bridges the gap between your brain and your team\'s understanding.',
        realWorldExample: 'You are pitching a "Cyber-Monday" campaign. Instead of saying "Make it look neon and futuristic," you generate 3 variations of neon/futuristic banners in Opal. You put them in the brief. The creative team says "Got it. We can do this better, but we see where you are going."',
        experiments: [
            {
                title: 'The Visual Pitch',
                duration: '15 minutes',
                description: 'Create a mood board for an idea.',
                steps: [
                    'Think of a campaign theme.',
                    'Generate 3 distinct visual interpretations of it in Opal.',
                    'Pick the best one and attach it to the project.',
                    'See how much clearer your idea becomes.'
                ]
            }
        ],
        resources: [
            { type: 'Tool', title: 'Opal Image Generator', url: '#', duration: 'Tool' }
        ],
        milestone: 'Add a visual concept to a written brief to clarify your vision.'
    },
    {
        id: 'level-7',
        levelNumber: 7,
        title: 'Scaling Your Impact',
        duration: '2 hours',
        goal: 'Take one great idea and make it visible everywhere.',
        description: 'Your best ideas deserve to be seen. Use "Remix" to amplify your voice across every channel.',
        hook: 'You put your heart into that strategy document. Don\'t let it die in a folder.',
        concept: 'Burnout happens when you try to manually rewrite the same message 10 times. Impact happens when you write it once and let AI help you distribute it.\n\nOpal\'s **Generative Remix** is your megaphone. It takes your core thought—your "Source of Truth"—and helps you translate it for LinkedIn, for the Newsletter, for the Sales Team. You ensure the message stays consistent, but you reach 10x the audience.',
        realWorldExample: 'You write a manifesto on "Empathy in Sales." It\'s brilliant.\n\nYou ask Opal: "Turn this into a 5-part LinkedIn series" and "Write an email to the Sales team explaining why this matters."\n\nSuddenly, your one idea is driving conversation in the market *and* inside the company.',
        experiments: [
            {
                title: 'The Amplification',
                duration: '30 minutes',
                description: 'Turn one asset into a campaign.',
                steps: [
                    'Take a document you are proud of.',
                    'Use "Repurpose" to generate 3 social posts and 1 internal update.',
                    'Review them. Notice how the core message remains YOURS, but the format changes.',
                    'Schedule them.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Campaign Remixing', url: '#', duration: '15 min' }
        ],
        milestone: 'Take one "Hero Asset" and plan a multi-channel distribution for it in under 30 minutes.'
    },
    {
        id: 'level-8',
        levelNumber: 8,
        title: 'The Safety Net',
        duration: '1 hour',
        goal: 'Innovate with confidence, knowing the system has your back.',
        description: 'Fear of mistakes slows us down. Opal\'s Guardrails let you move fast without breaking things.',
        hook: 'Creativity needs a playground, but enterprise work needs a fence. Opal provides both.',
        concept: 'The fear: "What if the AI hallucinates? What if I say the wrong thing?"\n\nThe solution: **Brand Guardrails**. You (or your admin) set the "Never-Do" rules. "Don\'t promise timelines we can\'t keep." "Don\'t use casual slang."\n\nNow you can experiment freely. If you drift off course, Opal gently nudges you back. It\'s like bowling with the bumpers up. You can aim for the strike without worrying about the gutter.',
        realWorldExample: 'You are rushing to get a post out. You accidentally include a competitor\'s trademarked term. Opal\'s Compliance Scan flags it: "Potential Trademark Risk." You fix it before it goes live. Crisis averted. Career safe.',
        experiments: [
            {
                title: 'The Safety Drill',
                duration: '10 minutes',
                description: 'See the guardrails in action.',
                steps: [
                    'Draft a text that intentionally breaks a brand rule (e.g. "We are the cheapest").',
                    'Run the "Brand Check".',
                    'See the system catch it.',
                    'Feel the peace of mind that comes with having a backup.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Enterprise AI Governance', url: '#', duration: 'Whitepaper' }
        ],
        milestone: 'Run a compliance check and realize the system is protecting you.'
    },
    {
        id: 'level-9',
        levelNumber: 9,
        title: 'Listening to the Audience',
        duration: '2 hours',
        goal: 'Use data to start conversations that people actually want to have.',
        description: 'The best leaders listen first. Opal uses data to tell you what your audience is craving.',
        hook: 'Don\'t shout into the void. Whisper into the ear of someone listening.',
        concept: 'AI isn\'t just for output; it\'s for input. Opal connects to your **Performance Data**.\n\nIt can look at your past work and say: "Hey, your audience really loved when you wrote about \'Team Culture\'. Maybe we should do more of that?"\n\nThis turns you into a data-driven leader. You aren\'t guessing; you are serving your audience based on what they told you they need.',
        realWorldExample: 'Opal highlights an old post about "Remote Work" that is getting renewed traffic. It suggests: "This topic is trending again. Should we refresh it with 2026 data?" You say yes. You just capitalized on a trend instantly.',
        experiments: [
            {
                title: 'The Insight Loop',
                duration: '20 minutes',
                description: 'Refresh content based on data.',
                steps: [
                    'Find a piece of "Decaying Content" in the Opal Dashboard.',
                    'Use "Content Intelligence" to see why it dropped.',
                    'Ask Opal to "Refresh this for relevance.".',
                    'You just revived an asset instead of making a new one.'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Content Intelligence + AI', url: '#', duration: '10 min' }
        ],
        milestone: 'Refresh a piece of content based on audience data.'
    },
    {
        id: 'level-10',
        levelNumber: 10,
        title: 'Leading the Future',
        duration: '4 hours',
        goal: 'Transition from "AI User" to "AI Leader" within your organization.',
        description: 'You now know how to use the tools safely and effectively. It\'s time to show the way.',
        hook: 'The future belongs to those who allow themselves to be helped.',
        concept: 'You started this course afraid of being replaced. You are finishing it as the person who knows how to scale.\n\nYou know how to automate the boring stuff. You know how to amplify your voice. You know how to stay safe. \n\n**You are now the pilot.** The Opal engine is powerful, but it sits still until you touch the controls. Go lead your team.',
        realWorldExample: 'You walk into your next planning meeting. Instead of being overwhelmed by the volume of work, you say: "I built a workflow that can handle the drafting. Let\'s focus our energy on the creative strategy." That is leadership.',
        experiments: [
            {
                title: 'The AI Leader Manifesto',
                duration: '60 minutes',
                description: 'Plan your new way of working.',
                steps: [
                    'Create a "Way of Working" doc in Opal.',
                    'List the 3 tasks you will automate forever.',
                    'List the 1 big strategic goal you now have time for.',
                    'Share it with your manager.'
                ]
            }
        ],
        resources: [
            { type: 'Case Study', title: 'The AI-Augmented Team', url: '#', duration: 'Read' }
        ],
        milestone: 'Present your "New Way of Working" to a colleague or manager to show how you are scaling your impact.'
    }
];
