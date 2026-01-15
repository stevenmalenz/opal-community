import { useState, useEffect } from 'react';
import { Target, TrendingUp, Award, ChevronRight, Edit2, Play, CheckCircle, Save, Hammer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { UserCourseContext } from '../types/program';

interface DashboardProps {
    programId?: string; // Optional context
    compact?: boolean;
}

export function LearnerDashboard({ programId, compact = false }: DashboardProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [context, setContext] = useState<UserCourseContext | null>(null);
    const [userCourseId, setUserCourseId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [nextLesson, setNextLesson] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<UserCourseContext>({
        goal: '', role: '', kpi: '', workflowToBuild: '', outcome: '', timeline: ''
    });

    useEffect(() => {
        if (!user) return;
        fetchNorthStar();
    }, [user, programId]);

    const fetchNorthStar = async () => {
        try {
            let query = supabase
                .from('user_courses')
                .select(`
                    id, 
                    course_context, 
                    progress,
                    courses ( title, structure )
                `)
                .eq('user_id', user!.id);

            if (programId) {
                // programId passed from params is often the course_id or user_course_id. 
                // In this app routing /app/program/:id, id is the user_courses.id usually (or course_id depending on impl).
                // Let's assume it's user_course.id based on standard patterns here or fallback to course_id match
                query = query.eq('id', programId);
            } else {
                query = query.order('last_accessed_at', { ascending: false }).limit(1);
            }

            const { data } = await query.maybeSingle();

            if (data) {
                setUserCourseId(data.id);
                const ctx = data.course_context || {};
                setContext(ctx);
                setEditForm({
                    goal: ctx.goal || '',
                    role: ctx.role || '',
                    kpi: ctx.kpi || '',
                    workflowToBuild: ctx.workflowToBuild || '',
                    outcome: ctx.outcome || '',
                    timeline: ctx.timeline || ''
                });

                findNextLesson(data);
            }
        } catch (e) {
            console.error("Error fetching dashboard", e);
        } finally {
            setLoading(false);
        }
    };

    const findNextLesson = (userCourse: any) => {
        const structure = userCourse.courses?.structure?.learningPath || [];
        if (structure.length > 0 && structure[0].lessons?.length > 0) {
            setNextLesson({
                title: structure[0].lessons[0].title,
                module: structure[0].title,
                id: structure[0].lessons[0].title,
                moduleId: structure[0].id
            });
        }
    };

    const handleSave = async () => {
        if (!userCourseId) return;
        try {
            const { error } = await supabase
                .from('user_courses')
                .update({ course_context: editForm })
                .eq('id', userCourseId);

            if (error) throw error;
            setContext(editForm);
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save context", e);
            alert("Failed to save changes");
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl w-full"></div>;
    if (!context) return null;

    return (
        <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 ${compact ? 'p-4' : 'p-6'}`}>
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                {/* North Star Section */}
                <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-600 font-medium text-xs uppercase tracking-wider">
                            <Target size={14} />
                            <span>Current North Star</span>
                        </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Role & Outcome</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        className="flex-1 text-sm border-gray-300 rounded-md p-1.5"
                                        placeholder="Role (e.g. Account Executive)"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.outcome}
                                        onChange={e => setEditForm({ ...editForm, outcome: e.target.value })}
                                        className="flex-1 text-sm border-gray-300 rounded-md p-1.5"
                                        placeholder="Desired Outcome"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Success Metrics (KPI)</label>
                                <input
                                    type="text"
                                    value={editForm.kpi}
                                    onChange={e => setEditForm({ ...editForm, kpi: e.target.value })}
                                    className="w-full text-sm border-gray-300 rounded-md p-1.5"
                                    placeholder="e.g. Close 5 deals per quarter"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md">Cancel</button>
                                <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1">
                                    <Save size={12} /> Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                {context.role ? `${context.role}: ` : ''}
                                {context.outcome || "Mastering this key competency"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Goal</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {context.goal || "Goal not set"}
                                    </p>
                                </div>
                                {context.kpi && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Target KPI</p>
                                        <p className="text-sm text-gray-600 border-l-2 border-green-400 pl-2">
                                            {context.kpi}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Workflow Builder Status (Placeholder for now) */}
                {!compact && (
                    <div className="hidden lg:block w-px bg-gray-100 h-24 mx-4"></div>
                )}
                {!compact && (
                    <div className="hidden lg:flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center gap-2 text-orange-600 font-medium text-xs uppercase tracking-wider">
                            <Hammer size={14} />
                            <span>Workflow Builder</span>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                            <div className="text-xs text-orange-800 font-medium mb-1">Status: <span className="font-bold">Planning</span></div>
                            <div className="w-full bg-orange-200 rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full w-[20%]"></div>
                            </div>
                            <p className="text-[10px] text-orange-600 mt-2 leading-tight">
                                {context.workflowToBuild ? `Building: ${context.workflowToBuild}` : 'No active workflow project.'}
                            </p>
                        </div>
                    </div>
                )}


                {/* Next Step */}
                {nextLesson && (
                    <div className="w-full md:w-auto flex flex-col gap-3 min-w-[280px]">
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-4 group cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all"
                            onClick={() => navigate(`/app/program/${programId || ''}/lesson/${nextLesson.moduleId}/${nextLesson.id}`)}
                        >
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                <Play size={16} fill="white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Up Next</div>
                                <div className="text-sm font-semibold text-gray-900 truncate">{nextLesson.title}</div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500" />
                        </div>
                    </div>
                )}

            </div>

            {/* Progress / Stats Bar */}
            {!compact && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><TrendingUp size={18} /></div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">12%</div>
                            <div className="text-xs text-gray-500 font-medium">Concept Mastery</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Award size={18} /></div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-xs text-gray-500 font-medium">Badges Earned</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={18} /></div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">Beginner</div>
                            <div className="text-xs text-gray-500 font-medium">Proficiency Level</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
