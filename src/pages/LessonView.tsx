import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Edit2, X, Save, Sparkles } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useUserMemory } from '../context/UserMemoryContext';
import { openAIService } from '../lib/openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { createPortal } from 'react-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { CitationChip } from '../components/CitationRenderer';
import confetti from 'canvas-confetti';
import { HomeworkSection } from '../components/HomeworkSection';
import { HomeworkSubmissionModal } from '../components/HomeworkSubmissionModal';
import './LessonView.css';

export function LessonView() {
    const { programId, moduleId, lessonId } = useParams();
    const navigate = useNavigate();
    const { getLesson, markLessonComplete, updateLesson, switchProgram, currentProgram, loading: contextLoading, personalizationUpdateCount } = useProgram();
    const { enterLesson, proveMastery } = useChat();
    const { user } = useAuth();
    const { getMemory } = useUserMemory(); // Import memory hook
    const [lesson, setLesson] = useState<any>(null);
    const [localLoading, setLocalLoading] = useState(true);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isPersonalizing, setIsPersonalizing] = useState(false); // New state
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastUpdateCount, setLastUpdateCount] = useState(0);
    const [homeworkStatus, setHomeworkStatus] = useState<string>('none');
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [homeworkRefreshTrigger, setHomeworkRefreshTrigger] = useState(0);

    // Personalization Context Modal
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [customContext, setCustomContext] = useState('');

    // Load personalized content on mount or lesson change
    useEffect(() => {
        if (programId && moduleId && lessonId) {
            const storageKey = `personalized_${user?.id}_${programId}_${lessonId}`;
            const savedPersonalization = localStorage.getItem(storageKey);

            if (savedPersonalization) {
                console.log("Loaded personalized content from storage");
                setLesson((prev: any) => prev ? { ...prev, content: savedPersonalization, isPersonalized: true } : null);
                setEditContent(savedPersonalization);
            }
        }
    }, [programId, moduleId, lessonId, user, lesson?.id]); // Depend on lesson.id to ensure base lesson is loaded first

    // Watch for global personalization updates
    useEffect(() => {
        if (personalizationUpdateCount > lastUpdateCount) {
            setLastUpdateCount(personalizationUpdateCount);
            // Only trigger if we are on a lesson page and have loaded the lesson
            if (lesson) {
                performPersonalization();
            }
        }
    }, [personalizationUpdateCount, lesson]);

    const performPersonalization = async (overrideContext?: string) => {
        const role = getMemory('Role');
        const industry = getMemory('Industry');
        const goal = getMemory('Goal');
        const context = overrideContext || getMemory('Additional Context');

        if (!role && !industry && !goal && !context) {
            // Should not happen if triggered via modal save, but good safety
            return;
        }

        setIsPersonalizing(true);
        try {
            console.log("Sending personalization request...");
            const newContent = await openAIService.rewriteContent(lesson.content, {
                Role: role,
                Industry: industry,
                Goal: goal,
                Context: context
            });

            console.log("Received personalized content, length:", newContent.length);

            // Save to LocalStorage (User Isolation)
            const storageKey = `personalized_${user?.id}_${programId}_${lessonId}`;
            localStorage.setItem(storageKey, newContent);

            setEditContent(newContent);
            setLesson((prev: any) => ({ ...prev, content: newContent, isPersonalized: true }));

            // Trigger confetti or toast?
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#0d9488', '#14b8a6'] // Teal theme
            });

        } catch (error: any) {
            console.error("Personalization failed:", error);
            alert(`Failed to personalize content: ${error.message || error}`);
        } finally {
            setIsPersonalizing(false);
        }
    };

    const handlePersonalize = () => {
        // Pre-fill with existing memory if available
        const currentContext = getMemory('Additional Context') || '';
        setCustomContext(currentContext);
        setIsContextModalOpen(true);
    };

    const handleRevert = () => {
        if (window.confirm("Are you sure you want to revert to the original content? Your personalized version will be lost.")) {
            const storageKey = `personalized_${user?.id}_${programId}_${lessonId}`;
            localStorage.removeItem(storageKey);

            // Reload original
            const original = getLesson(programId!, moduleId!, lessonId!);
            setLesson(original);
            setEditContent(original.content);
            alert("Reverted to original content.");
        }
    };

    useEffect(() => {
        // If params are missing, stop loading and let the "Not Found" state take over
        if (!programId || !moduleId || !lessonId) {
            setLocalLoading(false);
            return;
        }

        if (programId && moduleId && lessonId) {
            // Sync global program state if needed
            if (currentProgram?.id !== programId) {
                switchProgram(programId);
            }

            // If context is still loading, wait
            if (contextLoading) return;

            setLocalLoading(true);
            const data = getLesson(programId, moduleId, lessonId);
            setLesson(data);
            if (data) {
                setEditContent(data.content);
                setEditTitle(data.title);
                // Trigger proactive chat with explicit programId and moduleId
                enterLesson(lessonId, programId, moduleId);
            }
            setLocalLoading(false);
        }
    }, [programId, moduleId, lessonId, getLesson, contextLoading, enterLesson, currentProgram, switchProgram]);

    const handleComplete = () => {
        if (programId && moduleId && lessonId) {
            markLessonComplete(programId, moduleId, lessonId);
            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999 // Ensure it's on top of everything
            });

            // Refresh lesson state
            const updated = getLesson(programId, moduleId, lessonId);
            setLesson(updated);
        }
    };

    const handleSave = async () => {
        if (!programId || !moduleId || !lessonId) return;
        setIsSaving(true);

        try {
            // If personalized, update the local storage ONLY
            const storageKey = `personalized_${user?.id}_${programId}_${lessonId}`;
            const isPersonalized = !!localStorage.getItem(storageKey);

            if (isPersonalized) {
                localStorage.setItem(storageKey, editContent);
                setLesson({ ...lesson, content: editContent });
                alert("Personalized changes saved locally.");
            } else {
                // Otherwise update global DB
                await updateLesson(programId, moduleId, lessonId, editContent, editTitle);
                const updated = getLesson(programId, moduleId, lessonId);
                setLesson(updated);
                window.location.reload();
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save lesson:', error);
            alert('Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (contextLoading || localLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-secondary">Loading lesson...</span>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h2 className="text-2xl font-bold mb-4">Lesson Not Found</h2>
                <p className="text-secondary mb-6">We couldn't find the lesson you're looking for.</p>
                <button onClick={() => navigate(-1)} className="btn-primary">
                    <ArrowLeft size={18} className="mr-2" />
                    Go Back
                </button>
            </div>
        );
    }

    const isCompleted = lesson.completed;

    // GATING LOGIC:
    // If homework has been submitted (status exists) but NOT approved, gate completion.
    // If no submission ('none' or 'pending_submission'?), force submission?
    // User requirement: "Only be able to move on once that happens" (Approve)
    // So status must be 'approved'.
    // BUT we need to be careful about lessons WITHOUT homework.
    // For now, if homeworkStatus is 'none' (not loaded yet) or 'pending_submission' (loaded but no submission), we might block?
    // Or only block if they HAVE submitted and it's pending? 
    // "Make sure when I submit homework... only able to move on once that happens."
    // This implies if I submit, I'm gated. If I don't, am I free? Probably not intended.
    // Let's assume STRICT gating: Must have 'approved' status to complete.
    // Except we'll allow 'none' if we assume some lessons don't have homework? 
    // Actually, HomeworkSection keeps track. If empty, status might be 'pending_submission'.

    // const isHomeworkApproved = homeworkStatus === 'approved';
    // const isHomeworkPending = homeworkStatus === 'pending' || homeworkStatus === 'graded' || homeworkStatus === 'needs_action';

    // Allow completion if:
    // 1. Lesson is already completed (obv)
    // 2. Homework is approved
    // 3. Admin bypass (optional, lets stick to strict first)



    return (
        <div className="lesson-view-container">
            {/* Header */}
            <div className="lesson-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate(-1)} className="back-btn mb-0">
                    <ArrowLeft size={20} />
                    Back to Path
                </button>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                    {lesson?.isPersonalized && (
                        <button
                            onClick={handleRevert}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            title="Revert to original content"
                        >
                            <X size={16} /> Revert
                        </button>
                    )}

                    <button
                        onClick={handlePersonalize}
                        disabled={isPersonalizing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
                        title="Rewrite content for my role"
                    >
                        {isPersonalizing ? (
                            <span className="animate-spin">✨</span>
                        ) : (
                            <Sparkles size={16} />
                        )}
                        {isPersonalizing ? 'Personalizing...' : 'Personalize'}
                    </button>

                    {/* Only show Edit button for admins */}
                    {/* Edit button enabled for all users */}
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit2 size={16} />
                        Edit
                    </button>
                </div>
            </div>

            <div className="lesson-content-wrapper">
                <div className="lesson-card">
                    <div className="lesson-title-section">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-2">
                                {/* Buttons moved to header */}
                            </div>
                            {isCompleted && (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    <CheckCircle size={20} fill="currentColor" className="text-green-600" />
                                    <span className="font-bold text-sm">Completed</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="markdown-content mt-8">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                blockquote: ({ node, ...props }) => {
                                    // Check if this is an alert
                                    // const children = props.children;
                                    // ReactMarkdown structure for blockquote often puts lines in p tags.
                                    // We need to check deeply or checking the text content.
                                    // Simple check: see if the first line starts with [!XXX]

                                    // This is a simplified handler. For robust handling we might need remark-directive or custom logic.
                                    // But let's try to detect the raw text pattern if possible.
                                    // Since we are using rehype-raw, we might get raw elements.

                                    // Alternative: Just Render it with a designated class and let CSS handle if possible?
                                    // No, the text [!NOTE] is part of the content.

                                    return (
                                        <blockquote {...props} className="!border !border-teal-200 !bg-teal-50/50 !px-6 !py-5 !rounded-xl !not-italic !text-teal-900 [&>p]:!mb-0 !shadow-sm !my-6" />
                                    );

                                    // NOTE: To fully strip the [!NOTE] text requires delving into the children props which is complex in this lightweight editor.
                                    // For now, styling the blockquote nicely is a big step up.
                                    // To truly hide [!NOTE], we'd need a remark plugin like 'remark-github-blockquote-alert'.
                                    // Start with just styling ALL blockquotes as "Notes" for now as a fallback, 
                                    // or check if we can filter.
                                },
                                span: ({ node, ...props }) => {
                                    const p = props as any;
                                    if (p['data-cite']) {
                                        const index = parseInt(p['data-cite'] as string);
                                        const source = currentProgram?.sources?.find(s => s.id === index);
                                        if (source) {
                                            return <CitationChip source={source} index={index} />;
                                        }
                                    }
                                    return <span {...props} />;
                                }
                            }}
                        >
                            {/* Pre-process content: 
                                1. GitHub Alerts: Change '> [!NOTE]' to '> **NOTE:**' so it renders nicely without raw brackets.
                                2. Citations: [1] -> span
                            */}
                            {(lesson.content || '')
                                .replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, '>')
                                .replace(/\[(\d+)\]/g, '<span data-cite="$1"></span>')}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Footer Action - Moved ABOVE Homework */}
                <div className="lesson-footer-outside mt-8 mb-12 w-full flex flex-col gap-4">
                    {!isCompleted ? (
                        <div className="flex flex-col gap-2">
                            <button
                                className={`btn-primary large py-4 px-8 text-lg flex items-center justify-center gap-2 transition-all w-full`}
                                style={{ boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }} // Green shadow, reduced
                                onClick={() => {
                                    if (homeworkStatus === 'approved' || homeworkStatus === 'graded') {
                                        handleComplete();
                                    } else {
                                        setIsSubmitModalOpen(true);
                                    }
                                }}
                            >
                                {homeworkStatus === 'approved' || homeworkStatus === 'graded' ? (
                                    <span>Mark as Complete <CheckCircle size={20} className="inline ml-2" /></span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {homeworkStatus === 'graded' ? 'AI Graded (Pending Approval)' :
                                            homeworkStatus === 'pending' ? <span className="flex items-center gap-2">Grading... <span className="text-xs opacity-70">(Click to Check/Retry)</span></span> :
                                                'Complete Homework'}
                                    </span>
                                )}
                            </button>
                        </div>
                    ) : (
                        <>
                            {!lesson.mastered ? (
                                <button
                                    className="btn-secondary large py-4 px-8 text-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all w-full bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100"
                                    onClick={() => {
                                        // Trigger Mastery Chat
                                        if (lessonId) proveMastery(lessonId);
                                    }}
                                >
                                    🏆 Prove Mastery
                                </button>
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-center gap-2 text-yellow-800 font-bold">
                                    🏆 Lesson Mastered!
                                </div>
                            )}

                            <button
                                className="btn-primary large py-4 px-8 text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all w-full"
                                onClick={() => navigate(-1)}
                            >
                                Next Lesson
                            </button>
                        </>
                    )}
                </div>

                {/* Homework Section */}
                <HomeworkSection
                    lessonId={lessonId!}
                    moduleId={moduleId!}
                    courseId={programId}
                    onSubmissionStatusChange={setHomeworkStatus}
                    refreshTrigger={homeworkRefreshTrigger}
                />
            </div>

            {/* Homework Modal */}
            <HomeworkSubmissionModal
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                lessonId={lessonId!}
                moduleId={moduleId!}
                courseId={programId}
                onSubmissionComplete={(status) => {
                    setHomeworkStatus(status);
                    setHomeworkRefreshTrigger(prev => prev + 1);
                }}
            />

            {/* Edit Modal - Portal & Inline Styles */}
            {isEditing && createPortal(
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '56rem', height: '85vh', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>Edit Lesson Content</h3>
                            <button onClick={() => setIsEditing(false)} style={{ color: '#6b7280', cursor: 'pointer', background: 'transparent', border: 'none', padding: '0.5rem', borderRadius: '9999px' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        color: '#111827',
                                        backgroundColor: 'white'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Content</label>
                                <RichTextEditor
                                    content={editContent}
                                    onChange={setEditContent}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: 'white', borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={() => setIsEditing(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    color: '#4b5563',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    fontWeight: '600',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: isSaving ? 0.7 : 1,
                                    transition: 'opacity 0.2s ease-in-out'
                                }}
                            >
                                {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Personalization Context Modal */}
            {
                isContextModalOpen && createPortal(
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                        <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100" style={{ display: 'flex', flexDirection: 'column' }}>

                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-teal-50/30">
                                <div className="flex items-center gap-2 text-teal-800">
                                    <Sparkles size={20} className="text-teal-600" />
                                    <h3 className="text-lg font-bold font-serif">Personalize this Lesson</h3>
                                </div>
                                <button
                                    onClick={() => setIsContextModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-sm text-gray-500 mb-4">
                                    Tell us a bit about your context or goal for this specific lesson, and our AI will rewrite it just for you.
                                </p>

                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Your Context / Goal
                                </label>
                                <textarea
                                    value={customContext}
                                    onChange={(e) => setCustomContext(e.target.value)}
                                    placeholder="e.g. I work in FinTech and want to apply this to compliance reporting..."
                                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-100 outline-none text-sm min-h-[120px]"
                                    autoFocus
                                />
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    onClick={() => setIsContextModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setIsContextModalOpen(false);
                                        performPersonalization(customContext);
                                    }}
                                    disabled={!customContext.trim()}
                                    className="px-6 py-2 bg-teal-600 text-white font-bold text-sm rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Sparkles size={16} />
                                    Personalize
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
}
