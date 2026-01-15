import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuth } from '../context/AuthContext';
import { useProgram } from '../context/ProgramContext';

export function AskQuestionPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentProgram } = useProgram();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            // Get user's org_id from profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (!profile?.org_id) throw new Error('No organization found');

            const { error } = await supabase
                .from('questions')
                .insert({
                    title,
                    content,
                    user_id: user?.id,
                    org_id: profile.org_id,
                    course_id: currentProgram?.id
                });

            if (error) throw error;

            navigate('/app/qa');
        } catch (error: any) {
            console.error('Error creating question:', error);
            alert(`Failed to post question: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Ask a Question</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., How do I implement Stripe Webhooks?"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Details
                    </label>
                    <div className="h-[400px]">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Describe your question in detail..."
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || !content.trim()}
                        className="btn-primary flex items-center gap-2 px-6 py-3 text-lg"
                    >
                        {isSubmitting ? 'Posting...' : (
                            <>
                                <Send size={20} />
                                Post Question
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
