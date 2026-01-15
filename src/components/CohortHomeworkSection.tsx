import { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { CommentSection } from './CommentSection';

interface CohortHomeworkSectionProps {
    sessionId: string;
}

export function CohortHomeworkSection({ sessionId }: CohortHomeworkSectionProps) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    const [submissionContent, setSubmissionContent] = useState('');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (sessionId) fetchSubmissions();
    }, [sessionId]);

    const fetchSubmissions = async () => {
        try {
            const { data, error } = await supabase
                .from('cohort_homework')
                .select(`
                    *,
                    profiles (full_name, email),
                    comments (
                        *,
                        profiles (full_name, email)
                    )
                `)
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setSubmissions(data || []);

            // Allow user to edit their own recent submission if found
            if (user) {
                const mySub = data?.find((s: any) => s.user_id === user.id);
                if (mySub) {
                    setSubmissionContent(mySub.content); // Pre-fill
                }
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    const handleSubmit = async () => {
        if (!submissionContent) return;
        setIsSubmitting(true);
        try {
            // Check if exists (Upsert logic)
            const { data: existing } = await supabase
                .from('cohort_homework')
                .select('id')
                .eq('session_id', sessionId)
                .eq('user_id', user?.id)
                .single();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('cohort_homework')
                    .update({ content: submissionContent, status: 'submitted' })
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('cohort_homework')
                    .insert({
                        content: submissionContent,
                        user_id: user?.id,
                        session_id: sessionId,
                        status: 'submitted'
                    });
                error = insertError;
            }

            if (error) throw error;

            await fetchSubmissions();
            alert('Homework submitted successfully!');
        } catch (error) {
            console.error('Error submitting homework:', error);
            alert('Failed to submit homework');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddComment = async (homeworkId: string, content: string) => {
        try {
            const { error } = await supabase.from('comments').insert({
                user_id: user?.id,
                cohort_homework_id: homeworkId,
                content
            });
            if (error) throw error;
            fetchSubmissions(); // Refresh to show new comment
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
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
                <div className="space-y-8">
                    {/* Submission Form */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Submit your work</h3>
                        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden mb-4">
                            <RichTextEditor
                                content={submissionContent}
                                onChange={setSubmissionContent}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !submissionContent}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? 'Submitting...' : <><CheckCircle size={18} /> Submit Homework</>}
                            </button>
                        </div>
                    </div>

                    {/* Class Submissions */}
                    <div className="space-y-6">
                        <h3 className="font-semibold text-gray-900">Class Submissions</h3>
                        {submissions.length === 0 ? (
                            <p className="text-gray-500 italic">No submissions yet. Be the first!</p>
                        ) : (
                            submissions.map(sub => (
                                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{sub.profiles?.full_name || sub.profiles?.email || 'Unknown User'}</h4>
                                            <p className="text-sm text-gray-500">
                                                {sub.created_at ? formatDistanceToNow(new Date(sub.created_at), { addSuffix: true }) : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className="prose prose-sm max-w-none mb-6"
                                        dangerouslySetInnerHTML={{ __html: sub.content }}
                                    />

                                    {/* Comments Integration */}
                                    <CommentSection
                                        comments={sub.comments?.map((c: any) => ({
                                            id: c.id,
                                            author: c.profiles?.full_name || c.profiles?.email || 'Unknown',
                                            content: c.content,
                                            timestamp: c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''
                                        })) || []}
                                        onAddComment={(text) => handleAddComment(sub.id, text)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
