import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, PlayCircle, HelpCircle, BookOpen, Target } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useChat } from '../context/ChatContext';

interface SuggestionCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
    color?: string;
    keepSidebarClosed?: boolean;
}

function SuggestionCard({ icon: Icon, title, description, onClick, color = "indigo" }: SuggestionCardProps) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center text-left p-2 rounded-lg border transition-all duration-200 w-full
                hover:shadow-sm hover:bg-slate-50 active:scale-[0.98]
                bg-white border-slate-200 group gap-3
            `}
        >
            <div className={`p-1.5 rounded-md bg-${color}-50 text-${color}-600 group-hover:bg-${color}-100 transition-colors shrink-0`}>
                <Icon size={16} />
            </div>
            <div>
                <h4 className="font-semibold text-slate-700 text-xs mb-0.5">{title}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
            </div>
        </button>
    );
}

interface SmartSuggestionsProps {
    onAction?: () => void;
    mode?: 'embedded' | 'floating';
}

export function SmartSuggestions({ onAction, mode = 'embedded' }: SmartSuggestionsProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentProgram, setIsPersonalizationOpen } = useProgram();
    const { sendMessage, startScenario, setInputFocus, setIsSidebarOpen } = useChat();
    const [isVisible, setIsVisible] = useState(true);

    // Determine context
    const isLesson = location.pathname.includes('/lesson/');
    const isSkills = location.pathname.includes('/skills');

    if (!isVisible && mode === 'embedded') return null;

    const handleAction = (action: () => void, keepSidebarClosed = false) => {
        if (!keepSidebarClosed) setIsSidebarOpen(true); // Ensure chat is open unless specified
        action();
        if (mode === 'embedded') setIsVisible(false);
        if (onAction) onAction();
    };

    const handleStartNextLesson = () => {
        if (!currentProgram) return;
        // Find first in-progress or locked (next) lesson
        let nextLessonId = null;
        let nextModuleId = null;

        // Try to find in-progress lesson
        for (const module of currentProgram.learningPath) {
            const inProgress = module.lessons.find(l => !('completed' in l) || !l.completed);
            if (inProgress) {
                nextLessonId = inProgress.id;
                nextModuleId = module.id;
                break;
            }
        }

        if (nextLessonId && nextModuleId) {
            navigate(`/app/program/${currentProgram.id}/lesson/${nextModuleId}/${nextLessonId}`);
        } else {
            navigate('/app/path');
        }
    };

    const handleAskQuestion = () => {
        if (setInputFocus) setInputFocus(true);
    };

    const suggestions = [];

    if (isLesson) {
        suggestions.push(
            {
                icon: HelpCircle,
                title: "Explain Concept",
                description: "Simple explanation of this topic.",
                onClick: () => sendMessage("Can you explain the main concept of this lesson in simple terms?"),
                color: "blue"
            },
            {
                icon: Sparkles,
                title: "Add Context",
                description: "Apply to my role & industry.",
                onClick: () => setIsPersonalizationOpen(true),
                keepSidebarClosed: true,
                color: "purple"
            },
            {
                icon: Target,
                title: "Quiz Me",
                description: "Test my understanding.",
                onClick: () => startScenario('quiz'),
                color: "green"
            }
        );
    } else if (isSkills) {
        suggestions.push(
            {
                icon: Target,
                title: "Improve Skill",
                description: "Drill for weakest skill.",
                onClick: () => sendMessage("I want to improve my weakest skill. Can you recommend a drill?"),
                color: "red"
            },
            {
                icon: BookOpen,
                title: "View Path",
                description: "See relevant modules.",
                onClick: () => navigate('/app/path'),
                color: "indigo"
            }
        );
    } else {
        // Default / Dashboard
        suggestions.push(
            {
                icon: PlayCircle,
                title: "Start Next Lesson",
                description: "Continue your path.",
                onClick: handleStartNextLesson,
                color: "indigo"
            },
            {
                icon: HelpCircle,
                title: "Ask a Question",
                description: "Get help with any topic.",
                onClick: handleAskQuestion,
                color: "blue"
            },
            {
                icon: Sparkles,
                title: "Add Context",
                description: "Apply to my context.",
                onClick: () => setIsPersonalizationOpen(true),
                keepSidebarClosed: true,
                color: "purple"
            }
        );
    }

    if (mode === 'floating') {
        return (
            <div className="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleAction(s.onClick, s.keepSidebarClosed)}
                        className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full shadow-lg border border-indigo-100 hover:scale-105 transition-transform group"
                    >
                        <div className={`p-1.5 rounded-full bg-${s.color}-50 text-${s.color}-600 group-hover:bg-${s.color}-100`}>
                            <s.icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{s.title}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 border-b border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Actions</h3>
                <button onClick={() => setIsVisible(false)} className="text-[10px] text-slate-400 hover:text-slate-600">Dismiss</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {suggestions.map((s, i) => (
                    <SuggestionCard key={i} {...s} onClick={() => handleAction(s.onClick, s.keepSidebarClosed)} />
                ))}
            </div>
        </div>
    );
}
