import { useState, useEffect, useRef } from 'react';
import { Check, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { openAIService } from '../lib/openai';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import { FirecrawlService } from '../lib/firecrawl';
import { generateCourseStructure } from '../lib/aiService'; // Import generation logic
import { useChat } from '../context/ChatContext';
import { useProgram } from '../context/ProgramContext'; // Import context to refresh
import { useUserMemory } from '../context/UserMemoryContext';
import './OnboardingView.css';

export function OnboardingView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { resetConversation } = useChat();
    const { refreshProgram } = useProgram();

    // State
    const [step, setStep] = useState(1);
    const [signature, setSignature] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [toolInput, setToolInput] = useState('');
    const [urls, setUrls] = useState<string[]>([]); // NEW: Store multiple URLs
    const [useDeepScrape, setUseDeepScrape] = useState(false); // NEW: Deep Scrape Toggle
    const [courseGoal, setCourseGoal] = useState('');
    const [learnerProfile, setLearnerProfile] = useState('');
    const [successMetric, setSuccessMetric] = useState('');

    // Playback State
    const [playbackSummary, setPlaybackSummary] = useState('');

    // Process State
    const [processStatus, setProcessStatus] = useState<'idle' | 'researching' | 'structuring' | 'finalizing' | 'complete'>('idle');
    const [progressBar, setProgressBar] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing Agent...');

    // Invite State
    const [inviteSent, setInviteSent] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Refs
    const hasStartedRef = useRef(false);

    // Memory Context
    const { addMemory } = useUserMemory();

    // Reset Chat on Mount
    useEffect(() => {
        resetConversation();
    }, []);

    // ... (Invite logic remains same)

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !user) return;
        setInviteError(null);

        try {
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();

            if (!profile?.org_id) {
                setInviteError("Organization not found.");
                return;
            }

            const { error } = await supabase.from('invites').insert({
                email: inviteEmail,
                org_id: profile.org_id,
                status: 'pending'
            });

            if (error) throw error;

            setInviteSent(true);
            setTimeout(() => setInviteSent(false), 3000);
            setInviteEmail('');

        } catch (err) {
            console.error("Invite failed:", err);
            setInviteError("Failed to send invite. Only admins can invite.");
        }
    };



    // --- MAIN LOGIC: Synchronous Course Creation ---

    useEffect(() => {
        // Step 5 is the new build step
        if (step === 5 && !hasStartedRef.current) {
            hasStartedRef.current = true;
            runCreationProcess();
        }
    }, [step]);

    const runCreationProcess = async () => {
        // Helper to strip label prefixes
        const clean = (text: string) => text.replace(/^(GOAL|CAPSTONE|ROLE|USER GOAL|USER ROLE)[:\s-]*/i, '').trim();

        try {
            // Update User Memory immediately
            addMemory('Goal', clean(successMetric), 'professional');
            addMemory('Role', clean(learnerProfile), 'professional');

            setProcessStatus('researching');
            setStatusMessage(`Researching ${toolInput}...`);
            let progress = 0;

            // Fake progress ticker for research phase
            const ticker = setInterval(() => {
                progress += Math.random() * 5;
                if (progress > 60) progress = 60 + Math.random();
                if (progress > 90) progress = 90;
                setProgressBar(progress);
            }, 1000);

            // 1. Determine Research Method & loop through URLs
            let finalCombinedMarkdown = '';
            let totalPagesScraped = 0;
            let agentData: any = null; // We'll use the last agent data or combine? For now, we mainly want the content.
            let allScrapedPages: any[] = []; // Store raw pages for KB

            // Combine current input with added URLs
            let targets = [...urls];
            if (toolInput.trim()) targets.push(toolInput.trim());
            // Remove duplicates and empty strings
            targets = [...new Set(targets)].filter(t => t.trim() !== '');

            if (targets.length === 0) {
                setStatusMessage("No tools or URLs provided via test mode or otherwise.");
                setProcessStatus('idle');
                hasStartedRef.current = false;
                return;
            }

            // Determine primary tool name for context
            const toolName = toolInput.trim() || targets[0] || "Unknown Tool";

            // We will loop through targets
            for (const target of targets) {
                try {
                    setStatusMessage(`Researching ${target}...`);

                    const isUrl = target.startsWith('http') || target.startsWith('www');
                    const isTestMode = target.toLowerCase().includes('test_mode');

                    if (isTestMode) {
                        console.log("🧪 TEST MODE: Skipping Firecrawl");
                        finalCombinedMarkdown += `\n\n# Test Content for ${target}\nThis is mock content.\n`;
                        await new Promise(r => setTimeout(r, 1000));

                    } else if (isUrl) {
                        // STRATEGY: Direct Crawl
                        // Fix: User wants to scrape the whole subdomain, not just the deep link
                        let crawlTarget = target;
                        try {
                            const parsed = new URL(target);
                            crawlTarget = parsed.origin;
                            console.log(`🌍 Broadening crawl scope from ${target} to ${crawlTarget}`);
                        } catch (e) {
                            console.warn("Could not parse URL, using original:", target);
                        }

                        console.log(`🕷️ Crawling ${crawlTarget}...`);
                        const firecrawl = new FirecrawlService();
                        const crawlRes = await firecrawl.crawl(crawlTarget, {
                            limit: useDeepScrape ? 200 : 20, // Increased limit as requested
                            scrapeOptions: { formats: ['markdown'] }
                        });

                        if (!crawlRes.success || !crawlRes.data?.id) {
                            console.error(`Failed to crawl ${target}:`, crawlRes.error);
                            finalCombinedMarkdown += `\n\n# Error Crawling ${target}\nCould not access this URL.\n`;
                            continue;
                        }

                        const jobId = crawlRes.data.id;
                        // Poll
                        let attempts = 0;
                        while (attempts < 90) {
                            await new Promise(r => setTimeout(r, 2000));
                            attempts++;
                            const status = await firecrawl.checkCrawlStatus(jobId);
                            if (status.success && status.data?.status === 'completed') {
                                // Add to global list if we want to save individual pages later (optional, for now just aggregating text)
                                // We'll just concat the markdown for the Structure step
                                const combined = status.data.data
                                    .map((p: any) => `# ${p.metadata?.title || 'Page'}\nSource: ${p.metadata?.sourceURL}\n\n${p.markdown}`)
                                    .join('\n\n---\n\n');
                                finalCombinedMarkdown += `\n\n# Scrape Results for ${target}\n${combined}\n`;
                                totalPagesScraped += status.data.data.length;

                                // Also store for KB (bulk insert) - we need to accumulate these if we want to save them as individual pages
                                allScrapedPages.push(...status.data.data.map((p: any) => ({ ...p, targetUrl: target })));
                                break;
                            }
                            if (status.success && status.data?.status === 'failed') {
                                console.warn(`Crawl failed for ${target}`);
                                break;
                            }
                        }
                    } else {
                        // Agent Mode
                        console.log(`🕵️‍♀️ Agent Researching ${target}...`);
                        const firecrawl = new FirecrawlService();
                        const prompt = `Research the tool "${target}". find all relevant official documentation, guides, and best practices.
         CONTEXT:
         - User's Goal: "${successMetric}"
                  
                  Identify key features, workflows, and "aha" moments relevant to building this Capstone and achieving the user's goal.`;

                        const startResult = await firecrawl.startAgent({ prompt });
                        if (startResult.success && startResult.data) {
                            const jobId = startResult.data.id;
                            let attempts = 0;
                            while (attempts < 600) { // 600 * 3s = 30 min max
                                const status = await firecrawl.getAgentStatus(jobId);

                                if (attempts % 5 === 0) {
                                    console.log(`Polling Agent Job ${jobId}:`, status);
                                }

                                if (status.success && status.data?.status === 'completed') {
                                    const resultData = status.data.data;
                                    const content = typeof resultData === 'string' ? resultData : JSON.stringify(resultData, null, 2);
                                    finalCombinedMarkdown += `\n\n# Agent Research for ${target}\n${content}\n`;

                                    // Extract sources if available for Knowledge Base
                                    // Assuming structure might have { sources: [{ url, title, ... }] }
                                    if (typeof resultData === 'object' && resultData !== null) {
                                        // @ts-ignore
                                        if (Array.isArray(resultData.sources)) {
                                            // @ts-ignore
                                            allScrapedPages.push(...resultData.sources.map((s: any) => ({
                                                targetUrl: s.url || target,
                                                markdown: s.content || s.markdown || `Source: ${s.url}`,
                                                metadata: {
                                                    sourceURL: s.url,
                                                    title: s.title || `Source from ${target}`
                                                }
                                            })));
                                        }
                                    }

                                    // Keep one valid agentData object for structure context fallback
                                    if (!agentData) agentData = resultData;
                                    break;
                                }

                                if (status.success && status.data?.status === 'failed') {
                                    console.error("Agent Job Failed:", status);
                                    break;
                                }

                                // Update UI to show liveness
                                if (attempts % 10 === 0 && attempts > 0) {
                                    setStatusMessage(`Deep thinking... (${Math.floor(attempts * 3 / 60)}m elapsed)`);
                                }

                                // Update progress bar slowly
                                if (attempts % 5 === 0) setProgressBar(prev => Math.min(prev + 0.5, 85));

                                await new Promise(r => setTimeout(r, 3000));
                                attempts++;
                            }
                        }
                    }
                } catch (loopErr) {
                    console.error(`Error processing target ${target}:`, loopErr);
                    finalCombinedMarkdown += `\n\n# Error Processing ${target}\nSkipped due to error.\n`;
                }
            }

            // If no data found at all
            if (!finalCombinedMarkdown.trim()) {
                agentData = { note: "Research yielded no results." };
            } else {
                // If we have markdown, create a synthetic agentData object if one doesn't exist
                if (!agentData) {
                    agentData = {
                        title: `Multi-source Research`,
                        description: `Research from ${targets.join(', ')}`,
                        content: finalCombinedMarkdown
                    };
                }
            }

            setProgressBar(70);

            clearInterval(ticker);
            setProgressBar(75);
            setProcessStatus('structuring');
            setStatusMessage("Architecting your custom curriculum...");

            // 3. Generate Structure
            const context = `
            Tools/URLs: ${targets.join(', ')}
            Course Purpose: ${courseGoal}
            User Role: ${learnerProfile}
            User Goal: ${successMetric}
            Capstone Project: ${successMetric}
            
            Researched Data:
            ${finalCombinedMarkdown.substring(0, 150000)} ${agentData ? JSON.stringify(agentData).substring(0, 5000) : ''}`;

            const structure = await generateCourseStructure(toolName, context);

            if (!structure) throw new Error("Failed to generate structure");

            setProgressBar(90);
            setProcessStatus('finalizing');
            setStatusMessage("Finalizing course details...");

            // 4. Save course (local mode or Supabase)
            let newCourse: any = null;
            let error: any = null;

            if (user?.id?.startsWith('local-')) {
                // Local storage fallback for email-only login
                const LOCAL_KEY = 'local_courses';
                const raw = localStorage.getItem(LOCAL_KEY);
                const existing = raw ? JSON.parse(raw) : [];
                const courseId = `local-${Date.now()}`;
                newCourse = {
                    id: courseId,
                    title: structure.title,
                    description: structure.description || successMetric,
                    status: 'active',
                    structure
                };
                const updated = [newCourse, ...existing];
                localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
            } else {
                const result = await supabase
                    .from('user_courses')
                    .insert({
                        user_id: user?.id,
                        title: structure.title,
                        description: structure.description || successMetric,
                        status: 'active',
                        structure: structure,
                    })
                    .select()
                    .single();
                newCourse = result.data;
                error = result.error;
            }

            // CAPSTONE FIX: Save the AI's idea, not just the user input
            if (structure.inferredCapstone) {
                addMemory('Capstone', clean(structure.inferredCapstone), 'professional');
            } else {
                // Fallback if AI didn't return it
                addMemory('Capstone', clean(courseGoal), 'professional');
            }

            if (error || !newCourse) throw error;

            // 5. Save Research (skip in local mode)
            if (!user?.id?.startsWith('local-')) {
                try {
                    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
                    const orgId = profile?.org_id || user?.app_metadata?.org_id;

                    console.log("Saving to KB... OrgID:", orgId);

                    if (orgId) {
                        if (allScrapedPages.length > 0) {
                            const contentRows = allScrapedPages.map(page => ({
                                org_id: orgId,
                                title: page.metadata?.title || `Result from ${page.targetUrl || toolInput}`,
                                content_type: 'webpage',
                                raw_content: page.markdown,
                                url: page.metadata?.sourceURL || page.targetUrl || toolInput,
                                metadata: {
                                    source: 'firecrawl_scrape',
                                    tool: page.targetUrl || toolInput,
                                    courseId: newCourse.id,
                                    ...page.metadata
                                }
                            }));
                            const { error: insertError } = await supabase.from('content').insert(contentRows);
                            if (insertError) throw insertError;
                        } else {
                            const { error: insertError } = await supabase.from('content').insert({
                                org_id: orgId,
                                title: `Research: ${newCourse.title}`,
                                content_type: 'webpage',
                                raw_content: finalCombinedMarkdown,
                                url: targets[0].startsWith('http') ? targets[0] : null,
                                metadata: {
                                    source: 'ai_research',
                                    tool: targets.join(', '),
                                    courseId: newCourse.id,
                                    capstone: successMetric
                                }
                            });
                            if (insertError) throw insertError;
                        }
                    } else {
                        console.error("❌ Organization ID missing. Cannot save research.");
                    }
                } catch (err: any) {
                    console.error("❌ KB Insert FAILED:", err);
                    alert(`Warning: Research data save failed: ${err.message}. Please report this.`);
                }
            }

            await refreshProgram(newCourse.id);

            setTimeout(() => {
                navigate(`/app/track/${newCourse.id}`);
            }, 800);

        } catch (error: any) {
            console.error("Creation Process Failed:", error);
            const errorMsg = error?.message || String(error);
            setStatusMessage(`Error: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}`);
            setProcessStatus('idle');
            hasStartedRef.current = false;
        }
    };

    return (
        <div className="onboarding-view">
            {/* Progress Header */}
            <div className="onboarding-progress">
                <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-icon">{step > 1 ? <Check size={16} /> : '1'}</div>
                    <span>Contract</span>
                </div>
                <div className="step-line" />
                <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-icon">{step > 2 ? <Check size={16} /> : '2'}</div>
                    <span>Tool</span>
                </div>
                <div className="step-line" />
                <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <div className="step-icon">{step > 3 ? <Check size={16} /> : '3'}</div>
                    <span>Vision</span>
                </div>
                <div className="step-line" />
                <div className={`step ${step >= 4 ? 'active' : ''}`}>
                    <div className="step-icon">4</div>
                    <span>Review</span>
                </div>
                <div className={`step-line ${step >= 5 ? 'active' : ''}`} />
                <div className={`step ${step >= 5 ? 'active' : ''}`}>
                    <div className="step-icon">5</div>
                    <span>Build</span>
                </div>
            </div>

            <div className="onboarding-content">

                {/* STEP 1: The Creativity Contract */}
                {step === 1 && (
                    <Card className="onboarding-card fade-in border-2 border-indigo-100 shadow-xl">
                        <div className="w-fit mx-auto px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold rounded-full mb-6">
                            Step 1 of 5
                        </div>

                        <h2 className="font-serif italic text-3xl text-teal-900 text-center mb-6">The Creativity Contract</h2>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left max-w-lg mx-auto">
                            <p className="font-serif text-lg leading-relaxed text-slate-700 mb-6">
                                "I, the undersigned, hereby commit to being <strong>curious</strong> rather than critical.
                                I understand that AI is just a tool, and <em>I am the artist</em>.
                                I give myself permission to make mistakes, to ask 'stupid' questions, and to treat this learning journey as a creative experiment."
                            </p>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sign Here</label>
                                <input
                                    type="text"
                                    placeholder="Type your name..."
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    className="font-serif text-xl border-b border-indigo-200 bg-transparent focus:outline-none focus:border-indigo-400 px-2 py-1 placeholder:text-slate-300 text-indigo-900"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                className="btn-primary large mt-6"
                                disabled={signature.length < 2}
                                onClick={() => setStep(2)}
                            >
                                I Commit
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </Card>
                )}

                {/* STEP 2: Tool Selection */}
                {step === 2 && (
                    <Card className="onboarding-card fade-in">
                        <div className="w-fit mx-auto px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold rounded-full mb-4">
                            Step 2 of 5
                        </div>

                        <h2 className="text-center text-teal-900">What tool do you want to learn?</h2>
                        <p className="subtitle text-center max-w-lg mb-4 mx-auto">
                            Connect to live documentation and we'll extract the images and workflows.
                        </p>

                        <div className="url-input-wrapper max-w-lg mx-auto">
                            <input
                                type="text"
                                placeholder="e.g. Clay, Linear, Notion, Midjourney..."
                                value={toolInput}
                                onChange={(e) => setToolInput(e.target.value)}
                                autoFocus
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors w-full"
                            />

                            {/* Deep Scrape Toggle */}
                            <div className="mt-4 flex items-center justify-center gap-2 cursor-pointer" onClick={() => setUseDeepScrape(!useDeepScrape)}>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${useDeepScrape ? 'bg-teal-600' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${useDeepScrape ? 'translate-x-4' : ''}`} />
                                </div>
                                <span className={`text-sm font-medium ${useDeepScrape ? 'text-teal-700' : 'text-gray-500'}`}>
                                    Deep Domain Scrape (100 pages per URL)
                                </span>
                            </div>

                            {/* Added URLs List */}
                            {urls.length > 0 && (
                                <div className="mt-4 flex flex-col gap-2 max-w-lg mx-auto w-full">
                                    {urls.map((url, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-3 rounded-xl text-sm transition-all hover:bg-indigo-100">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                                                <span className="truncate">{url}</span>
                                            </div>
                                            <button
                                                onClick={() => setUrls(urls.filter((_, i) => i !== idx))}
                                                className="text-indigo-400 hover:text-red-500 transition-colors p-1"
                                                title="Remove"
                                            >
                                                <Check size={16} className="rotate-45" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add URL Button */}
                            <div className="mt-2 text-center">
                                {toolInput.trim().length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (toolInput.trim()) {
                                                setUrls([...urls, toolInput.trim()]);
                                                setToolInput('');
                                            }
                                        }}
                                        className="text-sm text-teal-600 font-medium hover:underline"
                                    >
                                        + Add "{toolInput}" to list
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3 justify-center mt-6">
                                <button
                                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn-primary large"
                                    onClick={() => setStep(3)}
                                    disabled={!toolInput.trim() && urls.length === 0}
                                >
                                    Next
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* STEP 3: The Vision (Capstone) */}
                {step === 3 && (
                    <Card className="onboarding-card fade-in">
                        <div className="w-fit mx-auto px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold rounded-full mb-4">
                            Step 3 of 5
                        </div>
                        <h2 className="text-center text-teal-900">Define Your Masterpiece</h2>
                        <p className="subtitle text-center mx-auto max-w-lg mb-6">
                            We don't learn for the sake of learning. We learn to build.
                        </p>

                        <div className="w-full max-w-lg flex flex-col gap-4 text-left mx-auto">

                            {/* Field 1: Goal */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">What do you want this course to teach?</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-base"
                                    placeholder="e.g. Advanced cold email automation using Clay."
                                    rows={2}
                                    value={courseGoal}
                                    onChange={e => setCourseGoal(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Field 2: Audience/Role */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Who's taking this course?</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-base"
                                    placeholder="e.g. Senior SDRs, RevOps Managers..."
                                    value={learnerProfile}
                                    onChange={e => setLearnerProfile(e.target.value)}
                                />
                            </div>

                            {/* Field 3: Success */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">What would success look like for a student?</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-base"
                                    placeholder="e.g. They can build an automated prospecting engine that runs while they sleep."
                                    rows={2}
                                    value={successMetric}
                                    onChange={e => setSuccessMetric(e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="flex gap-3 mt-6 w-full max-w-lg mx-auto">
                            <button
                                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setStep(2)}
                            >
                                Back
                            </button>
                            <button
                                className="btn-primary large flex-1 justify-center"
                                onClick={async () => {
                                    setIsGeneratingSummary(true);
                                    try {
                                        // Fallback if AI fails or takes too long
                                        const fallback = `You want to build a course for ${learnerProfile} that teaches ${courseGoal}, so that they can ${successMetric.replace(/^[Tt]hey can /, '')}.`;
                                        const prompt = `
Summarize the course intent into a SINGLE, polished, professional sentence for a course overview.
Input Goal: ${courseGoal}
Input Audience: ${learnerProfile}
Input Success Metric: ${successMetric}

CRITICAL: Return ONLY the summary sentence. Do not include labels, "Example Output", or any conversational text.

Expected Format:
"Design a specialized course for Senior SDRs to master cold email automation with Clay..."
`;
                                        const summary = await openAIService.rewriteContent("SUMMARY_REQUEST", {
                                            Context: prompt
                                        }).catch(() => fallback);

                                        setPlaybackSummary(summary || fallback);
                                        setStep(4);
                                    } catch (e) {
                                        console.error(e);
                                        // Fallback
                                        const summary = `You want to build a course for ${learnerProfile} that teaches ${courseGoal}, so that they can ${successMetric.replace(/^[Tt]hey can /, '')}.`;
                                        setPlaybackSummary(summary);
                                        setStep(4);
                                    } finally {
                                        setIsGeneratingSummary(false);
                                    }
                                }}
                                disabled={!courseGoal.trim() || !learnerProfile.trim() || !successMetric.trim() || isGeneratingSummary}
                            >
                                {isGeneratingSummary ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Reviewing... (~20s)
                                    </>
                                ) : (
                                    <>
                                        Review Plan
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </Card>
                )}

                {/* STEP 4: Playback / Review */}
                {step === 4 && (
                    <Card className="onboarding-card fade-in">
                        <div className="w-fit mx-auto px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold rounded-full mb-4">
                            Step 4 of 5
                        </div>
                        <h2 className="text-center text-teal-900">Sound about right?</h2>
                        <p className="subtitle text-center mx-auto max-w-lg mb-6">
                            Review your course intent before we build it.
                        </p>

                        <div className="w-full max-w-lg mx-auto">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Course Intent</label>
                            <textarea
                                className="w-full p-4 border border-indigo-200 rounded-xl bg-indigo-50/50 text-indigo-900 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-lg font-medium leading-relaxed"
                                rows={4}
                                value={playbackSummary}
                                onChange={e => setPlaybackSummary(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3 mt-6 w-full max-w-lg mx-auto">
                            <button
                                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                onClick={() => setStep(3)}
                            >
                                Back
                            </button>
                            <button
                                className="btn-primary large flex-1 justify-center"
                                onClick={() => setStep(5)}
                            >
                                Let's Build It
                                <Sparkles size={18} />
                            </button>
                        </div>
                    </Card>
                )}

                {/* STEP 5: Building (Synchronous) */}
                {step === 5 && (
                    <div className="text-center py-8 animate-in zoom-in-50 duration-500">
                        <Card className="onboarding-card fade-in">
                            <div className="w-fit mx-auto px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold rounded-full mb-4">
                                Step 5 of 5
                            </div>

                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                {processStatus === 'complete' ? <Check size={32} /> : <Loader2 size={32} className="animate-spin text-teal-600" />}
                            </div>

                            <h2 className="text-center mb-2 text-teal-900">{processStatus === 'complete' ? "All Set!" : "Designing your course..."}</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto text-center">
                                {statusMessage}
                            </p>

                            <div className="w-full max-w-md mx-auto mb-8">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ease-out ${processStatus === 'idle' ? 'bg-red-500' : 'bg-teal-600'}`}
                                        style={{ width: `${progressBar}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between text-xs text-slate-400">
                                    <span>Researching</span>
                                    <span>Structuring</span>
                                    <span>Finalizing</span>
                                </div>
                            </div>

                            {/* Invite Section */}
                            <div className="max-w-md mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                                <h3 className="font-semibold text-gray-900 mb-4 text-center">Invite your creative partners</h3>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                    />
                                    <button
                                        onClick={handleInvite}
                                        disabled={!inviteEmail.trim() || inviteSent}
                                        className={`font-medium px-4 py-2 rounded-xl transition-all ${inviteSent
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-teal-600 text-white hover:bg-teal-700'
                                            }`}
                                    >
                                        {inviteSent ? 'Sent!' : 'Invite'}
                                    </button>
                                </div>
                                {inviteError && (
                                    <p className="text-xs text-red-500 text-center mt-2">{inviteError}</p>
                                )}

                                <p className="text-xs text-stone-400 mt-6 text-center italic">
                                    Grab a cozy hot drink ☕️, this takes up to {(toolInput && !toolInput.startsWith('http')) || urls.some(u => !u.startsWith('http')) ? '10' : '2'} minutes.
                                </p>
                            </div>

                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

