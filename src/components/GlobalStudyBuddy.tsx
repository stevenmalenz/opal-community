import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, Trash2, Sparkles } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useProgram } from '../context/ProgramContext';
import { SmartSuggestions } from './SmartSuggestions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
// Removed unused imports: FirecrawlService, aiService, supabase, useAuth

export function GlobalStudyBuddy() {
    const location = useLocation();
    // Removed unused hooks: useNavigate, useSearchParams

    const {
        messages,
        sendMessage,
        addMessage,
        isTyping,
        isSidebarOpen,
        setIsSidebarOpen,
        dismissProactiveMessage,
        inputFocus,
        setInputFocus,
        resetConversation
    } = useChat();
    const { currentProgram } = useProgram(); // Removed refreshProgram
    // Removed useAuth

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    // Standard Chat Logic
    useEffect(() => {
        setMounted(true);
        setShowPreview(true);
    }, []);

    const handleWidgetAction = (action: string, data: any) => {
        if (action === 'confirm_build') {
            console.warn("Confirm build action triggered, but building logic is removed from GlobalStudyBuddy.");
        } else if (action === 'questions_answered') {
            const answersText = Object.entries(data).map(([key, value]) => `**${key}:** ${value}`).join('\n');

            addMessage({
                id: Date.now(),
                sender: 'user',
                type: 'text',
                content: `Here is the context:\n${answersText}`
            });

            setTimeout(() => {
                addMessage({
                    id: Date.now() + 1,
                    sender: 'ai',
                    type: 'text',
                    content: "Perfect. I have everything I need to build a high-impact course for you."
                });

                addMessage({
                    id: Date.now() + 2,
                    sender: 'system',
                    type: 'widget',
                    content: {
                        label: "Build Learning Path",
                        action: 'confirm_build',
                        data: {}
                    }
                });
            }, 1000);
        }
    };

    // Removed handleConfirmBuild (unused)

    useEffect(() => {
        if (inputFocus && inputRef.current) {
            inputRef.current.focus();
            setInputFocus(false);
        }
    }, [inputFocus, setInputFocus]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isSidebarOpen) {
            scrollToBottom();
        }
    }, [messages, isSidebarOpen]);

    const excludedPaths = ['/app/manager', '/app/coaching', '/app/admin', '/app/settings'];
    const shouldShow = location.pathname.includes('/app') && !excludedPaths.some(path => location.pathname.startsWith(path));
    const isLesson = location.pathname.includes('/lesson/');
    let lessonTitle = '';

    if (isLesson && currentProgram) {
        const parts = location.pathname.split('/');
        const lessonId = parts[parts.length - 1];
        const moduleId = parts[parts.length - 2];
        const module = currentProgram.learningPath.find(m => m.id === moduleId);
        const lesson = module?.lessons.find(l => l.id === lessonId);
        if (lesson) lessonTitle = lesson.title;
    }

    if (!shouldShow || !mounted) return null;

    const handleSendMessage = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return createPortal(
        <>
            <div
                className={cn(
                    "fixed bottom-32 right-6 w-[380px] bg-white shadow-2xl rounded-2xl transition-all duration-300 ease-in-out z-[100] flex flex-col border border-slate-200 overflow-hidden",
                    isSidebarOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-10 pointer-events-none h-0"
                )}
                style={{ maxHeight: 'calc(100vh - 140px)', height: '600px' }}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                <img src="/cat-vr.jpg" alt="Paw-fessor" className="w-full h-full object-cover rounded-full" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Paw-fessor</h3>
                            <p className="text-xs text-slate-500">Always here to help</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={resetConversation} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors" title="Clear Chat">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👋</span>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-2">Hi there!</h4>
                            <p className="text-sm text-slate-500">
                                I'm your AI study companion. Ask me anything about your lessons.
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* Widget Message Render */}
                            {msg.type === 'widget' ? (
                                <div className="w-full max-w-[90%]">
                                    <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-700">
                                            <Sparkles size={16} />
                                            <span className="font-semibold text-sm">Action Required</span>
                                        </div>
                                        {msg.content.action === 'confirm_build' && (
                                            <button
                                                onClick={() => handleWidgetAction(msg.content.action, msg.content.data)}
                                                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                            >
                                                {msg.content.label}
                                                <Sparkles size={14} />
                                            </button>
                                        )}
                                        {msg.content.action === 'clarifying_questions' && (
                                            <ClarifyingQuestionsWidget
                                                questions={msg.content.data}
                                                onComplete={(answers) => handleWidgetAction('questions_answered', answers)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Normal Text Message */
                                <div className={cn(
                                    "max-w-[90%] p-3 rounded-2xl text-sm shadow-sm",
                                    msg.sender === 'user'
                                        ? "bg-emerald-600 text-white rounded-tr-sm"
                                        : "bg-white text-slate-700 border border-slate-200 rounded-tl-sm"
                                )}>
                                    <div className={cn("prose prose-sm max-w-none break-words chat-message-content", msg.sender === 'user' ? "prose-invert [&_*]:text-white" : "prose-slate")}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p style={{ marginBottom: '0.75rem' }} {...props} />,
                                                ul: ({ node, ...props }) => <ul style={{ marginBottom: '0.75rem', paddingLeft: '1.25rem', listStyleType: 'disc' }} {...props} />,
                                                ol: ({ node, ...props }) => <ol style={{ marginBottom: '0.75rem', paddingLeft: '1.25rem', listStyleType: 'decimal' }} {...props} />,
                                                li: ({ node, ...props }) => <li style={{ marginBottom: '0.25rem' }} {...props} />
                                            }}
                                        >
                                            {typeof msg.content === 'string' ? msg.content : ''}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className=" text-slate-400 rounded-2xl rounded-tl-none py-2 px-4 text-xs font-medium flex items-center gap-1 shadow-sm">
                                <span className="animate-pulse" style={{ animationDelay: '0ms' }}>●</span>
                                <span className="animate-pulse" style={{ animationDelay: '300ms' }}>●</span>
                                <span className="animate-pulse" style={{ animationDelay: '600ms' }}>●</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200 transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Pills / Context Bubble */}
            {!isSidebarOpen && (
                <div className="fixed bottom-28 right-10 flex flex-col items-end gap-2 z-[90]">
                    {isLesson && lessonTitle ? (
                        <>
                            {showPreview && (
                                <div className="bg-white p-4 rounded-2xl rounded-br-sm shadow-xl border border-emerald-100 animate-in slide-in-from-bottom-4 fade-in duration-500 max-w-[280px] mb-2 relative group">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowPreview(false);
                                        }}
                                        className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Welcome to <span className="font-semibold text-emerald-600">{lessonTitle}</span>. I'm ready to help you master this.
                                    </p>
                                </div>
                            )}
                            <SmartSuggestions mode="floating" />
                        </>
                    ) : (
                        <SmartSuggestions mode="floating" />
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => {
                    setIsSidebarOpen(!isSidebarOpen);
                    dismissProactiveMessage();
                }}
                className="fixed bottom-10 right-10 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-[110] group pointer-events-auto"
            >
                <div className="absolute inset-0 bg-emerald-600 group-hover:bg-emerald-700 transition-colors rounded-full" />
                <div className="relative z-10 w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center ">
                    <img src="/cat-vr.jpg" alt="Chat" className="w-full h-full object-cover rounded-full" />
                </div>
            </button>
        </>,
        document.body
    );
}

function ClarifyingQuestionsWidget({ questions, onComplete }: { questions: any[], onComplete: (answers: any) => void }) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="text-center p-2 text-green-600 bg-green-50 rounded-lg text-sm">
                Thanks! Context received.
            </div>
        );
    }

    const allAnswered = questions.every(q => answers[q.id]);

    return (
        <div className="space-y-4">
            {questions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{q.text}</label>
                    <div className="flex flex-wrap gap-2">
                        {q.options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                className={cn(
                                    "px-3 py-1.5 text-xs rounded-lg border transition-all",
                                    answers[q.id] === opt
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                                )}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <button
                onClick={() => {
                    setSubmitted(true);
                    onComplete(answers);
                }}
                disabled={!allAnswered}
                className="w-full mt-2 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                Submit Context
            </button>
        </div>
    );
}
