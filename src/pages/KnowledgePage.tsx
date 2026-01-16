import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Database,
    Plus,
    Globe,
    FileText,
    Trash2,
    Send,
    Bot,
    Loader2,
    Sparkles,
    UploadCloud
} from 'lucide-react';
import { generateAIResponse, scrapeUrl } from '../lib/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './KnowledgePage.css';
import { GLOBAL_SOURCES, KnowledgeSource } from '../data/knowledgeData';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

export function KnowledgePage() {
    // State - Initialize with Global Sources
    const [sources, setSources] = useState<KnowledgeSource[]>(GLOBAL_SOURCES);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: 'assistant', content: 'Hello! I am connected to your Knowledge Base. Ask me anything about your uploaded docs and scraped sites.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [showAddSource, setShowAddSource] = useState(false);
    const [processingSource, setProcessingSource] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Construct Context from Sources
            const contextBlock = sources
                .filter(s => s.status === 'ready')
                .map(s => `--- SOURCE: ${s.title} (${s.metadata}) ---\n${s.content}\n--- END SOURCE ---`)
                .join('\n\n');

            const systemPrompt = `You are an expert Knowledge Assistant for Optimizely.
            You have access to the following KNOWLEDGE BASE sources provided by the user.
            
            INSTRUCTIONS:
            1. Answer the user's question mostly using the provided sources.
            2. If the answer is found in a specific source, cite it (e.g., "According to the Optimizely Docs...").
            3. If the answer is NOT in the sources, you may use your general knowledge but mention that it's outside the provided context.
            4. Be professional, concise, and helpful.

            KNOWLEDGE BASE CONTEXT:
            ${contextBlock}
            `;

            const aiResponse = await generateAIResponse(
                [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                systemPrompt,
                false
            );

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: aiResponse.content
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: "I'm sorry, I encountered an error processing your request."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAddUrl = async () => {
        if (!urlInput.trim()) return;
        setProcessingSource(true);

        try {
            // Real scrape using the existing aiService infrastructure
            const markdown = await scrapeUrl(urlInput);

            const newSource: KnowledgeSource = {
                id: Date.now().toString(),
                type: 'url',
                title: new URL(urlInput).hostname + (new URL(urlInput).pathname.length > 1 ? new URL(urlInput).pathname : ''),
                content: markdown || "No content extracted.",
                status: 'ready',
                metadata: urlInput
            };

            setSources(prev => [...prev, newSource]);
            setUrlInput('');
            setShowAddSource(false);
        } catch (error) {
            alert('Failed to scrape URL. Please check the console.');
            console.error(error);
        } finally {
            setProcessingSource(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingSource(true);

        // Simple text simulation for now since browser-based PDF parsing is complex
        // In a real app, we'd use pdf.js or Mammoth.js
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setSources(prev => [...prev, {
                id: Date.now().toString(),
                type: 'file',
                title: file.name,
                content: typeof text === 'string' ? text : "Binary content",
                status: 'ready',
                metadata: `${(file.size / 1024).toFixed(1)} KB`
            }]);
            setProcessingSource(false);
            setShowAddSource(false);
        };

        // If it's pure text/md/json/csv, read as text
        if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            // Fallback for non-text
            setSources(prev => [...prev, {
                id: Date.now().toString(),
                type: 'file',
                title: file.name,
                content: "[Simulated Content for binary file - PDF parsing requires backend]",
                status: 'ready',
                metadata: `${(file.size / 1024).toFixed(1)} KB`
            }]);
            setProcessingSource(false);
            setShowAddSource(false);
        }
    };

    return (
        <div className="knowledge-page">
            <div className="glow-orb glow-top-left" />

            {/* Navigation */}
            <nav className="opal-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <div className="status-dot" />
                        <span>Opal <span className="logo-italic">Vanguard</span></span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/tools" className="nav-link">Tools</Link>
                        <Link to="/course" className="nav-link">AI Course</Link>
                        <Link to="/agent" className="nav-link">Agent Library</Link>
                        <Link to="/knowledge" className="nav-link active">Knowledge Base</Link>
                    </div>

                    <a href="https://optimizely.com/opal" target="_blank" rel="noopener noreferrer" className="btn-nav-apply">Get Opal</a>
                </div>
            </nav>

            {/* Main Layout */}
            <div className="knowledge-layout">
                {/* Sidebar */}
                <aside className="knowledge-sidebar">
                    <div className="sidebar-header">
                        <Database size={20} className="text-emerald-500" />
                        <h2>Knowledge Sources</h2>
                    </div>

                    <div className="sources-list">
                        {sources.map(source => (
                            <div key={source.id} className="source-item">
                                <div className="source-icon">
                                    {source.type === 'url' ? <Globe size={16} /> : <FileText size={16} />}
                                </div>
                                <div className="source-info">
                                    <div className="source-title" title={source.title}>{source.title}</div>
                                    <div className="source-meta">{source.metadata}</div>
                                </div>
                                <button
                                    className="btn-delete-source"
                                    onClick={() => setSources(s => s.filter(i => i.id !== source.id))}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="add-source-section">
                        {!showAddSource ? (
                            <button className="btn-add-source" onClick={() => setShowAddSource(true)}>
                                <Plus size={16} />
                                <span>Add Source</span>
                            </button>
                        ) : (
                            <div className="add-source-form relative">
                                <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Add New Source</h3>

                                {/* URL Input */}
                                <div className="source-input-group">
                                    <input
                                        type="text"
                                        placeholder="https://docs.optimizely.com..."
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        className="input-source"
                                    />
                                    <button
                                        className="btn-confirm-add"
                                        onClick={handleAddUrl}
                                        disabled={processingSource}
                                    >
                                        {processingSource ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    </button>
                                </div>

                                <div className="divider-text">OR</div>

                                {/* File Upload */}
                                <label className="btn-upload-file">
                                    <UploadCloud size={14} />
                                    <span>Upload Document</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.json,.csv" />
                                </label>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Chat Area */}
                <main className="knowledge-chat">
                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message-row ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'assistant' ? <Bot size={20} /> : <div className="user-avatar">U</div>}
                                </div>
                                <div className="message-bubble">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                            code: ({ node, ...props }) => <code className="bg-black/10 rounded px-1 py-0.5 text-sm" {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message-row assistant">
                                <div className="message-avatar"><Bot size={20} /></div>
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Ask a question about your knowledge base..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                disabled={isTyping}
                            />
                            <button
                                className="btn-send"
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isTyping}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="input-footer">
                            <Sparkles size={12} className="text-emerald-500" />
                            <span>Powered by Gemini 1.5 Pro (1M+ Context Window)</span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
