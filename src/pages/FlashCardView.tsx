
import { useParams, useNavigate } from 'react-router-dom';
import { useProgram } from '../context/ProgramContext';
import { ArrowLeft, BookOpen, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function FlashCardView() {
    const { moduleId, lessonId } = useParams();
    const { currentProgram, loading } = useProgram();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!currentProgram) return <div>Program not found</div>;

    const module = currentProgram.learningPath.find(m => m.id === moduleId);
    const lesson = module?.lessons.find(l => l.id === lessonId);

    if (!lesson) return <div>Lesson not found</div>;

    // Use flash card content if available, otherwise fallback to full content
    const displayContent = lesson.flash_card_content || lesson.content || '';
    const displayTitle = lesson.flash_card_title || lesson.title;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <button
                    onClick={() => navigate('/app/library')}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back to Guides</span>
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">{module?.title}</span>
                </div>
            </div>

            {/* Main Content - Centered Card */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ minHeight: '60vh' }}>

                    {/* Card Header */}
                    <div className="bg-indigo-600 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4 opacity-80">
                            <BookOpen size={20} />
                            <span className="text-sm font-medium uppercase tracking-wider">Quick Guide</span>
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">{displayTitle}</h1>
                    </div>

                    {/* Card Body */}
                    <div className="p-8 flex-1 overflow-y-auto prose prose-slate max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-4 text-indigo-900" {...props} />,
                                h2: ({ node, ...props }) => <h3 className="text-lg font-bold mt-5 mb-3 text-slate-800" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                                code: ({ node, ...props }) => <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                                pre: ({ node, ...props }) => <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                            }}
                        >
                            {displayContent}
                        </ReactMarkdown>
                    </div>

                    {/* Card Footer */}
                    <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between items-center text-sm text-slate-500">
                        <span>{lesson.duration} read</span>
                        <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                            <Share2 size={16} />
                            Share Guide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
