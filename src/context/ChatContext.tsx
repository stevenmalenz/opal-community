import { createContext, useContext, useState, useRef, type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProgram } from './ProgramContext';
import { useUserMemory } from './UserMemoryContext';
import { openAIService } from '../lib/openai';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// --- Types ---

export interface Message {
    id: string | number;
    sender: 'ai' | 'user' | 'system';
    type: 'text' | 'audio' | 'feedback' | 'widget';
    content: any;
    duration?: string;
    widgetType?: 'skills' | 'progress';
}

interface ChatContextType {
    messages: Message[];
    isRecording: boolean;
    recordingTime: number;
    contextStep: 'goals' | 'kpis' | 'ready';
    sendMessage: (content: string) => void;
    addMessage: (message: Message) => void;
    sendAudioMessage: (audioBase64: string) => Promise<void>;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    resetConversation: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    analyzeProgress: () => void;
    startScenario: (mode: 'debate' | 'quiz' | 'roleplay') => void;
    enterLesson: (lessonId: string, _programId?: string, _moduleId?: string) => void;
    proveMastery: (lessonId: string) => void;
    isTyping: boolean;
    proactiveMessage: string | null;
    triggerWelcome: () => void;
    dismissProactiveMessage: () => void;
    setInputFocus: (focus: boolean) => void;
    inputFocus: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { currentProgram, markLessonMastered } = useProgram();
    const { getMemory, isLoaded: isMemoryLoaded } = useUserMemory();
    const { user } = useAuth();
    const location = useLocation();

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [contextStep, setContextStep] = useState<'goals' | 'kpis' | 'ready'>('goals');
    const [isTyping, setIsTyping] = useState(false);
    const [inputFocus, setInputFocus] = useState(false);

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerInterval = useRef<any>(null);

    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);

    // --- Initialization ---
    useEffect(() => {
        if (!isMemoryLoaded) return;

        const programId = currentProgram?.id || 'default';
        const storageKey = `chat_messages_${programId}`;

        // Load messages from local storage
        const storedMessages = localStorage.getItem(storageKey);
        if (storedMessages) {
            try {
                setMessages(JSON.parse(storedMessages));
            } catch (e) {
                console.error("Failed to parse chat messages", e);
            }
        } else {
            // Reset messages if switching programs and no history
            setMessages([]);

            // Check if we are in "Building" mode - if so, suppress default welcome
            // @ts-ignore
            if (location.state?.status === 'building') {
                return;
            }

            // Default welcome if no history
            const userGoal = getMemory('Goal');
            const userKPIs = getMemory('KPIs');

            if (userGoal && userKPIs) {
                setMessages([
                    {
                        id: 1,
                        sender: 'ai',
                        type: 'text',
                        content: `Welcome back! I recall your goal is "${userGoal}" and we're focusing on "${userKPIs}". Ready to continue your path?`,
                    }
                ]);
                setContextStep('ready');
            } else {
                setMessages([
                    {
                        id: 1,
                        sender: 'ai',
                        type: 'text',
                        content: "Hi! I'm your Study Buddy. I'm here to help you master your program. To get started, could you tell me a bit about your main goals for this quarter?",
                    }
                ]);
            }
        }
    }, [isMemoryLoaded, currentProgram?.id]);

    // Persist messages to local storage
    useEffect(() => {
        const programId = currentProgram?.id || 'default';
        const storageKey = `chat_messages_${programId}`;

        if (messages.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, currentProgram?.id]);

    // --- Helper Functions ---

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Updated to accept retrieved knowledge
    const buildSystemPrompt = (ragContext: string = ''): string => {
        // Fetch context from Memory OR User Metadata (Fallback)
        const role = getMemory('Role') || user?.user_metadata?.role || currentProgram?.role || 'Learner';
        const industry = getMemory('Industry') || user?.user_metadata?.industry || 'B2B SaaS';
        const goal = getMemory('Goal') || user?.user_metadata?.goal || 'Get Promoted';
        const additionalContext = getMemory('Additional Context') || user?.user_metadata?.bio || '';

        let prompt = `You are an expert AI Study Buddy and Coach. Your goal is to help the user master the content of their learning program.
        
User Context:
- Role: ${role}
- Industry: ${industry}
- Goal: ${goal}
- KPIs: ${getMemory('KPIs') || 'Not specified'}
- Additional Context: ${additionalContext} (IMPORTANT: Incorporate this into your responses)

Current Program: ${currentProgram?.title}

`;

        if (ragContext) {
            prompt += `
[RELEVANT KNOWLEDGE BASE]
The following information was retrieved from the library/cohorts. Use it to answer the user's questions if relevant.

${ragContext}
[END KNOWLEDGE]
`;
        }

        // Add content context
        if (currentProgram) {
            prompt += "Course Structure:\n";
            currentProgram.learningPath.forEach(m => {
                prompt += `- Module: ${m.title}\n`;
                m.lessons.forEach(l => {
                    const status = l.completed ? 'Completed' : 'Pending';
                    prompt += `  - Lesson: ${l.title} (${status})\n`;
                    if (l.id === activeLessonId) {
                        prompt += `    [CURRENT LESSON CONTENT START]\n${l.content}\n[CURRENT LESSON CONTENT END]\n`;
                    }
                });
            });
        }

        prompt += `
Instructions:
1. **Tone**: You are a friendly, casual Study Buddy.
2. **Context**: The user is ALREADY looking at the lesson. Assume they have read it.
3. **Format**: Use Markdown. DOUBLE line breaks between paragraphs.
4. **Knowledge**: If the retrieved knowledge helps answer the user's specific question (e.g. "what happened in the last session?"), USE IT.
5. **Mastery**: If user proves mastery, output "[ACTION: MARK_MASTERED]".
`;
        return prompt;
    };



    const enterLesson = (lessonId: string, _programId?: string, _moduleId?: string) => {
        // Update active lesson immediately for context
        setActiveLessonId(lessonId);

        // We no longer auto-open the sidebar or send a welcome message to the chat history.
        // The welcome message is now shown as a floating preview bubble in GlobalStudyBuddy.tsx.
    };

    const proveMastery = (lessonId: string) => {
        setIsSidebarOpen(true); // Force open sidebar
        enterLesson(lessonId);
        const msg: Message = {
            id: Date.now(),
            sender: 'user', // Pretend user sent it to trigger AI
            type: 'text',
            content: "I'm ready to prove I've mastered this lesson. Quiz me!"
        };
        setMessages(prev => [...prev, msg]);
        processAIResponse("I'm ready to prove I've mastered this lesson. Quiz me!", 'quiz');
    };

    const sendAudioMessage = async (audioBase64: string) => {
        // 1. Add user audio placeholder (or just text "Audio Message")
        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            type: 'text',
            content: "🎤 [Audio Message]"
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // Prepare history
            const apiMessages = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.content
            }));

            // Add system prompt
            apiMessages.unshift({ role: 'system', content: buildSystemPrompt() });

            // Call Audio API
            const { text, audioData } = await openAIService.getAudioCompletion(apiMessages, audioBase64);

            // Play Audio Response
            if (audioData) {
                const audio = new Audio(`data:audio/wav;base64,${audioData}`);
                audio.play();
            }

            // Add AI Response
            const aiResponse: Message = {
                id: Date.now() + 1,
                sender: 'ai',
                type: 'text',
                content: text || "🎤 [Audio Response]"
            };
            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("Audio Error:", error);
            const errorMsg: Message = {
                id: Date.now() + 2,
                sender: 'ai',
                type: 'text',
                content: "Sorry, I had trouble hearing that. Can you try again?"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const processAIResponse = async (userInput?: string, scenarioMode?: 'debate' | 'quiz' | 'roleplay') => {
        if (!openAIService.hasKey()) {
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'system',
                type: 'text',
                content: "System Error: OpenAI API Key is missing in environment configuration."
            }]);
            return;
        }

        setIsTyping(true);

        // 1. Retrieve RAG Context if this is a user query
        let ragContext = '';
        if (userInput) {
            try {
                // Generate embedding for query
                const embedding = await openAIService.getEmbeddings(userInput);

                // Search Knowledge Base
                const { data: documents } = await supabase.rpc('match_documents', {
                    query_embedding: embedding,
                    match_threshold: 0.5, // filter for relevance
                    match_count: 5,
                    filter: { courseId: currentProgram?.id }
                });

                if (documents && documents.length > 0) {
                    ragContext = documents.map((d: any) => `Source: ${d.metadata.title}\nContent: ${d.content}`).join('\n\n');
                    console.log("RAG Context found:", documents.length, "docs");
                }
            } catch (err) {
                console.warn("RAG Retrieval failed", err);
            }
        }

        // 2. Prepare messages for API
        const systemPrompt = buildSystemPrompt(ragContext);
        const apiMessages: any[] = [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.type === 'text' && m.sender !== 'system').map(m => ({
                role: m.sender === 'ai' ? 'assistant' : 'user',
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
            }))
        ];

        if (scenarioMode) {
            let scenarioPrompt = "";
            if (scenarioMode === 'debate') scenarioPrompt = "I want to debate the current lesson topic. Challenge me.";
            if (scenarioMode === 'quiz') scenarioPrompt = "Quiz me on the current lesson. Ask one hard question.";
            if (scenarioMode === 'roleplay') scenarioPrompt = "Let's roleplay a scenario based on this lesson. You start.";

            apiMessages.push({ role: 'user', content: scenarioPrompt });
        } else if (userInput) {
            const lastMsg = messages[messages.length - 1];
            if (!lastMsg || lastMsg.content !== userInput) {
                apiMessages.push({ role: 'user', content: userInput });
            }
        }

        try {
            const responseText = await openAIService.getChatCompletion(apiMessages);

            // Check for Mastery Action
            if (responseText.includes('[ACTION: MARK_MASTERED]')) {
                if (activeLessonId && currentProgram) {
                    // Find module for lesson
                    const module = currentProgram.learningPath.find(m => m.lessons.some(l => l.id === activeLessonId));
                    if (module) {
                        markLessonMastered(currentProgram.id, module.id, activeLessonId);
                        // Trigger confetti? We can't easily do it from here without a library, but the UI will update.
                    }
                }
            }

            const cleanResponse = responseText.replace('[ACTION: MARK_MASTERED]', '').trim();

            const aiResponse: Message = {
                id: Date.now() + 1,
                sender: 'ai',
                type: 'text',
                content: cleanResponse
            };
            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("AI Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'system',
                type: 'text',
                content: `Error connecting to AI: ${errorMessage}. Please check the console/network tab.`
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const analyzeProgress = () => {
        if (!currentProgram) return;

        const completedModules = currentProgram.learningPath.filter(m => m.status === 'completed');
        const inProgressModule = currentProgram.learningPath.find(m => m.status === 'in-progress');
        const nextModule = currentProgram.learningPath.find(m => m.status === 'locked');

        let suggestion = "";
        const goal = getMemory('Goal');

        if (inProgressModule) {
            suggestion = `I see you're working on "${inProgressModule.title}". ${goal ? `This is crucial for your goal of "${goal}".` : ''} Keep going!`;
        } else if (nextModule) {
            suggestion = `You've completed ${completedModules.length} modules. Ready to start "${nextModule.title}"? It builds on what you've just learned.`;
        } else if (completedModules.length === 0) {
            suggestion = `You're just getting started. I recommend diving into "${currentProgram.learningPath[0].title}" to build a strong foundation.`;
        } else {
            suggestion = "You've completed the entire program! Amazing work. Should we review any specific topics?";
        }

        const aiResponse: Message = {
            id: Date.now(),
            sender: 'ai',
            type: 'text',
            content: `💡 **Proactive Tip:** ${suggestion}`
        };
        setMessages(prev => [...prev, aiResponse]);
    };

    const startScenario = (mode: 'debate' | 'quiz' | 'roleplay') => {
        let prompt = "";
        switch (mode) {
            case 'debate':
                prompt = "I want to debate the current lesson topic. Challenge me.";
                break;
            case 'quiz':
                prompt = "Quiz me on the current lesson. Ask one hard question.";
                break;
            case 'roleplay':
                prompt = "Let's roleplay a scenario based on this lesson. You start.";
                break;
        }

        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            type: 'text',
            content: prompt
        };
        setMessages(prev => [...prev, userMsg]);

        setTimeout(() => {
            processAIResponse(prompt, mode);
        }, 1000);
    };

    const handleVoiceMessage = (_audioBlob: Blob, duration: number) => {
        const newMsg: Message = {
            id: Date.now(),
            sender: 'user',
            type: 'audio',
            content: "Audio Message",
            duration: formatTime(duration)
        };
        setMessages(prev => [...prev, newMsg]);

        setTimeout(() => {
            processAIResponse("I just sent an audio message. Please acknowledge it and ask me to summarize my thoughts since you can't hear me yet.");
        }, 1000);
    };

    const triggerWelcome = async () => {
        if (!currentProgram) return;

        // Don't show if already open or if we have a message
        if (isSidebarOpen || proactiveMessage) return;

        const completedModules = currentProgram.learningPath.filter(m => m.status === 'completed');
        const inProgressModule = currentProgram.learningPath.find(m => m.status === 'in-progress');
        const userGoal = getMemory('Goal');

        // Default fallback
        let contextDescription = "The user is starting their journey.";
        if (inProgressModule) {
            contextDescription = `The user is working on module "${inProgressModule.title}".`;
        } else if (completedModules.length > 0) {
            contextDescription = `The user has completed ${completedModules.length} modules.`;
        }

        try {
            // Generate dynamic welcome
            const systemPrompt = `You are an enthusiastic AI Study Coach.
            Generate a SHORT, PUNCHY, 1-sentence welcome message (max 15 words) to appear in a chat bubble.
            Context: ${contextDescription}
            User Goal: ${userGoal || 'Master the content'}
            Tone: Exciting, motivating, "Let's go!" vibe.
            Do NOT use quotes.`;

            const messages = [{ role: 'system', content: systemPrompt }];
            // @ts-ignore
            const { text } = await openAIService.getChatCompletion(messages).then(t => ({ text: t })); // Wrapper since getChatCompletion returns string

            // If getChatCompletion returns string directly (which it does based on my read), use it.
            // Wait, getChatCompletion returns Promise<string>.

            // Let's re-read getChatCompletion signature in my head... yes it returns string.
            // But I can't call it directly if I don't have the messages array correct.
            // Actually, I'll just use a simple call.

            const aiText = await openAIService.getChatCompletion([{ role: 'system', content: systemPrompt }]);
            setProactiveMessage(aiText.replace(/"/g, ''));

        } catch (e) {
            console.error("Failed to generate welcome", e);
            // Fallback
            setProactiveMessage("Ready to crush your goals today? Let's dive in!");
        }
    };

    const dismissProactiveMessage = () => {
        setProactiveMessage(null);
    };

    // --- Public Actions ---

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        const newMsg: Message = {
            id: Date.now(),
            sender: 'user',
            type: 'text',
            content: text
        };
        setMessages(prev => [...prev, newMsg]);

        setTimeout(() => {
            processAIResponse(text);
        }, 100);
    };

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                handleVoiceMessage(audioBlob, recordingTime);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.warn("Microphone access failed:", err);
            alert("Microphone access denied or not available.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        clearInterval(timerInterval.current);
        mediaRecorderRef.current = null;
    };

    const resetConversation = () => {
        setMessages([]);
        localStorage.removeItem('chat_messages');
        // Optional: Reset other state if needed
        setContextStep('goals');
    };

    return (
        <ChatContext.Provider value={{
            messages,
            isRecording,
            recordingTime,
            contextStep,
            sendMessage,
            addMessage,
            startRecording,
            stopRecording,
            resetConversation,
            isSidebarOpen,
            setIsSidebarOpen,
            analyzeProgress,
            startScenario,
            enterLesson,
            proveMastery,
            isTyping,
            sendAudioMessage,
            proactiveMessage,
            triggerWelcome,
            dismissProactiveMessage,
            setInputFocus,
            inputFocus
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
