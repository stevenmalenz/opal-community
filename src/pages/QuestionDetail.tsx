import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowBigUp, ArrowBigDown, Clock, MessageSquare, Share2, MoreHorizontal, Trash2, Edit2, X, Check } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { CommentSection } from '../components/CommentSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';


export function QuestionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [question, setQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');

    React.useEffect(() => {
        if (id) fetchQuestion();
    }, [id]);

    const fetchQuestion = async () => {
        try {
            const { data, error } = await supabase
                .from('questions')
                .select(`
                    *,
                    profiles:user_id ( full_name, email ),
                    comments (
                        id, content, created_at, user_id,
                        profiles:user_id ( full_name, email )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const formatted = {
                id: data.id,
                title: data.title,
                content: data.content,
                user_id: data.user_id, // Store user_id for permission check
                author: data.profiles?.full_name || data.profiles?.email || 'Unknown User',
                upvotes: data.upvotes || 0,
                timestamp: formatDistanceToNow(new Date(data.created_at), { addSuffix: true }),
                comments: data.comments?.map((c: any) => ({
                    id: c.id,
                    content: c.content,
                    user_id: c.user_id,
                    author: c.profiles?.full_name || c.profiles?.email || 'Unknown User',
                    timestamp: formatDistanceToNow(new Date(c.created_at), { addSuffix: true })
                })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
            };

            setQuestion(formatted);
            setEditTitle(data.title);
            setEditContent(data.content);
        } catch (error) {
            console.error('Error fetching question:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigate('/app/qa');

    // Delete Question
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this question? This cannot be undone.')) return;

        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);
            if (error) throw error;
            navigate('/app/qa');
        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Failed to delete question');
        }
    };

    // Update Question
    const handleUpdate = async () => {
        try {
            const { error } = await supabase
                .from('questions')
                .update({
                    title: editTitle,
                    content: editContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            setIsEditing(false);
            fetchQuestion();
        } catch (error) {
            console.error('Error updating question:', error);
            alert('Failed to update question');
        }
    };

    const handleAddComment = async (content: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    question_id: id,
                    user_id: user?.id,
                    content
                });

            if (error) throw error;
            fetchQuestion(); // Refresh to show new comment
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!question) return <div className="p-8 text-center">Question not found</div>;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft size={20} />
                Back to Q&A
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex">
                    {/* Vote Sidebar */}
                    <div className="w-16 bg-gray-50 border-r border-gray-100 flex flex-col items-center py-6 gap-2">
                        <button className="text-gray-400 hover:text-orange-500 hover:bg-orange-100 p-1.5 rounded transition-colors">
                            <ArrowBigUp size={32} />
                        </button>
                        <span className="font-bold text-gray-800 text-lg">{question.upvotes}</span>
                        <button className="text-gray-400 hover:text-blue-500 hover:bg-blue-100 p-1.5 rounded transition-colors">
                            <ArrowBigDown size={32} />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8">
                        {/* Meta Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="font-medium text-gray-900">{question.author}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{question.timestamp}</span>
                                </div>
                            </div>

                            {user?.id === question.user_id && (
                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Question"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Question"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Cancel Edit"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4 mb-8">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none py-2"
                                    placeholder="Question Title"
                                />
                                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden min-h-[200px]">
                                    <RichTextEditor
                                        content={editContent}
                                        onChange={setEditContent}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="btn-primary px-4 py-2 flex items-center gap-2"
                                    >
                                        <Check size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{question.title}</h1>

                                <div className="prose prose-blue max-w-none text-gray-800 mb-8">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {question.content}
                                    </ReactMarkdown>
                                </div>
                            </>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
                            <button className="flex items-center gap-2 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                                <MessageSquare size={18} />
                                <span className="font-medium">{question.comments.length} Comments</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Share2 size={18} />
                                <span className="font-medium">Share</span>
                            </button>
                            <div className="flex-1"></div>
                            <button className="text-gray-400 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CommentSection
                comments={question.comments}
                onAddComment={handleAddComment}
            />
        </div>
    );
}
