import { useState } from 'react';
import { X, CheckCircle, Link as LinkIcon, Sparkles } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface HomeworkSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string;
    moduleId: string;
    courseId?: string;
    onSubmissionComplete: (status: string) => void;
    initialContent?: string;
    initialVideoUrl?: string;
}

export function HomeworkSubmissionModal({
    isOpen,
    onClose,
    lessonId,
    moduleId,
    courseId,
    onSubmissionComplete,
    initialContent = '',
    initialVideoUrl = ''
}: HomeworkSubmissionModalProps) {
    const { user } = useAuth();
    const [content, setContent] = useState(initialContent);
    const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
    const [questions, setQuestions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!content && !videoUrl) return;
        setIsSubmitting(true);

        try {
            const payload: any = {
                content,
                video_url: videoUrl,
                questions,
                user_id: user?.id,
                lesson_id: lessonId,
                module_id: moduleId,
                status: 'pending' // Default status
            };
            if (courseId) payload.course_id = courseId;

            // Optimistic Retry Logic for foreign key issues (handling custom courses)
            let submissionData;
            const { data, error } = await supabase.from('homework_submissions').insert(payload).select().single();

            if (error) {
                if (courseId && (error.code === '23503' || error.message.includes('foreign key constraint'))) {
                    console.warn('Foreign key error on course_id, retrying without it...');
                    delete payload.course_id;
                    const { data: retryData, error: retryError } = await supabase.from('homework_submissions').insert(payload).select().single();
                    if (retryError) throw retryError;
                    submissionData = retryData;
                } else {
                    throw error;
                }
            } else {
                submissionData = data;
            }

            // Trigger AI Grading (Mock / Client-side MVP)
            import('../lib/aiService').then(async ({ gradeHomework }) => {
                const gradeResult = await gradeHomework('Complete objective', content || videoUrl, { role: user?.user_metadata?.role });
                if (gradeResult && submissionData?.id) {
                    await supabase.from('homework_submissions').update({
                        grade: gradeResult,
                        status: 'graded',
                        feedback: gradeResult.feedback
                    }).eq('id', submissionData.id);
                    onSubmissionComplete('graded');
                } else {
                    onSubmissionComplete('pending');
                }
            });

            onSubmissionComplete('pending'); // Immediate update
            onClose();

        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to submit homework. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-indigo-500" size={20} />
                        Submit Your Work
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">My Response</label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                            <RichTextEditor content={content} onChange={setContent} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video or Link (Optional)</label>
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:bg-white focus-within:border-indigo-300 transition-colors">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400">
                                <LinkIcon size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Paste Loom, Youtube, or Drive link..."
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Questions for Reviewer</label>
                        <textarea
                            className="w-full text-sm border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            rows={2}
                            placeholder="Stuck on something? Ask here..."
                            value={questions}
                            onChange={e => setQuestions(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!content && !videoUrl)}
                        className="btn-primary flex items-center gap-2 px-6"
                    >
                        {isSubmitting ? (
                            <>Submitting...</>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Submit Homework
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
