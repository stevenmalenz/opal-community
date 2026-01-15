import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';

import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export function CoachingHub() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    const activeSubmission = submissions.find(s => s.id === selectedSubmissionId);

    React.useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            // Try fetching with comments first
            const { data, error } = await supabase
                .from('homework_submissions')
                .select(`
    *,
    profiles: user_id(full_name, email),
    homework_comments (
            id, content, created_at, user_id,
            profiles: user_id(full_name, email)
        )
            `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            formatSubmissions(data);
        } catch (error: any) {
            console.warn('Error fetching submissions with comments, trying fallback:', error);
            // Fallback: Fetch without comments (if table missing)
            if (error.code === 'PGRST200' || error.message?.includes('homework_comments')) {
                try {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('homework_submissions')
                        .select(`
            *,
            profiles: user_id(full_name, email)
        `)
                        .order('created_at', { ascending: false });

                    if (fallbackError) throw fallbackError;
                    formatSubmissions(fallbackData);
                } catch (finalError) {
                    console.error('Critical error fetching submissions:', finalError);
                }
            }
        }
    };

    const formatSubmissions = (data: any[]) => {
        if (!data) return;
        const formatted = data.map(s => {
            // Map homework_comments and Feedback
            // Map homework_comments and Feedback
            const userComments = s.homework_comments?.map((c: any) => ({
                id: c.id,
                content: c.content,
                author: c.profiles?.full_name || c.profiles?.email || 'Unknown User',
                timestamp: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
                sortDate: c.created_at // Keep raw date for sorting
            })) || [];

            // Artificial comment from AI if feedback exists
            if (s.feedback) {
                userComments.push({
                    id: `feedback-${s.id}`,
                    content: `**AI Coach Feedback:**\n${s.feedback}`,
                    author: 'Pawfessor AI',
                    timestamp: formatDistanceToNow(new Date(s.updated_at || s.created_at), { addSuffix: true }),
                    isSystem: true,
                    sortDate: s.updated_at || s.created_at
                });
            }

            // Sort by date (Newest First)
            userComments.sort((a: any, b: any) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

            return {
                id: s.id,
                student: s.profiles?.full_name || s.profiles?.email || 'Unknown User',
                lesson: s.lesson_id ? `Lesson ID: ${s.lesson_id} ` : 'General Submission', // Ideally fetch lesson title
                status: s.status || 'pending',
                content: s.content || s.video_url || '(No content)',
                timestamp: formatDistanceToNow(new Date(s.created_at), { addSuffix: true }),
                comments: userComments
            };
        });
        setSubmissions(formatted);
    };

    const handleAddFeedback = async (content: string) => {
        if (!selectedSubmissionId) return;

        try {
            // Add comment to NEW table
            const { error: commentError } = await supabase
                .from('homework_comments')
                .insert({
                    homework_submission_id: selectedSubmissionId,
                    user_id: user?.id,
                    content
                });

            if (commentError) throw commentError;

            // Update status to 'reviewed' (if generic status flow is desired)
            // Or 'approved' if this action implies approval? keeping 'reviewed' for now or 'graded'.
            // If admin comments, maybe we don't auto-change status? 
            // User requested: "reply to fix suggested improvements".
            // Let's keep status update for now (shows interaction).
            const { error: _updateError } = await supabase
                .from('homework_submissions')
                .update({ status: 'approved' }) // Assuming feedback from admin = success/approval? Or just 'reviewed'?
                // User said "AI graded... I'm the admin... user should be able to reply".
                // If Admin comments, usually it's Feedback.
                // Let's NOT auto-approve. Let them click "Approve" separately?
                // But the UI below has "Feedback & Discussion".
                // And there was a separate "Approve" button? 
                // In CoachingHub, I don't see an explicit Approve button in the detailed view!
                // I should add one.
                // For now, let's just add the comment.
                ;

            // Optional: If status is pending, maybe mark as reviewed?
            // const { error: updateError } = await supabase
            //     .from('homework_submissions')
            //     .update({ status: 'reviewed' })
            //     .eq('id', selectedSubmissionId);

            await fetchSubmissions();
        } catch (error) {
            console.error('Error adding feedback:', error);
            alert('Failed to submit feedback');
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">Coaching Hub</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {submissions.map(sub => (
                        <div
                            key={sub.id}
                            onClick={() => setSelectedSubmissionId(sub.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedSubmissionId === sub.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''} `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-gray-900">{sub.student}</h3>
                                {sub.status === 'reviewed' ? (
                                    <span className="text-green-600"><CheckCircle size={16} /></span>
                                ) : (
                                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Needs Review</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{sub.lesson}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock size={12} />
                                <span>{sub.timestamp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content (Review Area) */}
            <div className="flex-1 bg-gray-50 overflow-y-auto">
                {activeSubmission ? (
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{activeSubmission.lesson}</h2>
                                    <p className="text-gray-500">Submitted by <span className="font-semibold text-gray-900">{activeSubmission.student}</span></p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={16} /> {activeSubmission.timestamp}
                                </div>
                            </div>
                            <div
                                className="p-8 prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: activeSubmission.content }}
                            />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><CheckCircle size={20} /></span>
                                Feedback & Discussion
                            </h3>
                            <CommentSection
                                comments={activeSubmission.comments}
                                onAddComment={handleAddFeedback}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <ChevronRight size={32} className="text-gray-400 ml-1" />
                        </div>
                        <p className="text-lg font-medium">Select a submission to review</p>
                    </div>
                )}
            </div>
        </div>
    );
}
