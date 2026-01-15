
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
        title: 'Your first "aha moment"',
        duration: '30 minutes',
        goal: 'Experience the moment where AI shifts from "interesting" to "I need this"',
        description: 'Before diving into courses or documentation, you need to feel AI\'s value viscerally. These three quick wins consistently convert skeptics.',
        hook: 'You don\'t learn to ride a bike by reading a manual. You learn by wobbling, pedaling, and suddenly feeling the wind on your face.',
        concept: 'Most marketers get stuck in "tutorial hell"—watching videos but never doing. This level is about purely visceral experience. We aren\'t trying to build a system yet; we are trying to break your skepticism.\n\nThe goal is to find one tiny task where AI does established work faster than you thought possible. Once you care about the result, the learning happens automatically.',
        realWorldExample: 'Imagine you have a messy 30-minute transcript from a stakeholder interview. Instead of re-listening to the whole thing, you paste it into an AI tool and simple say "Give me the top 3 paint points and 3 desired features." It happens in 10 seconds. That feeling of relief? That\'s the aha moment.',
        experiments: [
            {
                title: 'The email polish test',
                duration: '5 minutes',
                description: 'Take a rough draft and make it professional instantly.',
                steps: [
                    'Open ChatGPT or Claude',
                    'Paste any draft email you\'ve written recently',
                    'Prompt: "Polish this email. Keep my voice—just make it clearer and more professional. Don\'t make it sound robotic."',
                    'Compare the output to your original.'
                ]
            },
            {
                title: 'The chaos-to-structure test',
                duration: '5 minutes',
                description: 'Turn messy notes into clear action items.',
                steps: [
                    'Paste messy meeting notes or a long email thread',
                    'Prompt: "List every action item from this, who owns each one, and any deadlines mentioned."',
                    'See AI extract structure from chaos.'
                ]
            },
            {
                title: 'The first-draft-from-bullets test',
                duration: '5 minutes',
                description: 'Experience the 80/20 rule: AI handles the grunt work, you refine.',
                steps: [
                    'Give 4-5 bullet points about any topic you know',
                    'Prompt: "Turn these bullets into a professional LinkedIn post for B2B marketers."'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'OpenAI Academy - Marketing Use Cases', url: 'https://academy.openai.com', duration: '20 min' },
            { type: 'Video', title: 'Google AI Essentials intro video', url: 'https://grow.google/ai', duration: '5 min' }
        ],
        milestone: 'Complete all 3 experiments. You should feel a tangible "this could save me time" sensation.'
    },
    {
        id: 'level-2',
        levelNumber: 2,
        title: 'Understanding the conversation',
        duration: '1-2 hours',
        goal: 'Stop getting generic outputs by learning what AI actually needs from you',
        description: 'The #1 reason people abandon AI: they get bland, unusable responses. The fix isn\'t better tools—it\'s better communication. Vague input = generic output.',
        hook: 'Treating AI like a search engine ("Marketing ideas 2024") gets you Wikipedia-level junk. Treating it like a brilliant intern gets you gold.',
        concept: 'Large Language Models (LLMs) are prediction engines. If you give them a generic beginning, they predict a generic middle and end. To get specific, high-quality output, you must constrain the probability space.\n\nWe do this with context. Just as you wouldn\'t tell an intern "write a post," you shouldn\'t tell AI that. You\'d say "Write a LinkedIn post for generic CFOs (Audience) about cash flow (Topic) that sounds urgent (Tone)."',
        realWorldExample: 'A "Write a blog about shoes" prompt gives you "Shoes are important for walking."\n\nA "You are a marathon runner. Write a review of the Nike Vaporfly for beginners focusing on durability" prompt gives you a usable, nuanced draft.',
        experiments: [
            {
                title: 'The Reconstruction',
                duration: '15 minutes',
                description: 'Take a bad prompt and fix it using the 4 ingredients.',
                steps: [
                    'Take a generic prompt like "Write a blog post about marketing"',
                    'Rewrite it using Role, Context, Task, and Format',
                    'Example: "You are a B2B content strategist (Role). Audience is startup founders (Context). Write a 200-word intro on LinkedIn lead gen (Task). Use bullet points and direct tone (Format)."'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Anthropic Interactive Prompt Tutorial', url: 'https://github.com/anthropics/prompt-eng-interactive-tutorial', duration: '4-6 hrs' },
            { type: 'Guide', title: 'Anthropic Prompt Engineering Overview', url: 'https://docs.anthropic.com/claude/docs/intro-to-prompting', duration: '2 hrs' },
            { type: 'Guide', title: 'DAIR.AI Prompting', url: 'https://www.promptingguide.ai/', duration: 'Ongoing' }
        ],
        milestone: 'Successfully get useful, on-brand output on your first try for 3 different task types.'
    },
    {
        id: 'level-3',
        levelNumber: 3,
        title: 'Building your prompt library',
        duration: '2-3 hours',
        goal: 'Stop starting from scratch—create reusable templates that save time weekly',
        description: 'If you do something more than twice with AI, templatize it. This is where casual users plateau and power users accelerate.',
        hook: 'Every time you type a prompt from scratch, you are wasting the mental energy you just saved.',
        concept: 'Systemization is the difference between a toy and a tool. Once you nail a prompt (like rewriting bio for different social channels), save it.\n\nA "Prompt Library" is just a simple document of your greatest hits. It turns a 10-minute prompting session into a 10-second copy-paste job. This builds consistency across your team.',
        realWorldExample: 'Instead of typing "Summarize this meeting" every day, you have a saved snippet: "Act as a Project Manager. Summarize this transcript into: 1. Decisions Made, 2. Action Items (w/ Owners), 3. Open Questions. Format as a markdown table."',
        experiments: [
            {
                title: 'Build the RISEN Template',
                duration: '20 minutes',
                description: 'Create a master template for a recurring task.',
                steps: [
                    'Choose a recurring task (e.g., meeting summaries, competitor analysis)',
                    'Define Role, Instructions, Steps, End Goal, Narrowing (RISEN)',
                    'Save this prompt in your notes app or text expander',
                    'Test it on yesterday\'s work'
                ]
            }
        ],
        resources: [
            { type: 'Template', title: 'Cognism Custom GPT Examples', url: '#', duration: '30 min' },
            { type: 'Guide', title: 'Anthropic Business Performance Guide', url: '#', duration: '20 min' },
            { type: 'Video', title: 'ChatGPT for Marketing (Great Learning)', url: '#', duration: '2-3 hrs' }
        ],
        milestone: 'Have 5+ reusable templates saved and organized. Use at least 2 of them this week on real work.'
    },
    {
        id: 'level-4',
        levelNumber: 4,
        title: 'Choosing the right tool for the job',
        duration: '2 hours',
        goal: 'Understand when to use which AI tool instead of defaulting to one for everything',
        description: 'Different tools excel at different tasks. Using the right one can double your output quality. ChatGPT for versatility, Claude for writing, Perplexity for research.',
        hook: 'You wouldn\'t use a hammer to cut a steak. Stop using ChatGPT for everything.',
        concept: 'Not all LLMs are created equal. They have different "personalities" based on their training data.\n\nGPT-4 is the reasoning engine—great for logic, code, and structure. Claude 3 is the writer—better at nuance, tone, and long context. Perplexity is the librarian—it cites sources and browses the web instantly. Knowing which "employee" to call for which task is a key management skill.',
        realWorldExample: 'Need to write a empathetic customer service email? Use Claude. Need to analyze a spreadsheet and find trends? Use ChatGPT (Data Analyst). Need to find recent news about a competitor? Use Perplexity.',
        experiments: [
            {
                title: 'The Head-to-Head',
                duration: '30 minutes',
                description: 'Compare models on the same task to feel the difference.',
                steps: [
                    'Take one task you did this week in ChatGPT',
                    'Redo it in Claude (or Gemini)',
                    'Compare the outputs side-by-side',
                    'Notice the differences in tone, structure, and accuracy'
                ]
            }
        ],
        resources: [
            { type: 'Tool', title: 'ChatGPT Plus', url: 'https://chat.openai.com', duration: 'All-purpose' },
            { type: 'Tool', title: 'Claude Pro', url: 'https://claude.ai', duration: 'Writing' },
            { type: 'Tool', title: 'Perplexity', url: 'https://perplexity.ai', duration: 'Research' }
        ],
        milestone: 'Have accounts on 2-3 AI tools. Know which you\'ll use for which type of task.'
    },
    {
        id: 'level-5',
        levelNumber: 5,
        title: 'Your first automation',
        duration: '3-4 hours',
        goal: 'Build one workflow that runs without you clicking buttons',
        description: 'This is the inflection point. Manual AI use saves minutes. Automated AI saves hours. We\'ll start with a simple Email → AI → Slack workflow.',
        hook: 'The only thing better than doing work fast is not doing it at all.',
        concept: 'Automation connects the "brain" (AI) to the "hands" (Apps). Tools like Zapier or Make let you create chains of logic.\n\nInstead of you copying an email, pasting it into ChatGPT, and pasting the result into Slack, the automation watches your inbox 24/7. When an email arrives, it does the rest. You become the architect of the workflow, not the operator.',
        realWorldExample: 'A "Lead Qualifier" bot: A Typeform submission comes in. Zapier sends it to OpenAI to score the lead 1-5 based on criteria. If it\'s a 5, it automatically pings the Sales Slack channel with a summary.',
        experiments: [
            {
                title: 'The Urgent Email Summary',
                duration: '45 minutes',
                description: 'Build your first Zapier workflow.',
                steps: [
                    'Create a Zapier account',
                    'Trigger: New email arrives with "urgent" in subject',
                    'Action 1: Send to ChatGPT with prompt "Summarize in 2 sentences. Identify owner."',
                    'Action 2: Post summary to Slack channel',
                    'Test with a real email'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'Zapier AI Documentation', url: 'https://zapier.com/ai', duration: '1 hr' },
            { type: 'Template', title: 'Make.com AI Templates', url: 'https://www.make.com/en/templates', duration: '30 min' },
            { type: 'Video', title: 'n8n AI Agent Tutorials', url: 'https://n8n.io', duration: '1-2 hrs' }
        ],
        milestone: 'Have one automation running that saves you at least 30 minutes/week.'
    },
    {
        id: 'level-6',
        levelNumber: 6,
        title: 'Custom GPTs and Claude Projects',
        duration: '3-4 hours',
        goal: 'Create AI assistants trained on your specific brand, voice, and knowledge',
        description: 'Generic AI gives generic outputs. Custom AI trained on your data gives outputs you can actually use. Upload your brand guides and best examples.',
        hook: 'Stop pasting your brand guidelines into every chat. Give the AI a permanent memory.',
        concept: 'Standard models know the world, but they don\'t know *you*. Context windows allow us to upload documents—PDFs, tone guides, past reports—that the AI references before answering.\n\nA "Custom GPT" or "Project" creates a walled garden. It essentially says: "For every question I ask inside this chat, first read these 5 documents, then answer." This creates specialized experts instantly.',
        realWorldExample: 'A "Brand Editor" GPT. You upload your 50-page Brand Style Guide and your top 10 best-performing blogs. When you paste a new draft, it doesn\'t just fix grammar; it says "You used passive voice here, which violates our rule on page 12 of the Style Guide."',
        experiments: [
            {
                title: 'Build a Brand Voice Bot',
                duration: '45 minutes',
                description: 'Create a custom assistant that writes like you.',
                steps: [
                    'Go to ChatGPT -> Create GPT (or Claude Projects)',
                    'Upload your brand guidelines and 5 best blog posts',
                    'Instruction: "You are a content writer for [Company]. Use a witty, direct tone."',
                    'Test: Ask it to rewrite a generic paragraph'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'OpenAI Custom GPTs Guide', url: '#', duration: '30 min' },
            { type: 'Guide', title: 'Claude Projects Documentation', url: '#', duration: '20 min' }
        ],
        milestone: 'Build one Custom GPT or Claude Project that your team actually uses weekly.'
    },
    {
        id: 'level-7',
        levelNumber: 7,
        title: 'Multi-step workflows',
        duration: '4-6 hours',
        goal: 'Chain multiple AI steps together for complex, high-value automation',
        description: 'This is where ROI compounds. One trigger sets off a chain reaction. Example: Newsletter → LinkedIn Posts → Tweets → Slack Update.',
        hook: 'Single-step automation adds speed. Multi-step automation adds scale.',
        concept: 'Most valuable work happens in stages. You don\'t just "write a blog." You research SEO keywords, outline, draft, edit, and create social snippets.\n\nMulti-step AI workflows mirror this. Step 1 (Research) passes its output to Step 2 (Outline), which passes to Step 3 (Drafting). We use AI as formatting glue between these stages, allowing one input to turn into ten tailored outputs.',
        realWorldExample: 'The "Content Repurposing" Engine. You drop a YouTube video link into a spreadsheet. The workflow transcripts it, summarizes it into a blog post, extracts 3 tweet threads, and creates a LinkedIn carousel script—all in one run.',
        experiments: [
            {
                title: 'The Content Repurposer',
                duration: '1.5 hours',
                description: 'Automate content distribution.',
                steps: [
                    'Trigger: New row in Google Sheets (Newsletter URL)',
                    'Action 1: Scrape content',
                    'Action 2: Parallel prompts for LinkedIn, Twitter, and Internal Summary',
                    'Action 3: Save outputs to Google Docs folder',
                    'Review and publish'
                ]
            }
        ],
        resources: [
            { type: 'Guide', title: 'AI Maker\'s Repurposing Guide', url: '#', duration: '1 hr' },
            { type: 'Technical', title: 'n8n LangChain Integration', url: '#', duration: '2 hrs' }
        ],
        milestone: 'Build a multi-step workflow that handles an end-to-end process you currently do manually.'
    },
    {
        id: 'level-8',
        levelNumber: 8,
        title: 'AI agents that work autonomously',
        duration: '6-8 hours',
        goal: 'Deploy AI agents that can set objectives, plan steps, and execute without constant supervision',
        description: 'Agents differ from workflows: workflows follow pre-set paths, agents can adapt. Example: A "Competitor Tracker" that browses the web daily and alerts you only on major changes.',
        hook: 'Workflows follow a recipe. Agents function like a chef—they can taste and adjust as they cook.',
        concept: 'A workflow breaks if X doesn\'t lead to Y. An Agent has "reasoning" loops. You give it a goal ("Find me 3 leads"), and it figures out the "how."\n\nIt might search Google, hit a dead end, realize it needs to search LinkedIn instead, and then report back. This adaptability makes them powerful for research and monitoring tasks where the path isn\'t always straight.',
        realWorldExample: 'A "Pricing Scout" Agent. You tell it: "Check our top 3 competitors. If anyone changes pricing, screenshot it and email me." It visits the sites daily, navigates any popups, finds the pricing page (even if the URL changed), and makes a decision to alert you or not.',
        experiments: [
            {
                title: 'Deploy a News Scout',
                duration: '1 hour',
                description: 'Set up a simple research agent.',
                steps: [
                    'Use a tool like Lindy, Relevance AI, or custom code',
                    'Objective: "Monitor these 5 URLs daily for pricing changes"',
                    'Condition: "If price changes > 10%, alert me on Slack"',
                    'Let it run for a week'
                ]
            }
        ],
        resources: [
            { type: 'Tool', title: 'Lindy.ai', url: 'https://lindy.ai', duration: 'Platform' },
            { type: 'Tool', title: 'Relevance AI', url: 'https://relevanceai.com', duration: 'Platform' }
        ],
        milestone: 'Deploy one agent that runs on a schedule and produces useful output with minimal intervention.'
    },
    {
        id: 'level-9',
        levelNumber: 9,
        title: 'The marketing AI stack in action',
        duration: '4-6 hours',
        goal: 'See how advanced teams combine tools into comprehensive AI-powered marketing operations',
        description: 'Learn from the best. How Clay used AI to grow 10x. How Apollo automates 5M messages. The pattern is RESEARCH → CREATION → DISTRIBUTION → ANALYSIS.',
        hook: 'Tools are just ingredients. The "Stack" is the full menu.',
        concept: 'Mature AI organizations don\'t just have random users. They have an architecture. Data flows from a source (CRM) -> Enrichment (Clay/Clearbit) -> Creation (Claude/Opal) -> Distribution (HubSpot).\n\nMapping your stack visualizes where AI fits. You stop thinking about "using ChatGPT" and start thinking about "injecting intelligence into the data pipeline."',
        realWorldExample: 'Clay.com\'s growth stack: They pull 1,000 domains (Data). They use AI to visit each site and find the "Pricing" page (Enrichment). They use GPT-4 to guess the company\'s budget (Intelligence). They generate a hyper-personalized email based on that budget (Creation). One cohesive machine.',
        experiments: [
            {
                title: 'Map Your Stack',
                duration: '45 minutes',
                description: 'Visualize your AI integration.',
                steps: [
                    'Draw your current marketing workflow',
                    'Identify manual bottlenecks',
                    'Map where Perplexity, Claude, Zapier, and Otter fit in',
                    'Identify 3 opportunities for deeper integration'
                ]
            }
        ],
        resources: [
            { type: 'Case Sudy', title: 'Clay\'s 10x Growth Story', url: '#', duration: '15 min' },
            { type: 'Case Study', title: 'Apollo\'s Personalization Engine', url: '#', duration: '15 min' }
        ],
        milestone: 'Map your current marketing workflow. Identify 3 places where AI could be integrated for maximum impact.'
    },
    {
        id: 'level-10',
        levelNumber: 10,
        title: 'Platform-native AI (Optimizely Opal)',
        duration: '4-6 hours',
        goal: 'Understand the difference between bolting AI onto your workflow vs. AI built into your platform',
        description: 'The ceiling of generic tools: copy-pasting. Opal is embedded. It knows your brand, it can execute campaigns, and it governs compliance. This is graduation day.',
        hook: 'Copy-pasting between ChatGPT and your CMS is a bridge to nowhere. True acceleration happens when the AI lives *inside* the work.',
        concept: 'Generic tools (ChatGPT) are "sidecars"—you go there, do work, and bring it back. Platform-native AI (Opal) is the engine.\n\nBecause Opal holds your calendar, your past assets, and your workflows, its AI has "Ground Truth." It doesn\'t just write a blog; it writes a blog *that fits into the gap in your November calendar*, using the tone from your *October campaign*, and assigns it to the *correct editor*. That is the difference between a chatbot and a teammate.',
        realWorldExample: 'In Opal: You drag a brief onto the calendar. You click "Generate Campaign." Opal reads the brief, looks at your past successful content, and generates the blog, 3 social posts, and a newsletter blurb—all properly formatted, tagged, and assigned. No copy-pasting required.',
        experiments: [
            {
                title: 'The Opal Campaign Kit',
                duration: '30 minutes',
                description: 'Experience platform-native power.',
                steps: [
                    'Open Opal',
                    'Use "Generate Campaign" from a single brief',
                    'Watch it create the brief, tasks, content, and promotion plan instantly',
                    'See how it applies your brand rules automatically'
                ]
            }
        ],
        resources: [
            { type: 'Platform', title: 'Optimizely Opal Demo', url: 'https://optimizely.com/opal', duration: 'Demo' },
            { type: 'Guide', title: 'Enterprise AI Governance', url: '#', duration: 'Whitepaper' }
        ],
        milestone: 'Understand the platform advantage. Ready to lead your team into the AI era.'
    }
];
