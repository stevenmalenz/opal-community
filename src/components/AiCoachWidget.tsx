import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2, GraduationCap, Swords, Zap, ChevronDown, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAIResponse } from '../lib/aiService';
import { ACTIVE_LEARNING_PROMPTS } from '../lib/prompts';
import { useProgram } from '../context/ProgramContext';
import { useAuth } from '../context/AuthContext';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    type?: 'text' | 'options';
    options?: { label: string; action: string; mode: 'TEACH' | 'DEBATE' | 'QUIZ' }[];
    timestamp?: number;
}

export function AiCoachWidget() {
    const [isOpen, setIsOpen] = useState(false);
    // Load from localStorage or default
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('ai_coach_messages');
        return saved ? JSON.parse(saved) : [];
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState<'TEACH' | 'DEBATE' | 'QUIZ' | null>(null);

    // Preview State (Intercom-style bubbles)
    const [showPreview, setShowPreview] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<string | null>(null);
    const [previewPills, setPreviewPills] = useState<{ label: string; mode: 'TEACH' | 'DEBATE' | 'QUIZ'; icon: any }[] | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const { getLesson, currentProgram } = useProgram();
    const { user } = useAuth();
    const lastLessonIdRef = useRef<string | null>(null);
    const hasWelcomedRef = useRef(false);

    // Persist messages
    useEffect(() => {
        localStorage.setItem('ai_coach_messages', JSON.stringify(messages));
    }, [messages]);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowPreview(false); // Hide preview when open
        }
    }, [messages, isOpen]);

    // 1. Welcome Back Logic (Run once on mount)
    useEffect(() => {
        // Only welcome if history is empty OR it's been a while? 
        // For now, let's just welcome if history is empty.
        if (!hasWelcomedRef.current && user && messages.length === 0) {
            const welcomeMsg = `Hi ${user.email?.split('@')[0] || 'Friend'}! 👋 I'm your Study Buddy. Ready to learn something new?`;
            const msg: Message = { role: 'assistant', content: welcomeMsg, timestamp: Date.now() };
            setMessages([msg]);
            setPreviewMessage(welcomeMsg);
            setShowPreview(true);
            hasWelcomedRef.current = true;

            // Auto-hide preview after 8s
            setTimeout(() => {
                if (!isOpen) setShowPreview(false);
            }, 8000);
        }
    }, [user, isOpen, messages.length]);

    // 2. Context Awareness: Detect when entering a lesson
    useEffect(() => {
        console.log("AiCoachWidget: Location changed", location.pathname);

        // Path format: /app/program/:pid/lesson/:mid/:lid OR /program/:pid/lesson/:mid/:lid
        // The router definition is: path="/app/program/:programId/lesson/:moduleId/:lessonId"
        // So we need to match that.
        const match = location.pathname.match(/\/program\/([^/]+)\/lesson\/([^/]+)\/([^/]+)/);

        if (match) {
            const [_, programId, moduleId, lessonId] = match;
            console.log("AiCoachWidget: Match found", { programId, moduleId, lessonId });

            // Avoid triggering multiple times for the same lesson
            if (lastLessonIdRef.current === lessonId) return;
            lastLessonIdRef.current = lessonId;

            const lesson = getLesson(programId, moduleId, lessonId);
            console.log("AiCoachWidget: Lesson found", lesson);

            if (lesson) {
                // Set Preview State (Pills)
                setPreviewMessage(`I'm ready to help you master **${lesson.title}**.`);
                setPreviewPills([
                    { label: 'Teach It', mode: 'TEACH', icon: GraduationCap },
                    { label: 'Debate It', mode: 'DEBATE', icon: Swords },
                    { label: 'Quiz Me', mode: 'QUIZ', icon: Zap }
                ]);
                setShowPreview(true);

                // Also add to chat history so it's there when they open it
                const proactiveMsg: Message = {
                    role: 'assistant',
                    content: `I see you're starting **${lesson.title}**. How would you like to tackle this?`,
                    type: 'options',
                    options: [
                        { label: 'Teach It', action: 'Explain it to me', mode: 'TEACH' },
                        { label: 'Debate It', action: 'Challenge my views', mode: 'DEBATE' },
                        { label: 'Quiz Me', action: 'Test my knowledge', mode: 'QUIZ' }
                    ],
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, proactiveMsg]);
            }
        } else {
            console.log("AiCoachWidget: No match for lesson path");
            // Reset if leaving lesson
            lastLessonIdRef.current = null;
            setPreviewPills(null);
            // Don't hide preview immediately, let it linger or replace with generic
        }
    }, [location.pathname, getLesson]);

    // Helper to get user context
    const getUserContext = () => {
        if (!currentProgram) return '';

        const completedLessons = currentProgram.learningPath
            .flatMap(m => m.lessons)
            .filter(l => l.completed)
            .map(l => l.title);

        const currentLesson = getCurrentLesson();

        return `
User Context:
- Completed Lessons: ${completedLessons.length > 0 ? completedLessons.join(', ') : 'None yet'}
- Current Lesson: ${currentLesson ? currentLesson.title : 'None'}
- User Name: ${user?.email?.split('@')[0] || 'Student'}
`;
    };

    const handleModeSelect = async (mode: 'TEACH' | 'DEBATE' | 'QUIZ', lessonContent: string) => {
        setIsOpen(true); // Ensure open
        setCurrentMode(mode);
        setLoading(true);
        setShowPreview(false);

        // Add user selection as a message
        const modeLabels = { TEACH: 'I want to Teach It', DEBATE: 'I want to Debate It', QUIZ: 'Quiz Me' };
        setMessages(prev => [...prev, { role: 'user', content: modeLabels[mode], timestamp: Date.now() }]);

        const context = getUserContext();
        const systemPrompt = `${ACTIVE_LEARNING_PROMPTS[mode](lessonContent)}\n\n${context}`;

        try {
            // Seed the conversation
            const response = await generateAIResponse(
                [{ role: 'user', content: "Start the session." }],
                systemPrompt,
                false // No JSON
            );

            if (response && response.content) {
                setMessages(prev => [...prev, { role: 'system', content: systemPrompt }, { role: 'assistant', content: response.content!, timestamp: Date.now() }]);
            }
        } catch (error) {
            console.error("Failed to start chat:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again.", timestamp: Date.now() }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // If we are in a mode, use that system prompt. If not, just generic chat?
            // For now, assume we are in a mode if one is selected.
            // If no mode, maybe just generic helper?
            let systemPrompt = undefined;
            if (currentMode) {
                // We need the current lesson content... 
                // This is tricky if we don't store it. 
                // For now, let's assume the system prompt is already in the history (as a hidden system message)
                // generateAIResponse doesn't take history with system messages well if we pass systemPrompt arg.
                // Let's find the last system prompt in messages
                const lastSystem = [...messages].reverse().find(m => m.role === 'system');
                if (lastSystem) systemPrompt = lastSystem.content;
            } else {
                // Generic chat context
                systemPrompt = `You are a helpful, friendly AI Study Buddy. You help the user learn. Be concise and encouraging. ${getUserContext()}`;
            }

            // Filter history
            const history = messages.filter(m => m.role !== 'system' && m.type !== 'options').map(m => ({ role: m.role, content: m.content }));
            history.push({ role: 'user', content: userMsg.content });

            const response = await generateAIResponse(history, systemPrompt, false);

            if (response && response.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.content!, timestamp: Date.now() }]);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = () => {
        if (confirm('Are you sure you want to clear your chat history?')) {
            setMessages([]);
            localStorage.removeItem('ai_coach_messages');
            hasWelcomedRef.current = false; // Allow welcome message again
        }
    };

    // Helper to get current lesson content for the mode select
    const getCurrentLesson = () => {
        const match = location.pathname.match(/\/program\/([^/]+)\/lesson\/([^/]+)\/([^/]+)/);
        if (match) {
            const [_, programId, moduleId, lessonId] = match;
            return getLesson(programId, moduleId, lessonId);
        }
        return null;
    };

    return createPortal(
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>

            {/* Preview Bubbles (Intercom Style) */}
            {!isOpen && showPreview && (
                <div className="animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col items-end gap-2 mb-2">
                    {/* Message Bubble */}
                    {previewMessage && (
                        <div style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '1rem',
                            borderBottomRightRadius: '0.25rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            maxWidth: '280px',
                            fontSize: '0.9rem',
                            color: '#1f2937',
                            border: '1px solid #e5e7eb',
                            marginBottom: '0.5rem',
                            position: 'relative' // Added for positioning the close button
                        }}>
                            <div className="prose prose-sm max-w-none text-gray-800">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {previewMessage}
                                </ReactMarkdown>
                            </div>
                            {/* Close preview X */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}
                                style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', background: 'white', borderRadius: '50%', border: '1px solid #e5e7eb', padding: '0.25rem', cursor: 'pointer', color: '#6b7280' }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Pills - Vertical Stack */}
                    {previewPills && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            {previewPills.map((pill, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        const lesson = getCurrentLesson();
                                        if (lesson) handleModeSelect(pill.mode, lesson.content);
                                    }}
                                    style={{
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        border: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <pill.icon size={14} />
                                    {pill.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: '380px',
                    height: '600px',
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <Bot size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: '700', fontSize: '1rem', margin: 0 }}>Study Buddy 🤖</h3>
                                <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Always here to help</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={handleClearHistory} title="Clear History" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}>
                                <Trash2 size={20} />
                            </button>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}>
                                <ChevronDown size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.85rem', // Smaller font
                                    lineHeight: '1.5',
                                    backgroundColor: msg.role === 'user' ? '#2563eb' : 'white',
                                    color: msg.role === 'user' ? 'white' : '#1f2937',
                                    borderTopRightRadius: msg.role === 'user' ? '0' : '1rem',
                                    borderTopLeftRadius: msg.role === 'user' ? '1rem' : '0',
                                    border: msg.role === 'user' ? 'none' : '1px solid #e5e7eb',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
                                                ul: ({ node, ...props }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }} {...props} />,
                                                ol: ({ node, ...props }) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }} {...props} />,
                                                li: ({ node, ...props }) => <li style={{ margin: '0.2rem 0' }} {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Options (if any) */}
                                {msg.type === 'options' && msg.options && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {msg.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const lesson = getCurrentLesson();
                                                    if (lesson) handleModeSelect(opt.mode, lesson.content);
                                                }}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '2rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {opt.mode === 'TEACH' && <GraduationCap size={14} className="text-blue-600" />}
                                                {opt.mode === 'DEBATE' && <Swords size={14} className="text-purple-600" />}
                                                {opt.mode === 'QUIZ' && <Zap size={14} className="text-amber-600" />}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{ backgroundColor: 'white', padding: '0.75rem 1rem', borderRadius: '1rem', borderTopLeftRadius: '0', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                    <Loader2 size={16} className="animate-spin" />
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: '1rem', backgroundColor: 'white', borderTop: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.75rem',
                                    outline: 'none',
                                    fontSize: '0.875rem',
                                    color: '#111827'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                    opacity: loading || !input.trim() ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button - White with Blue Icon */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '9999px',
                        backgroundColor: 'white',
                        color: '#2563eb',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Bot size={28} />
                </button>
            )}
        </div>,
        document.body
    );
}
