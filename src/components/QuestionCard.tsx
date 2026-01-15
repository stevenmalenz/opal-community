import React from 'react';
import { ArrowBigUp, MessageSquare, Clock, ArrowBigDown } from 'lucide-react';

interface QuestionCardProps {
    id: string;
    title: string;
    content: string;
    author: string;
    upvotes: number;
    commentCount: number;
    timestamp: string;
    onClick: () => void;
    onVote?: (value: number) => void;
}

export function QuestionCard({ title, content, author, upvotes, commentCount, timestamp, onClick, onVote }: QuestionCardProps) {
    // Truncate content for preview
    const truncatedContent = content.length > 150 ? content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : content.replace(/<[^>]*>?/gm, '');

    const handleVote = (e: React.MouseEvent, value: number) => {
        e.stopPropagation();
        if (onVote) onVote(value);
    };

    return (
        <div
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex gap-4"
            onClick={onClick}
        >
            {/* Vote Column */}
            <div className="flex flex-col items-center gap-1 min-w-[32px]">
                <button
                    onClick={(e) => handleVote(e, 1)}
                    className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-1 rounded transition-colors"
                >
                    <ArrowBigUp size={24} />
                </button>
                <span className="font-bold text-gray-700 text-sm">{upvotes}</span>
                <button
                    onClick={(e) => handleVote(e, -1)}
                    className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                >
                    <ArrowBigDown size={24} />
                </button>
            </div>

            {/* Content Column */}
            <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{title}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{truncatedContent}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                    <div className="flex items-center gap-1">
                        <span className="text-gray-900">{author}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{timestamp}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors -ml-2">
                        <MessageSquare size={14} />
                        <span>{commentCount} comments</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
