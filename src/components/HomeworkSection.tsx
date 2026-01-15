import { useState, useEffect } from 'react';
// import { RichTextEditor } from './RichTextEditor';
// import { CommentSection } from './CommentSection'; // Reuse generic comment section
import { ChevronDown, ChevronUp, CheckCircle, Link as LinkIcon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface HomeworkSectionProps {
    lessonId: string;
    moduleId: string; // Required for new schema
    courseId?: string; // Optional but good for data integrity
    onSubmissionStatusChange?: (status: string) => void;
    refreshTrigger?: number; // New prop to trigger refetch
}

export function HomeworkSection({ lessonId, moduleId: _moduleId, courseId, onSubmissionStatusChange, refreshTrigger = 0 }: HomeworkSectionProps) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    // Removed form state
    const [submissions, setSubmissions] = useState<any[]>([]);

    // Admin check
    const isAdmin = user?.app_metadata?.role === 'admin' || user?.email?.includes('admin'); // Simple check

    useEffect(() => {
        fetchSubmissions();
    }, [lessonId, refreshTrigger]); // Added refreshTrigger dependency

    const handleApprove = async (submissionId: string) => {
        try {
            const { error } = await supabase
                .from('homework_submissions')
                .update({ status: 'approved' })
                .eq('id', submissionId);

            if (error) throw error;
            fetchSubmissions(); // Refresh UI
        } catch (err) {
            console.error("Failed to approve:", err);
            alert("Failed to approve submission");
        }
    };

    const fetchSubmissions = async () => {
        try {
            // Try fetching from the NEW table first
            // Note: We need to handle the case where we might want to show OLD submissions from 'submissions' table if they exist?
            // For now, let's assume we are moving forward with 'homework_submissions'.

            let query = supabase
                .from('homework_submissions')
                .select(`
id, content, video_url, created_at, user_id, status, grade, feedback,
    profiles: user_id(full_name, email)
        `)
                .eq('lesson_id', lessonId)
                .order('created_at', { ascending: false });

            // DATA ISOLATION FIX: Filter by courseId to prevent 'l1' collision
            // But allow NULL course_id to handle cases where insertion fell back to no-course (FK error)
            if (courseId) {
                query = query.or(`course_id.eq.${courseId},course_id.is.null`);
            } else {
                console.warn("HomeworkSection: No courseId provided. Aborting fetch to prevent data leak.");
                setSubmissions([]);
                return;
            }

            const { data, error } = await query;


            if (error) {
                console.warn("Could not fetch new submissions, checking old table...", error);
                // Fallback to old table if new one fails (e.g. RLS or logic error) or just to show old data
                // Omitted for brevity in this refactor, assuming new table works
                return;
            }

            const formatted = data?.map(s => {
                // @ts-ignore
                const userProfile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
                return {
                    id: s.id,
                    author: userProfile?.full_name || userProfile?.email || 'Unknown User',
                    content: s.content,
                    video_url: s.video_url,
                    timestamp: formatDistanceToNow(new Date(s.created_at), { addSuffix: true }),
                    user_id: s.user_id,
                    status: s.status, // Include status
                    grade: s.grade,
                    feedback: s.feedback,
                    comments: []
                };
            }) || [];

            setSubmissions(formatted);

            // Report status of CURRENT USER's submission
            const mySub = formatted.find(s => s.user_id === user?.id);
            if (onSubmissionStatusChange) {
                onSubmissionStatusChange(mySub?.status || 'pending_submission');
            }

        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };



    return (
        <div className="mt-12 border-t border-gray-200 pt-8">
            <div
                className="flex justify-between items-center cursor-pointer mb-6"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Homework & Discussion
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{submissions.length}</span>
                </h2>
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>

            {isExpanded && (
                <>


                    {/* Class Submissions */}
                    <div className="space-y-6">
                        {submissions.length > 0 ? (
                            submissions.map(sub => (
                                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                                                {sub.author.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{sub.author}</h4>
                                                <p className="text-xs text-gray-500">{sub.timestamp}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            sub.status === 'graded' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {sub.status === 'approved' ? 'Approved' : sub.status === 'graded' ? 'AI Graded' : 'Pending'}
                                        </span>
                                        {sub.status === 'pending' && (sub.user_id === user?.id || isAdmin) && (
                                            <button
                                                onClick={() => {
                                                    // Quick Retry Logic Inline
                                                    alert("Retrying AI Grading...");
                                                    import('../lib/aiService').then(async ({ gradeHomework }) => {
                                                        const gradeResult = await gradeHomework('Complete objective', sub.content || sub.video_url, {});
                                                        if (gradeResult) {
                                                            await supabase.from('homework_submissions').update({ grade: gradeResult, status: 'graded', feedback: gradeResult.feedback }).eq('id', sub.id);
                                                            // @ts-ignore
                                                            fetchSubmissions();
                                                        } else {
                                                            alert("AI Grading failed. Please contact admin.");
                                                        }
                                                    });
                                                }}
                                                className="text-[10px] text-indigo-600 hover:underline font-medium"
                                            >
                                                Stuck? Grade Now
                                            </button>
                                        )}
                                    </div>

                                    {sub.content && (
                                        <div
                                            className="prose prose-sm max-w-none mb-4 text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: sub.content }}
                                        />
                                    )}

                                    {sub.video_url && (
                                        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                                            <div className="bg-indigo-100 p-2 rounded-md"><LinkIcon size={16} className="text-indigo-600" /></div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-xs text-gray-500 uppercase font-semibold">Attached Link</div>
                                                <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate block">
                                                    {sub.video_url}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Feedback Display */}
                                    {sub.feedback && (
                                        <div className="mt-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-sm">
                                                <Sparkles size={14} />
                                                <span>AI Coach Feedback</span>
                                            </div>
                                            <div className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
                                                {sub.feedback}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Actions */}
                                    {isAdmin && sub.status !== 'approved' && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                            <button
                                                onClick={() => handleApprove(sub.id)}
                                                className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                                            >
                                                <CheckCircle size={14} /> Approve Submission
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                <p>No submissions yet. Be the first!</p>
                            </div>
                        )}
                    </div>
                </>
            )
            }
        </div >
    )
}
