import { useState } from 'react';
import { Trophy, Target, BookOpen, ChevronDown, Users, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useProgram } from '../context/ProgramContext';
import { useUserMemory } from '../context/UserMemoryContext';
import { InviteMembersModal } from './InviteMembersModal'; // Imported

interface ProgramHeaderProps {
    isTeacherMode: boolean;
    onToggleTeacherMode: (enabled: boolean) => void;
}

export function ProgramHeader({ isTeacherMode, onToggleTeacherMode }: ProgramHeaderProps) {
    const { user } = useAuth();
    const { currentProgram, completionPercentage } = useProgram();
    const { getMemory } = useUserMemory();
    const [showLessonsDropdown, setShowLessonsDropdown] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false); // State for modal

    // Mock data if not available in memory/context
    const userGoal = getMemory('Goal') || 'Get Promoted to Senior Manager';
    const capstoneProject = getMemory('Capstone') || 'Sales Enablement Playbook';
    // const teacherName = "Sarah Jenkins" // if we had a real human mapping

    const completedLessons = currentProgram?.learningPath.reduce((acc, mod) =>
        acc + mod.lessons.filter(l => l.completed).length, 0) || 0;

    const totalLessons = currentProgram?.learningPath.reduce((acc, mod) =>
        acc + mod.lessons.length, 0) || 0;

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 relative">
            {/* ...Teacher Toggle... */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
                <span className={cn("text-xs font-semibold uppercase tracking-wider", isTeacherMode ? "text-indigo-600" : "text-slate-400")}>
                    {isTeacherMode ? 'Teacher Mode' : 'Learner Mode'}
                </span>
                <button
                    onClick={() => onToggleTeacherMode(!isTeacherMode)}
                    className={cn(
                        "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                        isTeacherMode ? "bg-indigo-600" : "bg-slate-200"
                    )}
                >
                    <span
                        className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out flex items-center justify-center text-sm",
                            isTeacherMode ? "translate-x-7" : "translate-x-1"
                        )}
                    >
                        {isTeacherMode ? '👩‍🏫' : '🎓'}
                    </span>
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {/* 1. Welcome & Title */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner'}!
                    </h1>
                    <p className="text-slate-500">Let's continue your journey to mastery.</p>
                </div>

                {/* 2. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Goal */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                        <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                            <Target size={14} /> Goal
                        </div>
                        <div className="text-sm text-slate-900" title={userGoal}>
                            {userGoal}
                        </div>
                    </div>

                    {/* Capstone */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                        <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                            <Trophy size={14} /> Capstone
                        </div>
                        <div className="text-sm text-slate-900" title={capstoneProject}>
                            {capstoneProject}
                        </div>
                    </div>

                    {/* Lesson Progress (Clickable) */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2 relative">
                        <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                            <BookOpen size={14} /> Lessons
                        </div>
                        <button
                            className="flex items-center justify-between font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                            onClick={() => setShowLessonsDropdown(!showLessonsDropdown)}
                        >
                            <span className="text-xl">
                                {completedLessons} <span className="text-slate-400 text-sm">/ {totalLessons}</span>
                            </span>
                            <ChevronDown size={16} className={cn("transition-transform", showLessonsDropdown && "rotate-180")} />
                        </button>

                        {/* Dropdown - History */}
                        {showLessonsDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95">
                                <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                                    Recent Activity
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {/* Mock placeholder items */}
                                    <div className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                                        <div className="text-xs text-green-600 font-medium mb-1">Feedback Received</div>
                                        <div className="text-sm text-slate-700 truncate">Module 1: Discovery Call</div>
                                    </div>
                                    <div className="p-3 hover:bg-slate-50 cursor-pointer">
                                        <div className="text-xs text-slate-500 mb-1">Homework Submitted</div>
                                        <div className="text-sm text-slate-700 truncate">Module 2: Negotiation</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Classmates / Invite Section (Replaces Teacher) */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                                <Users size={14} /> Classmates
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {[1, 2].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                            U{i}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="w-6 h-6 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
                                    onClick={() => setShowInviteModal(true)}
                                    title="Invite Peers"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar (Overall) */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteMembersModal
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    );
}
