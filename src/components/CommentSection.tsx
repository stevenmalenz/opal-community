import { useState } from 'react';
import { Send, User, ChevronDown, ChevronUp } from 'lucide-react';

interface Comment {
    id: string;
    author: string;
    content: string;
    timestamp: string;
}

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (content: string) => void;
}

const COMMON_EMOJIS = ['👍', '🚀', '❤️', '💡', '🎉', '🔥'];

export function CommentSection({ comments, onAddComment }: CommentSectionProps) {
    const [newComment, setNewComment] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment('');
            if (!isExpanded) setIsExpanded(true); // Auto expand on post
        }
    };

    const addEmoji = (emoji: string) => {
        setNewComment(prev => prev + emoji);
    };

    return (
        <div className="mt-6 border-t border-gray-100 pt-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors group mb-4"
            >
                <div className="font-bold text-sm bg-gray-50 px-3 py-1.5 rounded-full group-hover:bg-blue-50 border border-gray-200 group-hover:border-blue-100 flex items-center gap-2 transition-all">
                    Comments ({comments.length})
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                {!isExpanded && comments.length > 0 && (
                    <span className="text-xs text-gray-400">Click to view discussion</span>
                )}
            </button>

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    {/* Comment List */}
                    <div className="flex flex-col gap-4 mb-6 pl-2">
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500 border border-gray-200">
                                    {comment.author.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg p-3 relative group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs text-gray-900">{comment.author}</span>
                                            <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                                        </div>
                                        <div
                                            className="text-gray-700 text-sm leading-snug prose prose-sm max-w-none prose-p:my-0"
                                            dangerouslySetInnerHTML={{ __html: comment.content }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <div className="text-gray-400 text-xs italic pl-2">No comments yet. Be the first!</div>
                        )}
                    </div>

                    {/* Add Comment Form */}
                    <div className="flex gap-3 items-start pl-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                            <User size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1 relative">
                            <div className="bg-white rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all overflow-hidden min-h-[80px] mb-2 shadow-sm">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add to the discussion..."
                                    className="w-full h-full p-3 text-sm focus:outline-none resize-none min-h-[80px]"
                                />
                                {/* Quick Toolbar */}
                                <div className="bg-gray-50 px-2 py-1.5 flex items-center gap-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1">
                                        {COMMON_EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => addEmoji(emoji)}
                                                className="hover:bg-gray-200 p-1 rounded text-sm transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex-1"></div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!newComment.trim()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={12} />
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
