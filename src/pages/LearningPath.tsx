import { useState, useEffect } from 'react';
import { Sparkles, Trophy, Check, Loader2, Lock } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { useProgram } from '../context/ProgramContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

import { WelcomeModal } from '../components/WelcomeModal';
// import { LearnerDashboard } from '../components/LearnerDashboard';
import { ProgramHeader } from '../components/ProgramHeader';
import './LearningPath.css';

export function LearningPath() {
    const { currentProgram } = useProgram();
    const { triggerWelcome } = useChat();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Teacher / Edit Mode
    const [isTeacherMode, setIsTeacherMode] = useState(false);
    const isBuilding = searchParams.get('status') === 'building' || location.state?.status === 'building' || currentProgram?.status === 'generating';
    // const buildingContext = location.state; // { agentJobId, toolName, userGoal } -> Will be used by Buddy via location hook

    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Trigger proactive welcome message from chat (skip for admins)
        if (user?.user_metadata?.role === 'admin') return;
        const timer = setTimeout(() => {
            triggerWelcome();
        }, 1500);
        return () => clearTimeout(timer);
    }, [user, triggerWelcome]);

    useEffect(() => {
        // Check if user has seen welcome modal
        if (user && user.user_metadata?.role === 'admin') return;
        if (user && !user.user_metadata?.has_seen_welcome) {
            const timer = setTimeout(() => {
                setShowWelcome(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    if (isBuilding) {
        // Render Skeleton State
        return (
            <div className="path-container animate-in fade-in duration-700">
                <div className="path-header flex justify-between items-end mt-8 mb-8">
                    <div>
                        <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
                    </div>
                </div>

                {/* Skeleton Dashboard */}
                <div className="mb-6 h-32 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
                    <div className="space-y-3">
                        <div className="h-4 w-32 bg-slate-100 rounded"></div>
                        <div className="h-8 w-48 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-indigo-50 border-4 border-indigo-100"></div>
                </div>

                {/* Skeleton Modules */}
                <div className="modules-list space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 opacity-60">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                <div className="space-y-2">
                                    <div className="h-5 w-40 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-3 pl-12">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100 flex items-center px-4">
                                        <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Coming Soon Overlay */}
                            <div className="mt-4 flex justify-center text-xs text-slate-400 font-medium tracking-wide uppercase">
                                Coming Soon
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!currentProgram) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" /></div>;

    // Guard against missing structure
    if (!currentProgram.learningPath) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Learning Path Found</h2>
                <p className="text-slate-500 mb-4">It seems this track is empty or was deleted.</p>
                <button
                    onClick={() => navigate('/app/knowledge')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Create New Track
                </button>
            </div>
        );
    }

    const modules = currentProgram.learningPath;
    const currentModuleIndex = modules.findIndex(m => m.status === 'in-progress');
    const effectiveIndex = currentModuleIndex === -1 ? (modules.every(m => m.status === 'completed') ? modules.length : 0) : currentModuleIndex;

    return (
        <div className="path-container max-w-5xl mx-auto px-4 py-8">

            {/* Header / Social Section */}
            <div className="mb-8">
                <ProgramHeader isTeacherMode={isTeacherMode} onToggleTeacherMode={setIsTeacherMode} />
            </div>

            <div className="modules-list space-y-6">
                {modules.map((module, index) => {
                    const isFuture = index > effectiveIndex;
                    const isCurrent = index === effectiveIndex; // Force single active module based on sequential logic
                    // const isCurrentRaw = module.status === 'in-progress'; // Old logic allowed db inconsistency
                    const isCompleted = module.status === 'completed';

                    return (
                        <Card
                            key={module.id}
                            className={cn(
                                'module-card transition-all duration-300',
                                isCompleted && 'border-green-100 bg-green-50/10',
                                isFuture && 'opacity-90 bg-slate-50 border-dashed hover:border-solid hover:bg-white hover:opacity-100'
                            )}
                        >
                            <div className="module-header relative">
                                {/* Future / Tailored Indicator */}
                                {isFuture && (
                                    <div className="absolute -top-3 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-200 shadow-sm z-10 animate-in fade-in slide-in-from-bottom-2">
                                        <Sparkles size={10} />
                                        Will be tailored based on homework
                                    </div>
                                )}

                                <div className="module-status-icon">
                                    {isCompleted ? (
                                        <div className="bg-green-100 text-green-600 rounded-full p-1">
                                            <Check size={20} strokeWidth={3} />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="current-indicator">
                                            <span className="pulse-ring"></span>
                                            <span className="dot"></span>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                            {/* Teacher mode toggle removed, so we default to showing index or lock */}
                                            <Lock size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="module-info">
                                    <span className="module-label text-slate-500">Module {index + 1}</span>
                                    <h3 className={cn(isFuture && "text-slate-600")}>{module.title.replace(/^Module \d+:\s*/i, '')}</h3>
                                </div>

                                {isCurrent && (
                                    <span className="status-badge">In Progress</span>
                                )}

                                {/* Teacher Edit Controls (Placeholder) */}
                                {isTeacherMode && (
                                    <button className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                        Edit Content
                                    </button>
                                )}
                            </div>

                            <div className={cn("lessons-list")}>
                                {module.lessons.map((lesson, i) => (
                                    <Link
                                        key={i}
                                        to={`/app/program/${currentProgram.id}/lesson/${module.id}/${lesson.id}`}
                                        className={cn('lesson-item', 'completed' in lesson && lesson.completed && 'completed')}
                                    >
                                        <div className="lesson-details">
                                            <span className="lesson-title">{lesson.title}</span>
                                        </div>

                                        <div className="lesson-action">
                                            {'completed' in lesson && lesson.completed ? (
                                                // @ts-ignore
                                                lesson.mastered ? (
                                                    <div className="flex items-center gap-2 text-yellow-600 font-bold bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                                                        <Trophy size={16} fill="currentColor" />
                                                        <span>Mastered</span>
                                                    </div>
                                                ) : (
                                                    <button className="btn-secondary small flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200">
                                                        <Trophy size={14} />
                                                        Prove Mastery
                                                    </button>
                                                )
                                            ) : (
                                                <button className="btn-primary small">{isFuture ? 'Preview' : 'Start'}</button>
                                            )}
                                        </div>
                                    </Link >
                                ))}
                            </div >


                        </Card >
                    );
                })}
            </div >

            {showWelcome && (
                <WelcomeModal
                    onClose={() => setShowWelcome(false)}
                    courseName={currentProgram?.title || "Enablement Masterclass"}
                />
            )}


        </div >
    );
}
