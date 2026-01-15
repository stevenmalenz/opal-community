import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createPortal } from 'react-dom';
import type { Lesson } from '../types/program';
import { cn } from '../lib/utils';

interface FlashCardModalProps {
    lesson: Lesson;
    onClose: () => void;
}

export function FlashCardModal({ lesson, onClose }: FlashCardModalProps) {
    const [copied, setCopied] = React.useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleCopy = () => {
        const text = `# ${lesson.flash_card_title || lesson.title}\n\n${lesson.flash_card_content || lesson.content}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayTitle = lesson.flash_card_title || lesson.title;
    const displayContent = lesson.flash_card_content || lesson.content || '';

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-white px-6 py-5 flex items-start justify-between shrink-0 border-b border-slate-100">
                    <div className="pr-8">
                        <h2 className="text-xl sm:text-2xl font-bold leading-tight text-slate-900">{displayTitle}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors -mr-2 -mt-2"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white">
                    <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => <h3 className="text-lg font-bold mt-6 mb-3" {...props} />,
                                h2: ({ node, ...props }) => <h4 className="text-base font-bold mt-4 mb-2" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-600" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-600" {...props} />,
                                li: ({ node, ...props }) => <li className="" {...props} />,
                                code: ({ node, ...props }) => <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                                pre: ({ node, ...props }) => <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4 text-sm" {...props} />,
                            }}
                        >
                            {displayContent}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="text-xs text-slate-400 font-medium">
                        AI-Generated Summary
                    </div>
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            copied
                                ? "bg-green-100 text-green-700"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                        )}
                    >
                        {copied ? 'Copied!' : 'Copy Guide'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
