export interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: 'Video' | 'Article' | 'Drill' | 'Sim';
    completed?: boolean;
    mastered?: boolean;
    content?: string; // Markdown content
    flash_card_title?: string;
    flash_card_content?: string;
}

export interface Module {
    id: string;
    title: string;
    status: 'locked' | 'in-progress' | 'completed';
    lessons: Lesson[];
}

export interface Skill {
    id: string;
    name: string;
    score: number;
    fullMark: number;
}

export interface Drill {
    id: string;
    title: string;
    duration: string;
    type: string;
    description: string;
}

export interface Scenario {
    id: string;
    title: string;
    role: string;
    context: string;
    goal: string;
    prospectImage: string;
}

export interface DiagnosticQuestion {
    id: number;
    question: string;
    type: 'rating' | 'choice' | 'text';
    options?: string[];
    placeholder?: string;
}

export interface ProgramConfig {
    id: string;
    title: string;
    role: string;
    themeColor: string; // e.g., 'indigo' | 'emerald' | 'rose'
    skills: Skill[];
    learningPath: Module[];
    dailyDrill: Drill;
    diagnosticQuestions: DiagnosticQuestion[];
    scenarios: Scenario[];
    created_at?: string;
    updated_at?: string;
    description?: string;
    sources?: { id: number; title: string; url?: string }[];
    status?: 'active' | 'archived' | 'generating';
}

export interface UserCourseContext {
    goal: string;
    role: string;
    kpi: string;
    workflowToBuild: string;
    outcome: string; // Renamed from roiOutcome to match component usage
    timeline: string;
}
