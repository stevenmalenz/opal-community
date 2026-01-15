import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import './SocraticPanel.css';


interface Message {
    id: string;
    role: 'ai' | 'user';
    content: string;
    type?: 'question' | 'hint' | 'feedback';
}

interface SocraticPanelProps {
    context?: string;
}

export function SocraticPanel({ context }: SocraticPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'ai',
            content: context
                ? `I see you're working on: "${context}". How would you like to approach this?`
                : "I'm here to help you think through this scenario. What's your primary goal in this interaction?",
            type: 'question',
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const simulateCoachingResponse = async (userInput: string) => {
        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const lowerInput = userInput.toLowerCase();
        let response = "That's an interesting perspective. Can you elaborate on why you think that's the most important factor?";

        if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('expensive')) {
            response = "Price is often a mask for value. How might you uncover what the prospect actually values more than saving money?";
        } else if (lowerInput.includes('value') || lowerInput.includes('roi')) {
            response = "Great focus on value. How would you quantify that ROI specifically for their business model?";
        } else if (lowerInput.includes('stuck') || lowerInput.includes('help')) {
            response = "Let's take a step back. What is the one thing this prospect cares about most right now?";
        } else if (lowerInput.includes('time') || lowerInput.includes('schedule')) {
            response = "Time is a scarce resource. How can you frame your solution as a time-saver rather than a time-sink?";
        } else if (lowerInput.includes('competitor') || lowerInput.includes('other')) {
            response = "Competitors are inevitable. Instead of comparing features, how can you highlight the unique partnership value we offer?";
        }

        return {
            content: response,
            role: 'ai' as const,
            type: 'question' as const
        };
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const aiMsg = await simulateCoachingResponse(input);

            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                ...aiMsg
            }]);
        } catch (error) {
            console.error('Failed to get AI response', error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleHint = () => {
        setIsTyping(true);
        setTimeout(() => {
            const hintMsg: Message = {
                id: Date.now().toString(),
                role: 'ai',
                content: "Hint: Try focusing on the value of time saved rather than just the raw cost.",
                type: 'hint',
            };
            setMessages((prev) => [...prev, hintMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="socratic-panel glass-panel">
            <div className="panel-header">
                <div className="ai-avatar">
                    <Sparkles size={18} />
                </div>
                <h3>Socratic Coach</h3>
            </div>

            <div className="messages-area">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn('message', msg.role)}>
                        <div className="message-content">
                            {msg.type === 'hint' && <Lightbulb size={14} className="hint-icon" />}
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message ai typing">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <div className="suggestion-chips">
                    <button className="chip" onClick={handleHint}>
                        <HelpCircle size={14} /> I'm stuck
                    </button>
                    <button className="chip" onClick={() => setInput("I want to focus on value.")}>
                        Focus on value
                    </button>
                </div>
                <div className="input-box">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your thought process..."
                    />
                    <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
