import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuestionCard } from '../components/QuestionCard';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useProgram } from '../context/ProgramContext';

// Mock data for initial dev


export function QAPage() {
    const navigate = useNavigate();
    const { currentProgram } = useProgram();
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        fetchQuestions();
    }, [currentProgram?.id]);

    const fetchQuestions = async () => {
        try {
            let query = supabase
                .from('questions')
                .select(`
                    *,
                    profiles:user_id ( full_name, email ),
                    comments ( count )
                `)
                .order('created_at', { ascending: false });

            // Filter by current program if available
            if (currentProgram?.id) {
                query = query.eq('course_id', currentProgram.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formatted = data.map(q => ({
                id: q.id,
                title: q.title,
                content: q.content,
                author: q.profiles?.full_name || q.profiles?.email || 'Unknown User',
                upvotes: q.upvotes || 0,
                commentCount: q.comments?.[0]?.count || 0,
                timestamp: formatDistanceToNow(new Date(q.created_at), { addSuffix: true })
            }));
            setQuestions(formatted);
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Community Q&A</h1>
                    <p className="text-gray-500 mt-1">Ask questions, share knowledge, and learn from peers.</p>
                </div>
                <button
                    onClick={() => navigate('/app/qa/new')}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                >
                    <Plus size={20} />
                    Ask Question
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading questions...</div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to ask the community!</p>
                        <button
                            onClick={() => navigate('/app/qa/new')}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-gray-200 font-medium hover:bg-gray-50"
                        >
                            Ask a Question
                        </button>
                    </div>
                ) : (
                    questions.map(q => (
                        <QuestionCard
                            key={q.id}
                            {...q}
                            onClick={() => navigate(`/app/qa/${q.id}`)}
                            onVote={async (val) => {
                                try {
                                    const { error } = await supabase.rpc('vote_question', { q_id: q.id, value: val });
                                    if (error) throw error;
                                    fetchQuestions(); // Refresh to see new count
                                } catch (err) {
                                    console.error('Vote failed', err);
                                    alert('Failed to vote');
                                }
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
