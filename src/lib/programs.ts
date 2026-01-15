import type { ProgramConfig } from '../types/program';


export const SALES_PROGRAM: ProgramConfig = {
    id: 'sales-negotiation',
    title: 'Sales Negotiation Mastery',
    role: 'Account Executive',
    themeColor: 'indigo',
    skills: [
        { id: 's1', name: 'Discovery', score: 85, fullMark: 100 },
        { id: 's2', name: 'Negotiation', score: 65, fullMark: 100 },
        { id: 's3', name: 'Product Knowledge', score: 90, fullMark: 100 },
        { id: 's4', name: 'Closing', score: 70, fullMark: 100 },
        { id: 's5', name: 'Objection Handling', score: 60, fullMark: 100 },
    ],
    learningPath: [
        {
            id: 'm1',
            title: 'Foundation: The Value Framework',
            status: 'completed',
            lessons: [
                {
                    id: 'l1',
                    title: 'Understanding Value Drivers',
                    duration: '5 min',
                    type: 'Video',
                    completed: true,
                    content: "Value drivers are the specific business outcomes that your solution enables for the customer. Common value drivers include: Increasing Revenue, Reducing Costs, and Mitigating Risk. When speaking to executives, always map your features back to one of these three drivers."
                },
                {
                    id: 'l2',
                    title: 'Mapping Stakeholders',
                    duration: '8 min',
                    type: 'Article',
                    completed: true,
                    content: "Stakeholder mapping is critical. You need to identify the Champion (who sells for you), the Economic Buyer (who signs the check), and the Blocker (who tries to stop you). Use LinkedIn to map the org chart before your first call."
                },
                { id: 'l3', title: 'Value Pitch Practice', duration: '10 min', type: 'Drill', completed: true },
            ],
        },
        {
            id: 'm2',
            title: 'Advanced Discovery',
            status: 'in-progress',
            lessons: [
                { id: 'l4', title: 'The "Why Now" Question', duration: '4 min', type: 'Video', completed: true },
                { id: 'l5', title: 'Uncovering Hidden Pain', duration: '6 min', type: 'Article', completed: true },
                { id: 'l6', title: 'Discovery Roleplay Sim', duration: '15 min', type: 'Sim', completed: false },
            ],
        },
        {
            id: 'm3',
            title: 'Negotiation Mastery',
            status: 'locked',
            lessons: [
                { id: 'l7', title: 'Price vs. Value', duration: '7 min', type: 'Video' },
                { id: 'l8', title: 'Trading Concessions', duration: '10 min', type: 'Article' },
                { id: 'l9', title: 'Contract Negotiation Sim', duration: '20 min', type: 'Sim' },
            ],
        },
    ],
    dailyDrill: {
        id: 'drill-101',
        title: 'Objection Handling: "Too Expensive"',
        duration: '10 min',
        type: 'Scenario Sim',
        description: 'Practice handling price objections for the Enterprise plan using the value-based framework.',
    },
    diagnosticQuestions: [
        {
            id: 1,
            question: "How confident are you in handling price objections?",
            type: "rating",
            options: ["Not confident", "Somewhat confident", "Very confident"],
        },
        {
            id: 2,
            question: "Which scenario do you find most challenging?",
            type: "choice",
            options: [
                "Discovery with a silent prospect",
                "Negotiating contract terms",
                "Explaining technical differentiators",
                "Closing the deal",
            ],
        },
    ],
    scenarios: [
        {
            id: 'sc1',
            title: 'Objection Handling: "Too Expensive"',
            role: 'VP of Sales',
            context: 'They love the demo but just said, "We can\'t justify this price point right now."',
            goal: 'Pivot to value without discounting.',
            prospectImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
        }
    ]
};

export const CS_PROGRAM: ProgramConfig = {
    id: 'cs-retention',
    title: 'Customer Retention & Expansion',
    role: 'CSM',
    themeColor: 'emerald',
    skills: [
        { id: 'cs1', name: 'Relationship Building', score: 88, fullMark: 100 },
        { id: 'cs2', name: 'Product Adoption', score: 72, fullMark: 100 },
        { id: 'cs3', name: 'Renewal Negotiation', score: 60, fullMark: 100 },
        { id: 'cs4', name: 'Crisis Management', score: 75, fullMark: 100 },
    ],
    learningPath: [
        {
            id: 'm1-cs',
            title: 'Onboarding Excellence',
            status: 'completed',
            lessons: [
                { id: 'l1-cs', title: 'The First 30 Days', duration: '6 min', type: 'Video', completed: true },
                { id: 'l2-cs', title: 'Setting Success Metrics', duration: '10 min', type: 'Article', completed: true },
            ],
        },
        {
            id: 'm2-cs',
            title: 'Driving Adoption',
            status: 'in-progress',
            lessons: [
                { id: 'l3-cs', title: 'Identifying Usage Gaps', duration: '5 min', type: 'Video', completed: true },
                { id: 'l4-cs', title: 'QBR Presentation Sim', duration: '20 min', type: 'Sim', completed: false },
            ],
        },
    ],
    dailyDrill: {
        id: 'drill-cs-1',
        title: 'The "At-Risk" Account Call',
        duration: '12 min',
        type: 'Scenario Sim',
        description: 'A key champion just left the client company. Secure the renewal with the new stakeholder.',
    },
    diagnosticQuestions: [
        {
            id: 1,
            question: "How comfortable are you leading QBRs with executives?",
            type: "rating",
            options: ["Uncomfortable", "Okay", "Very Comfortable"],
        },
        {
            id: 2,
            question: "What is your biggest challenge in renewals?",
            type: "choice",
            options: [
                "Budget cuts",
                "Lack of adoption",
                "Competitor pressure",
                "Ghosting",
            ],
        },
    ],
    scenarios: [
        {
            id: 'sc-cs-1',
            title: 'The "At-Risk" Account Call',
            role: 'New CTO',
            context: 'The previous champion left. The new CTO wants to review all vendor contracts and cut costs.',
            goal: 'Demonstrate ROI and secure a follow-up meeting.',
            prospectImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
        }
    ]
};
