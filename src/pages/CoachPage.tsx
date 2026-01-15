import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgram } from '../context/ProgramContext';
import { createPersonalizedCourse } from '../lib/courseGenerator';
import { Send, Sparkles, User, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import './CoachPage.css';

interface Message {
    id: string;
    sender: 'user' | 'coach' | 'sys';
    content: string;
    timestamp: string; // Changed to string for serialization
    type?: 'text' | 'plan_preview';
    plan?: any;
    isError?: boolean;
    citations?: { url: string; title: string }[];
}

export function CoachPage() {
    // ⚠️ DEPRECATION NOTICE: 
    // This page is being phased out in favor of the GlobalStudyBuddy ("Paw-fessor"). 
    // We are keeping it for now for deep-dive planning scenarios, but primary user flow should use the Global Buddy.

    const { user } = useAuth();
    const { refreshProgram } = useProgram();
    const navigate = useNavigate();
    const location = useLocation() as any;
    const messagingInitialized = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Context Management
    const [scrapedContext, setScrapedContext] = useState<{ url: string, content: string }[]>([]);
    const [suggestedUrls, setSuggestedUrls] = useState<string[]>([]);
    const [isScraping, setIsScraping] = useState<string | null>(null);

    // Initialize from localStorage
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('coach_messages');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) { console.error("Failed to parse saved chat", e); }
        }
        return [{
            id: '1',
            sender: 'coach',
            content: "Hi! I'm your Learning Coach. I'm here to help you build a personalized study plan. What specific topic or skill are you looking to master today?",
            timestamp: new Date().toISOString()
        }];
    });

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('coach_messages', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    // Handle Onboarding Context
    useEffect(() => {
        if (location.state?.mode === 'onboarding') {

            // If we haven't processed this onboarding session yet, CLEAR everything to start fresh
            if (!messagingInitialized.current) {
                console.log("🚀 Starting fresh Onboarding Session...");

                // Clear state
                const freshMessages: Message[] = []; // Explicitly empty

                // Clear Context
                setScrapedContext([]);
                setSuggestedUrls([]);

                // 1. Add System Message
                const sysMsg: Message = {
                    id: Date.now().toString(),
                    sender: 'sys',
                    content: `🚀 **Onboarding Context Received**\nTarget URL: ${location.state.url}\nGoal: ${location.state.context}`,
                    timestamp: new Date().toISOString()
                };
                freshMessages.push(sysMsg);
                setMessages([sysMsg]); // Force set to just this

                messagingInitialized.current = true;
                const { url, context } = location.state;

                // 2. Trigger initial analysis (simulate user input to start the flow)
                setTimeout(() => {
                    // This timeout ensures we don't conflict with the state update above
                    // But we need to make sure we append to the FRESH state, not the old state

                    const initMsg = `I've just onboarded. I want to learn about ${url}. My goal is: ${context}. Please research this and ask me about my specific role so we can build a plan.`;
                    const userMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        sender: 'user',
                        content: initMsg,
                        timestamp: new Date().toISOString()
                    };

                    // Use functional update to ensure we append to current state (which should be just sysMsg or close to it)
                    setMessages(prev => [...prev, userMsg]);

                    // Trigger AI
                    processAIInteraction(initMsg, url, context);
                }, 1000);

                // 3. Auto-Trigger Scrape for the onboarding URL (Instead of suggesting it)
                if (url) {
                    // We need to wait a moment for the initial messages to settle?
                    // Or just trigger it. handleScrape appends messages.
                    setTimeout(() => {
                        handleScrape(url);
                    }, 2000);
                }
            }
        }
    }, [location.state]);

    const processAIInteraction = async (userContent: string, onboardUrl?: string, onboardContext?: string) => {
        setLoading(true);
        try {
            // Prepare history (include system prompt with special context if onboarding)
            const history = messages.filter(m => !m.isError && m.sender !== 'sys').map(m => ({
                role: m.sender === 'coach' ? 'assistant' : 'user',
                content: m.content
            }));
            history.push({ role: 'user', content: userContent });

            let contextInjection = "";
            if (scrapedContext.length > 0) {
                contextInjection = `\n\n[AVAILABLE CONTEXT FROM CRAWLED DOMAIN]:\n${scrapedContext.map(s => `BASE URL: ${s.url}\nCONTENT:\n${s.content.substring(0, 50000)}...`).join('\n\n')}\n\n`;
            } else if (onboardUrl) {
                contextInjection = `\n\n[ONBOARDING TARGET]: The user wants to learn about ${onboardUrl}. I am currently analyzing it.`;
            }

            const sysPrompt = `You are an expert Learning Coach. Your goal is to help the user create a personalized Learning Path.
                    
            ${contextInjection}
            ${onboardContext ? `User GoalContext: ${onboardContext}` : ''}

            CAPABILITIES:
            - You have access to real-time Google Search. Use it implicitly when you need current facts, industry standards, or wider context.
            - You have access to the crawled content (if provided above).
            
            TOOLS AVAILABLE (Explicit):
            1. [RESEARCH: <topic>] -> Use this ONLY if the user mentions a specific tool/doc URL that you need to crawl deeply (and haven't yet).
            2. [GENERATE_PATH] { ... } -> Use this only when you have confirmed the user's Goal, Level, Role, AND you have sufficient context.
            3. [SUGGEST_LINKS: ["url1", "url2"]] -> Use this to suggest specific documentation URLs to the user if they need to provide more context.

            PROTOCOL:
            1. **DO NOT TEACH YET.** Do not explain concepts, write code, or give tutorials in this phase. Your ONLY goal is to build the Curriculum Plan.
            2. If having context, ask the user to confirm their specific Role (e.g. "Are you a Beginner Builder or an Admin?") and Desired Outcome.
            3. If you need more documentation to build a good plan, use [SUGGEST_LINKS] or ask the user for a URL.
            4. Once you have context + Role + Outcome, generate the path.
            
            JSON PARAMS for GENERATE_PATH:
            { "goal": "...", "role": "...", "outcome": "...", "level": "...", "time": "..." }

            IMPORTANT: If you output JSON (like for GENERATE_PATH), put it in a separate block. I will hide it from the user.
            `;

            const fullHistory = [{ role: 'system', content: sysPrompt }, ...history];

            // Call AI
            const { generateAIResponse } = await import('../lib/aiService');
            const response = await generateAIResponse(fullHistory as any, undefined, false, true); // useSearch = true

            if (response.content) {
                // Extract grounding/citations matches
                const citations: { url: string; title: string }[] = [];
                if (response.groundingMetadata?.groundingChunks) {
                    response.groundingMetadata.groundingChunks.forEach((chunk: any) => {
                        if (chunk.web?.uri) {
                            citations.push({
                                url: chunk.web.uri,
                                title: chunk.web.title || chunk.web.uri
                            });
                        }
                    });
                }

                // Deduplicate citations
                const uniqueCitations = Array.from(new Map(citations.map(item => [item.url, item])).values());

                await handleAIResponse(response.content, uniqueCitations);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Extracted response handler to reuse in useEffect and handleSend
    const handleAIResponse = async (response: string, citations: { url: string, title: string }[] = []) => {
        // 1. Hide JSON_OUTPUT or raw JSON blocks intended for the system
        // Regex to find large JSON blocks that look like the params
        const jsonBlockRegex = /```json\s*({[\s\S]*?})\s*```/i;
        const inlineJsonRegex = /JSON_OUTPUT:\s*({[\s\S]*?})/i;

        let displayContent = response;
        let hiddenParams: any = null;

        // Try to extract JSON but keep it hidden
        const jsonMatch = response.match(jsonBlockRegex) || response.match(inlineJsonRegex);
        if (jsonMatch) {
            try {
                hiddenParams = JSON.parse(jsonMatch[1]);
                // Remove the JSON from the display content
                displayContent = displayContent.replace(jsonMatch[0], '').trim();
            } catch (e) { console.error("Failed to parse hidden JSON", e); }
        }

        // Check for triggers in the REMAINING content or the original (triggers might be outside JSON)
        const researchMatch = response.match(/\[RESEARCH:\s*(.*?)\]/i);
        const searchMatch = response.match(/\[SEARCH_GOOGLE:\s*(.*?)\]/i);
        const suggestMatch = response.match(/\[SUGGEST_LINKS:\s*(.*?)\]/i);
        const generateMatch = response.includes("[GENERATE_PATH]") || (hiddenParams && (hiddenParams.goal || hiddenParams.role)); // Fallback if it just outputted JSON without the tag

        if (researchMatch) {
            const topic = researchMatch[1];
            const cleanResponse = displayContent.replace(researchMatch[0], '').trim();
            if (cleanResponse) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'coach',
                    content: cleanResponse,
                    timestamp: new Date().toISOString(),
                    citations
                }]);
            }

            setMessages(prev => [...prev, {
                id: 'searching',
                sender: 'sys',
                content: `🔍 Searching for documentation about "${topic}"...`,
                timestamp: new Date().toISOString()
            }]);

            const { searchResources } = await import('../lib/aiService');
            const urls = await searchResources(topic);

            if (urls.length > 0) {
                // Instead of setting sticky state, just add a system message with buttons
                setMessages(prev => [...prev, {
                    id: (Date.now() + 2).toString(),
                    sender: 'sys',
                    content: `Found resources for **${topic}**. Click to add context:`,
                    timestamp: new Date().toISOString()
                }]);
                // We'll handle the "Click to add" by rendering a special message type or just hacking the content for now.
                // For simplicity, let's just scrape the first one automatically or list them as text?
                // The user wanted "Suggestions to flow".
                // Let's repurpose 'suggestedUrls' to be ephemeral or handled differently?
                // Actually, let's make a new message type "suggestions"?
                // For now, let's just set the state, but we REMOVED the sticky UI.
                // So we need to render the suggestions IN THE LIST.

                setSuggestedUrls(urls);
                // Wait, if we removed the sticky block, where does 'suggestedUrls' render?
                // We need to render it inside the message list.
            }
        }
        else if (suggestMatch) {
            let links: string[] = [];
            try { links = JSON.parse(suggestMatch[1]); } catch (e) { }
            const clean = displayContent.replace(suggestMatch[0], '').trim();
            if (clean) {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'coach', content: clean, timestamp: new Date().toISOString(), citations }]);
            }
            if (links.length > 0) {
                setSuggestedUrls(links);
            }
        }
        else if (searchMatch) {
            const query = searchMatch[1];
            const cleanResponse = displayContent.replace(searchMatch[0], '').trim();
            if (cleanResponse) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'coach',
                    content: cleanResponse,
                    timestamp: new Date().toISOString(),
                    citations
                }]);
            }

            setMessages(prev => [...prev, {
                id: 'google-search',
                sender: 'sys',
                content: `🌐 Searching Google for: "${query}"...`,
                timestamp: new Date().toISOString()
            }]);

            // Call AI again WITH Grounding enabled for this specific query
            const { generateAIResponse } = await import('../lib/aiService');
            // We use system prompt to force summarization of search results
            const searchRes = await generateAIResponse([
                { role: 'user', content: `Search Google for: ${query}. Summarize key findings relevant to learning about it.` }
            ], undefined, false, true); // useSearch=true

            if (searchRes.content) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 3).toString(),
                    sender: 'coach',
                    content: `Here's what I found: ${searchRes.content}`,
                    timestamp: new Date().toISOString(),
                    // citations... (omitted for brevity in this replace block, but logic exists)
                }]);
            }
        }
        else if (generateMatch || hiddenParams) {
            if (displayContent) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'coach',
                    content: displayContent,
                    timestamp: new Date().toISOString(),
                    citations
                }]);
            }

            const params = hiddenParams; // Already parsed above if valid

            if (params) {
                setMessages(prev => [...prev, {
                    id: 'loading-gen',
                    sender: 'coach',
                    content: "Great! I'm creating your personalized curriculum now... This might take a few seconds.",
                    timestamp: new Date().toISOString()
                }]);

                try {
                    const newCourse = await createPersonalizedCourse(
                        user!,
                        params.goal,
                        params.level || "Beginner",
                        params.time || "10 hours",
                        params.role || "Learner",
                        params.outcome || "Growth"
                    );
                    if (newCourse) {
                        // Refresh the global program context to ensure the new course is visible
                        await refreshProgram();

                        // Navigate to the first lesson of the new course
                        const firstModule = newCourse.structure.learningPath[0];
                        const firstLesson = firstModule.lessons[0];
                        setTimeout(() => {
                            navigateToLesson(newCourse.id, firstModule.id, firstLesson.id || firstLesson.title);
                        }, 500);
                    }
                } catch (e) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        sender: 'coach',
                        content: `I had trouble generating the course. Details: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
                        timestamp: new Date().toISOString(),
                        isError: true
                    }]);
                }
            }
        } else {
            // Normal message
            if (displayContent) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    sender: 'coach',
                    content: displayContent,
                    timestamp: new Date().toISOString(),
                    citations
                }]);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const clearChat = () => {
        if (!confirm("Start over? This will clear your current conversation.")) return;
        setMessages([{
            id: Date.now().toString(),
            sender: 'coach',
            content: "Hi! I'm your Learning Coach. I'm here to help you build a personalized study plan. What specific topic or skill are you looking to master today?",
            timestamp: new Date().toISOString()
        }]);
        setScrapedContext([]);
        setSuggestedUrls([]);
    };

    const handleScrape = async (url: string) => {
        setIsScraping(url);
        try {
            const { crawlUrl, checkCrawlStatus } = await import('../lib/aiService');

            // Add system message
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'sys',
                content: `🕷️ Checking existing context for ${url}...`,
                timestamp: new Date().toISOString()
            }]);

            // 1. Check DB First
            const { data: existing } = await supabase
                .from('content')
                .select('raw_content, metadata')
                .eq('url', url)
                .maybeSingle();

            if (existing && existing.raw_content) {
                console.log("✅ Found existing content in DB, skipping scrape.");
                setScrapedContext(prev => [...prev, { url, content: existing.raw_content }]);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'sys',
                    content: `✅ Loaded existing context for ${url}.`,
                    timestamp: new Date().toISOString()
                }]);

                // Clear from suggestions
                setSuggestedUrls(prev => prev.filter(u => u !== url));
                setIsScraping(null);
                return;
            }

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'sys',
                content: `🕷️ Starting fresh crawl for ${url} (up to 50 pages)... This may take a minute.`,
                timestamp: new Date().toISOString()
            }]);

            const crawlId = await crawlUrl(url);

            // Poll for completion
            let attempts = 0;
            let finalContent = "";

            while (attempts < 40) { // Max 2 minutes (40 * 3s)
                await new Promise(r => setTimeout(r, 3000));
                const status = await checkCrawlStatus(crawlId);

                console.log("Crawl Status:", status);

                if (status.status === 'completed') {
                    // Aggregate content
                    finalContent = status.data.map((p: any) => `SOURCE: ${p.metadata?.sourceURL || 'Unknown'}\nTITLE: ${p.metadata?.title || 'No Title'}\n\n${p.markdown}`).join('\n\n---\n\n');
                    break;
                } else if (status.status === 'failed') {
                    throw new Error(`Crawl failed: ${status.error || 'Unknown error'}`);
                }

                // Update status message occasionally?
                if (attempts % 5 === 0) {
                    console.log(`Still crawling... ${status.completed}/${status.total} pages.`);
                }
                attempts++;
            }

            if (!finalContent) {
                throw new Error("Crawl timed out or returned no content.");
            }

            setScrapedContext(prev => [...prev, { url, content: finalContent }]);

            // Notify completion
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'sys',
                content: `✅ Successfully crawled ${url}. I've added the documentation to my context!`,
                timestamp: new Date().toISOString()
            }]);

            // Clear from suggestions
            setSuggestedUrls(prev => prev.filter(u => u !== url));

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'sys',
                content: `❌ Failed to crawl ${url}: ${e instanceof Error ? e.message : String(e)}`,
                timestamp: new Date().toISOString(),
                isError: true
            }]);
        } finally {
            setIsScraping(null);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            content: input,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Use the unified processor
        await processAIInteraction(input, undefined, undefined);
    };

    const navigateToLesson = (courseId: string, moduleId: string, lessonId: string) => {
        navigate(`/app/program/${courseId}/lesson/${moduleId}/${lessonId}`);
    };

    return (
        <div className="flex flex-col h-screen bg-[#FDFDFD] font-sans text-[#1A1A1A]">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100/50 bg-[#FDFDFD]/80 backdrop-blur-sm sticky top-0 z-10 transition-all duration-300">
                <div className="flex items-center gap-3">
                    {/* Removed Purple Icon */}
                    <div>
                        <h1 className="font-semibold text-lg tracking-tight leading-none">Learning Coach</h1>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase mt-0.5">Gemini 3 Pro + FireCrawl</p>
                    </div>
                </div>
                <button onClick={clearChat} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Clear Chat">
                    <Trash2 size={16} />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-3xl mx-auto w-full scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} group animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        {/* Avatar */}
                        {msg.sender !== 'sys' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border ${msg.sender === 'user' ? 'bg-gray-100 border-gray-200 text-gray-600' : 'bg-white border-transparent'}`}>
                                {msg.sender === 'user' ? <User size={14} /> : <span className="text-xl">🐱</span>}
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm relative overflow-visible
                            ${msg.sender === 'user' ? 'bg-white border border-gray-200/60 text-gray-800 rounded-tr-sm' :
                                msg.sender === 'sys' ? 'bg-gray-50 border border-gray-200 text-gray-500 text-xs py-2 w-full text-center shadow-none' :
                                    'bg-white/80 border border-gray-100 text-gray-800 rounded-tl-sm backdrop-blur-sm'}
                            ${msg.isError ? 'border-red-200 bg-red-50/50' : ''}
                        `}>
                            <div className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'prose-p:text-gray-800' : 'prose-headings:font-semibold prose-a:text-blue-600'}`}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {/* Citations / Grounding */}
                            {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-[10px] uppercase font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                                        <Sparkles size={10} /> Sources
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.citations.map((cite: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={cite.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs bg-gray-50 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded border border-gray-100 transition-colors flex items-center gap-1 truncate max-w-[200px]"
                                            >
                                                <span className="opacity-50">{idx + 1}.</span> {cite.title || cite.url}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* IN-LINE SUGGESTIONS (Moved from sticky header) */}
                {suggestedUrls.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-4 mx-12">
                        <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-500" /> Suggested Context
                        </h4>
                        <div className="space-y-2">
                            {suggestedUrls.map((url, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-indigo-200 transition-all text-sm">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline truncate max-w-[70%]">{url}</a>
                                    <button
                                        onClick={() => handleScrape(url)}
                                        disabled={!!isScraping}
                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                    >
                                        {isScraping === url ? 'Reading...' : 'Add to Context'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex gap-4 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"><span className="text-xl">🐱</span></div>
                        <div className="px-4 py-3 bg-white/50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center">
                            <div className="typing-indicator"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 md:pb-8 bg-transparent flex-shrink-0">
                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center gap-2 bg-white rounded-xl shadow-xl shadow-black/5 border border-gray-200/60 p-2 pl-4 transition-all focus-within:ring-2 focus-within:ring-black/5 focus-within:border-gray-300">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message... (Shift+Enter for new line)"
                            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 font-medium resize-none max-h-32 py-2"
                            rows={1}
                            style={{ minHeight: '44px' }}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="p-2.5 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-black transition-all duration-200 flex items-center justify-center self-end"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
