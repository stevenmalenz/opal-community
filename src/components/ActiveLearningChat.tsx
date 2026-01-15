import { useState, useRef } from 'react';
import { Send, Play, Mic, X, Square, Sparkles } from 'lucide-react';
import { Waveform } from './Waveform';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'voice';
    duration?: string;
}

export function ActiveLearningChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hi! I'm your study buddy. I noticed you're working on Objection Handling. Want to practice a roleplay scenario?", type: 'text' }
    ]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [liveTranscript, setLiveTranscript] = useState('');

    // Mock transcription simulation
    const transcriptInterval = useRef<any>(null);
    const timerInterval = useRef<any>(null);

    const startRecording = () => {
        setIsRecording(true);
        setRecordingTime(0);
        setLiveTranscript('');

        // Simulate live transcription
        const words = ["I", "think", "the", "key", "is", "to", "listen", "first", "and", "then", "respond", "with", "empathy."];
        let i = 0;
        transcriptInterval.current = setInterval(() => {
            if (i < words.length) {
                setLiveTranscript(prev => prev + (prev ? ' ' : '') + words[i]);
                i++;
            }
        }, 300);

        timerInterval.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        setIsRecording(false);
        clearInterval(transcriptInterval.current);
        clearInterval(timerInterval.current);

        // Send voice message
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: liveTranscript,
            type: 'voice',
            duration: `0:${recordingTime.toString().padStart(2, '0')}`
        };
        setMessages(prev => [...prev, newMessage]);

        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "That's a great approach! Empathy is crucial. Try to acknowledge their specific concern before pivoting. For example: 'I hear that budget is a concern...'",
                type: 'text'
            }]);
        }, 1500);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const newMessage: Message = { id: Date.now().toString(), role: 'user', content: input, type: 'text' };
        setMessages([...messages, newMessage]);
        setInput('');

        // Mock AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Good point. How would you handle it if they said 'We're happy with our current provider'?",
                type: 'text'
            }]);
        }, 1000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`fixed bottom-6 right-6 transition-all duration-300 z-50 flex flex-col items-end ${isOpen ? 'w-96' : 'w-auto'}`}>

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full mb-4 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-emerald-600 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-white">
                            <Sparkles size={18} />
                            <span className="font-bold">Study Buddy</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                                    }`}>
                                    {msg.type === 'voice' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                                                <button className="w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                                                    <Play size={14} fill="currentColor" />
                                                </button>
                                                <div className="h-1 bg-white/30 rounded-full flex-1 w-32">
                                                    <div className="h-full w-1/3 bg-white rounded-full"></div>
                                                </div>
                                                <span className="text-xs font-medium opacity-80">{msg.duration}</span>
                                            </div>
                                            <p className="text-sm opacity-90 italic">"{msg.content}"</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isRecording && (
                            <div className="flex justify-end">
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl rounded-br-none p-3 max-w-[85%] animate-pulse">
                                    <p className="text-sm italic">{liveTranscript}...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        {isRecording ? (
                            <div className="flex flex-col items-center gap-4 py-2">
                                <div className="flex items-center gap-4 w-full justify-center">
                                    <span className="text-red-500 font-mono font-bold w-12 text-right">{formatTime(recordingTime)}</span>
                                    <Waveform isRecording={isRecording} />
                                </div>
                                <button
                                    onClick={stopRecording}
                                    className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Square size={18} fill="currentColor" />
                                    Stop Recording
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    // @ts-ignore
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                                />
                                {input.trim() ? (
                                    <button
                                        onClick={handleSend}
                                        className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        <Send size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        className="bg-gray-100 text-gray-600 p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                        <Mic size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-gray-200 text-gray-600 rotate-90' : 'bg-emerald-600 text-white'
                    }`}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} />}
            </button>
        </div>
    );
}
