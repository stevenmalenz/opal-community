import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mic, Square, Play, Target, Layout, Lightbulb, Flame, MoreVertical, Menu, TrendingUp } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useChat } from '../context/ChatContext';
import { SkillRadarChart } from '../components/SkillRadarChart';
import { StudyBuddyOptIn } from '../components/StudyBuddyOptIn';
import { CopilotAvatar } from '../components/CopilotAvatar';
import ReactMarkdown from 'react-markdown';

// --- Types ---





// --- Components ---

const AudioWaveform = ({ isPlaying, isRecording }: { isPlaying?: boolean, isRecording?: boolean }) => {
    // If we have real audio data, we could visualize it here. 
    // For now, we'll stick to the CSS animation but driven by the real recording state.
    return (
        <div className="flex items-center gap-[2px] h-6 mx-2">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className={`w-[3px] rounded-full bg-slate-400 transition-all duration-100 ${isPlaying || isRecording ? 'animate-pulse' : ''
                        }`}
                    style={{
                        height: isRecording ? `${Math.max(20, Math.random() * 100)}%` : '30%', // Randomize height when recording
                        opacity: isPlaying || isRecording ? 0.8 : 0.4,
                        animationDelay: `${i * 0.05}s`
                    }}
                />
            ))}
        </div>
    );
};

const SidebarItem = ({ item, active, onClick }: { item: any, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-xl mb-2 flex justify-between items-center transition-colors group relative ${active
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50'
            }`}
    >
        <div className="flex flex-col min-w-0 pr-4">
            <span className="truncate text-sm font-medium">{item.title}</span>
            <span className="text-xs text-slate-400 truncate">{item.subtitle}</span>
        </div>

        {item.status === 'active' && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin absolute right-3" />
        )}

        {item.isHot && (
            <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full absolute right-2 top-2">
                <Flame size={12} fill="currentColor" /> New
            </span>
        )}

        {!item.isHot && item.status !== 'active' && item.progress && (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-emerald-400 flex-shrink-0" />
        )}
    </button>
);

const InsightsCard = () => (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100 mt-auto">
        <div className="flex items-center gap-2 mb-3 text-emerald-800 font-semibold">
            <div className="p-1 bg-white rounded-md shadow-sm">
                <Lightbulb size={14} className="text-yellow-500 fill-yellow-500" />
            </div>
            <span className="text-sm">AI Insights</span>
        </div>
        <p className="text-xs text-emerald-600/80 mb-4">Insights about your speech practice</p>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100">
                <div className="w-1/3 h-full bg-emerald-400" />
            </div>
            <div className="flex justify-center mb-2">
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">1</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1 text-center">Focus on clarity, not speed</h4>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
                It's better to speak slowly and clearly than to rush. Native speakers will understand you more easily.
            </p>
        </div>
    </div>
);

export function ChatDashboard() {
    const { currentProgram } = useProgram();
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    // Global Chat State
    const {
        messages,
        isRecording,
        recordingTime,
        sendMessage,
        startRecording,
        stopRecording,
        isSidebarOpen,
        setIsSidebarOpen,
        analyzeProgress
    } = useChat();

    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Trigger proactive analysis on mount
    useEffect(() => {
        // Only trigger if we have a few messages (e.g. just the welcome one) to avoid spamming a long history
        if (messages.length > 0 && messages.length < 3) {
            const timer = setTimeout(() => {
                analyzeProgress();
            }, 2000); // Slight delay for effect
            return () => clearTimeout(timer);
        }
    }, []); // Run once on mount

    // --- Real Data Integration ---
    // Map learning path to sidebar items
    const sidebarItems = useMemo(() => currentProgram?.learningPath.map((module: any) => ({
        id: module.id,
        title: module.title,
        subtitle: `${module.lessons.length} lessons`,
        status: module.id === activeModuleId ? 'active' : module.status,
        progress: module.status === 'completed' ? 100 : (module.status === 'in-progress' ? 50 : 0)
    })) || [], [currentProgram, activeModuleId]);

    useEffect(() => {
        if (sidebarItems.length > 0 && !activeModuleId) {
            setActiveModuleId(sidebarItems[0].id);
        }
    }, [sidebarItems, activeModuleId]);

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleRecordToggle = () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50 font-sans text-slate-800 overflow-hidden">

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-[320px] bg-white border-r border-slate-200 flex flex-col p-6
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">
                            <Layout size={18} className="text-slate-600" />
                        </div>
                        <span className="font-bold text-slate-700">Learning Path</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">

                    {/* Real Learning Path Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Your Modules</h3>
                        {sidebarItems.map((item: any) => (
                            <SidebarItem
                                key={item.id}
                                item={item}
                                active={activeModuleId === item.id}
                                onClick={() => {
                                    setActiveModuleId(item.id);
                                    setIsSidebarOpen(false);
                                }}
                            />
                        ))}
                    </div>

                </div>

                {/* Study Buddy Section */}
                <div className="mt-6">
                    <StudyBuddyOptIn />
                </div>

                {/* Bottom Card */}
                <div className="mt-6">
                    <InsightsCard />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center gap-3">
                            <CopilotAvatar level={5} streak={3} />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-medium">Manager Copilot</span>
                                <h1 className="font-bold text-slate-800 text-sm sm:text-lg truncate">
                                    {activeModuleId ? sidebarItems.find(i => i.id === activeModuleId)?.title : "Welcome"}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                            <Target size={14} />
                            <span>Goal: Promotion</span>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-white sm:bg-slate-50/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>

                            {/* AI Message */}
                            {msg.sender === 'ai' && msg.type === 'text' && (
                                <div className="max-w-[85%] sm:max-w-[70%] bg-slate-100 p-4 rounded-2xl rounded-tl-sm text-slate-700 text-sm sm:text-base shadow-sm">
                                    <div className="prose prose-sm max-w-none text-slate-700">
                                        {msg.content.includes('💡 **Proactive Tip:**') ? (
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 -m-1">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-lg">💡</span>
                                                    <div className="flex-1">
                                                        <ReactMarkdown>{msg.content.replace('💡 **Proactive Tip:**', '').trim()}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Widget Message */}
                            {msg.sender === 'ai' && msg.type === 'widget' && msg.widgetType === 'skills' && (
                                <div className="max-w-[85%] sm:max-w-[70%] bg-white border border-slate-200 p-6 rounded-2xl rounded-tl-sm shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-blue-600" />
                                        Skill Gap Analysis
                                    </h4>
                                    {/* Simplified Chart: Only show top 5 skills to prevent overcrowding */}
                                    <SkillRadarChart skills={(currentProgram?.skills || []).slice(0, 5)} />
                                </div>
                            )}

                            {/* User Text Message */}
                            {msg.sender === 'user' && msg.type === 'text' && (
                                <div className="max-w-[85%] sm:max-w-[70%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
                                    {msg.content}
                                </div>
                            )}

                            {/* User Audio Message */}
                            {msg.sender === 'user' && msg.type === 'audio' && (
                                <div className="max-w-[90%] sm:max-w-[80%] bg-indigo-50/50 p-3 sm:p-4 rounded-2xl rounded-tr-sm flex items-center gap-3 sm:gap-4 border border-indigo-100 shadow-sm">
                                    <button className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 transition-all flex-shrink-0">
                                        <Play size={20} fill="currentColor" className="ml-1" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <AudioWaveform isPlaying={false} />
                                        <p className="text-sm text-slate-600 truncate px-2 mt-1">{msg.content}</p>
                                        <p className="text-xs text-slate-400 mt-1">{msg.duration}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="max-w-[90%] sm:max-w-[80%] bg-indigo-50/30 p-4 rounded-2xl rounded-tr-sm border border-indigo-100/50 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Recording {formatTime(recordingTime)}</span>
                                </div>
                                <div className="h-4 w-32">
                                    <AudioWaveform isRecording={true} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Action Bar */}
                <div className="p-4 sm:p-6 bg-white border-t border-slate-200">
                    <div className="max-w-4xl mx-auto flex items-end gap-3">

                        {/* Text Input */}
                        <div className="flex-1 bg-slate-100 rounded-xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 py-2"
                                disabled={isRecording}
                            />
                        </div>

                        {/* Record Button */}
                        <button
                            onClick={handleRecordToggle}
                            className={`
                 flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                 ${isRecording
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}
               `}
                        >
                            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                        </button>

                    </div>
                    <p className="text-center text-xs text-slate-400 mt-3">
                        AI can make mistakes. Please verify important information.
                    </p>
                </div>

            </div>
        </div >
    );
}
