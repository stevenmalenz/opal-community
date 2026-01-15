import { X, Trophy, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LearnerDetailProps {
    userId: string;
    onClose: () => void;
}

export function LearnerDetail({ userId, onClose }: LearnerDetailProps) {
    const { availablePrograms } = useProgram();
    const [learner, setLearner] = useState<any>(null);
    const [progress, setProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLearnerData() {
            setLoading(true);
            setLoading(true);
            try {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                // Fetch progress
                const { data: userProgress, error: progressError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false });

                if (progressError) {
                    console.error("LearnerDetail: Error fetching progress:", progressError);
                }

                setLearner(profile);
                setProgress(userProgress || []);
            } catch (error) {
                console.error('Error fetching learner details:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLearnerData();
    }, [userId]);



    // Calculate stats
    const completedLessons = progress.filter(p => p.completed).length;
    const masteredSkills = progress.filter(p => p.is_mastered).length;

    // Calculate track progress
    const trackProgress = availablePrograms.map(program => {
        // Count total lessons in program
        let totalLessons = 0;
        program.learningPath.forEach(m => {
            totalLessons += m.lessons.length;
        });

        // Count completed lessons for this program
        const completedInProgram = progress.filter(p =>
            p.course_id === program.id && p.completed
        ).length;

        const percent = totalLessons > 0 ? Math.round((completedInProgram / totalLessons) * 100) : 0;

        return {
            ...program,
            percent,
            completedInProgram,
            totalLessons
        };
    });

    // Calculate streak
    const calculateStreak = () => {
        if (!progress || progress.length === 0) return 0;

        // Get unique dates of activity
        const uniqueDates = [...new Set(progress.map(p => new Date(p.updated_at).toDateString()))]
            .map(d => new Date(d).getTime())
            .sort((a, b) => b - a); // Descending order

        if (uniqueDates.length === 0) return 0;

        let streak = 0;
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = today - 86400000;

        // Check if active today or yesterday to start streak
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            streak = 1;
            let currentDate = uniqueDates[0];

            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = uniqueDates[i];
                // If consecutive day (allow 1 day gap logic or strict?)
                // Strict: difference is exactly 1 day (86400000ms)
                // Let's be generous: if diff is <= 2 days? No, streak usually means consecutive.
                const diff = currentDate - prevDate;
                if (diff <= 100000000 && diff >= 80000000) { // Approx 1 day (86.4m ms)
                    streak++;
                    currentDate = prevDate;
                } else {
                    break;
                }
            }
        }

        // Simple fallback: just count total active days if streak logic is too strict for demo
        // But user asked for "real". Let's stick to simple count of active days for now as "Days Active" 
        // is often interpreted as total days active in some contexts, OR strict streak.
        // The UI says "Streak" / "Days Active". 
        // Let's do: Streak = consecutive days ending today/yesterday.
        return streak;
    };

    const streak = calculateStreak();




    if (!learner && !loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold border-4 border-white shadow-sm">
                            {learner?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{learner?.full_name || 'Unknown User'}</h2>
                            <p className="text-gray-500">{learner?.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                    {learner?.role || 'Learner'}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                        <BookOpen size={18} />
                                        <span className="text-sm font-semibold">Lessons</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{completedLessons}</div>
                                    <div className="text-xs text-gray-500">Completed</div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-white p-4 rounded-xl border border-yellow-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-yellow-600 mb-2">
                                        <Trophy size={18} />
                                        <span className="text-sm font-semibold">Mastery</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{masteredSkills}</div>
                                    <div className="text-xs text-gray-500">Skills Earned</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-green-600 mb-2">
                                        <Clock size={18} />
                                        <span className="text-sm font-semibold">Streak</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{streak}</div>
                                    <div className="text-xs text-gray-500">Consecutive Days</div>
                                </div>
                            </div>

                            {/* Track Progress */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Track Progress</h3>
                                <div className="space-y-4">
                                    {trackProgress.map(track => (
                                        <div key={track.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-800">{track.title}</span>
                                                <span className="text-sm font-medium text-gray-600">{track.percent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${track.percent}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                                <span>{track.completedInProgram} / {track.totalLessons} lessons</span>
                                                <span>Last active: {
                                                    progress.filter(p => p.course_id === track.id).length > 0
                                                        ? new Date(Math.max(...progress.filter(p => p.course_id === track.id).map(p => new Date(p.updated_at).getTime()))).toLocaleDateString()
                                                        : 'Never'
                                                }</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                                <div className="space-y-0">
                                    {progress.length === 0 ? (
                                        <p className="text-gray-500 italic">No recent activity recorded.</p>
                                    ) : (
                                        progress.slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="flex gap-4 pb-6 relative last:pb-0">
                                                {/* Connecting Line */}
                                                {idx !== progress.length - 1 && (
                                                    <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200"></div>
                                                )}

                                                <div className="relative z-10 mt-1">
                                                    {item.is_mastered ? (
                                                        <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center ring-4 ring-white">
                                                            <Trophy size={12} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center ring-4 ring-white">
                                                            <CheckCircle size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        <span className="font-medium">
                                                            {item.is_mastered ? 'Mastered' : 'Completed'} lesson
                                                        </span>
                                                        {' '}in module{' '}
                                                        <span className="text-gray-600">{item.module_id || 'Unknown'}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {new Date(item.updated_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

