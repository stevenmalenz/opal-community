export const MOCK_USER = {
    name: 'Steven Male',
    role: 'Sales Representative',
    streak: 12,
    skillScore: 78,
    nextMilestone: 80,
    completedDrills: 45,
};

export const DAILY_DRILL = {
    id: 'drill-101',
    title: 'Objection Handling: "Too Expensive"',
    duration: '10 min',
    type: 'Scenario Sim',
    description: 'Practice handling price objections for the Enterprise plan using the value-based framework.',
};

export const NEXT_PATH_STEP = {
    id: 'module-3',
    title: 'Advanced Discovery Questions',
    progress: 60,
    totalSteps: 5,
    currentStep: 3,
};

export const SKILL_RADAR = [
    { skill: 'Discovery', score: 85, fullMark: 100 },
    { skill: 'Negotiation', score: 65, fullMark: 100 },
    { skill: 'Product Knowledge', score: 90, fullMark: 100 },
    { skill: 'Closing', score: 70, fullMark: 100 },
    { skill: 'Objection Handling', score: 60, fullMark: 100 },
];

export const DIAGNOSTIC_QUESTIONS = [
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
    {
        id: 3,
        question: "A prospect says 'We're happy with our current vendor.' You say:",
        type: "text",
        placeholder: "Type your response...",
    },
    {
        id: 4,
        question: "Rate your understanding of our new Enterprise features.",
        type: "rating",
        options: ["Low", "Medium", "High"],
    },
];

export const LEARNING_PATH = [
    {
        id: 'module-1',
        title: 'Foundation: The Value Framework',
        status: 'completed',
        lessons: [
            { title: 'Understanding Value Drivers', duration: '5 min', type: 'Video' },
            { title: 'Mapping Stakeholders', duration: '8 min', type: 'Article' },
            { title: 'Value Pitch Practice', duration: '10 min', type: 'Drill' },
        ],
    },
    {
        id: 'module-2',
        title: 'Advanced Discovery',
        status: 'in-progress',
        lessons: [
            { title: 'The "Why Now" Question', duration: '4 min', type: 'Video', completed: true },
            { title: 'Uncovering Hidden Pain', duration: '6 min', type: 'Article', completed: true },
            { title: 'Discovery Roleplay Sim', duration: '15 min', type: 'Sim', completed: false },
        ],
    },
    {
        id: 'module-3',
        title: 'Negotiation Mastery',
        status: 'locked',
        lessons: [
            { title: 'Price vs. Value', duration: '7 min', type: 'Video' },
            { title: 'Trading Concessions', duration: '10 min', type: 'Article' },
            { title: 'Contract Negotiation Sim', duration: '20 min', type: 'Sim' },
        ],
    },
    {
        id: 'module-4',
        title: 'Closing Strategies',
        status: 'locked',
        lessons: [
            { title: 'The Mutual Action Plan', duration: '5 min', type: 'Video' },
            { title: 'Handling Last Minute Objections', duration: '12 min', type: 'Drill' },
        ],
    },
];

export const TEAM_DATA = [
    { id: 1, name: 'Sarah J.', role: 'AE', skillScore: 82, trend: '+5', gap: 'Negotiation', lastActive: '2h ago' },
    { id: 2, name: 'Mike T.', role: 'SDR', skillScore: 65, trend: '+2', gap: 'Discovery', lastActive: '1d ago' },
    { id: 3, name: 'Jessica L.', role: 'AE', skillScore: 91, trend: '+1', gap: 'None', lastActive: '5m ago' },
    { id: 4, name: 'David R.', role: 'SDR', skillScore: 58, trend: '-2', gap: 'Objection Handling', lastActive: '3d ago' },
];
