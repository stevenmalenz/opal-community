import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Play, FileText, Sparkles, Check, Edit2, Upload, Youtube, Trash2, Calendar, ExternalLink, Download, Users, X } from 'lucide-react';
import { openAIService } from '../lib/openai';
import ReactMarkdown from 'react-markdown';
import { CohortHomeworkSection } from '../components/CohortHomeworkSection';

export function CohortSessionView() {
    const { id, sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editTranscript, setEditTranscript] = useState('');
    const [editRecordingUrl, setEditRecordingUrl] = useState('');
    const [editMeetingUrl, setEditMeetingUrl] = useState('');

    // AI State
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditingSummary, setIsEditingSummary] = useState(false); // New state for summary edit

    // New Features State
    const [resources, setResources] = useState<any[]>([]);
    const [editDate, setEditDate] = useState('');
    const [newResourceName, setNewResourceName] = useState('');

    useEffect(() => {
        checkAdmin();
        if (sessionId) fetchSession();
    }, [sessionId]);

    const checkAdmin = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'admin') setIsAdmin(true);
    };

    const fetchSession = async () => {
        try {
            const { data, error } = await supabase
                .from('cohort_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            setSession(data);
            setEditTranscript(data.transcript || '');
            setEditRecordingUrl(data.recording_url || '');
            setEditMeetingUrl(data.meeting_url || '');
            setResources(data.resources || []);
            setEditDate(data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : '');

            setEditDate(data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : '');
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            const { error: uploadError } = await supabase.storage.from('session_attachments').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('session_attachments').getPublicUrl(fileName);
            console.log(data); // Using data to satisfy lint

            const newResource = {
                title: newResourceName || file.name,
                url: data.publicUrl,
                type: 'file'
            };

            const updatedResources = [...resources, newResource];
            setResources(updatedResources);

            // Auto-save resources
            await supabase.from('cohort_sessions').update({ resources: updatedResources }).eq('id', sessionId);
            setNewResourceName('');
            alert("Resource added!");
        } catch (error) {
            console.error("Resource upload failed", error);
            alert("Failed to upload resource");
        }
    };

    const handleDeleteResource = async (index: number) => {
        if (!confirm("Remove this resource?")) return;
        const updated = resources.filter((_, i) => i !== index);
        setResources(updated);
        await supabase.from('cohort_sessions').update({ resources: updated }).eq('id', sessionId);
    };

    const handleDeleteSession = async () => {
        if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
        try {
            await supabase.from('cohort_sessions').delete().eq('id', sessionId);
            alert("Session deleted.");
            navigate(`/app/cohorts/${id}`);
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete session");
        }
    };



    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('cohort_sessions')
                .update({
                    transcript: editTranscript,
                    recording_url: editRecordingUrl,
                    meeting_url: editMeetingUrl,
                    scheduled_at: editDate ? new Date(editDate).toISOString() : session.scheduled_at,
                    resources: resources
                })
                .eq('id', sessionId);

            if (error) throw error;

            setSession({
                ...session,
                transcript: editTranscript,
                recording_url: editRecordingUrl,
                meeting_url: editMeetingUrl
            });
            setIsEditing(false);
            alert("Saved successfully!");
        } catch (err) {
            console.error(err);
            alert('Failed to save changes');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            const { error } = await supabase.storage
                .from('session_recordings')
                .upload(fileName, file);

            if (error) throw error;

            const { data: publicData } = supabase.storage
                .from('session_recordings')
                .getPublicUrl(fileName);

            setEditRecordingUrl(publicData.publicUrl);

            // Auto-transcribe update logic
            if (confirm("Upload successful! Do you want to auto-transcribe this video?")) {
                handleTranscribe(file);
            }

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Ensure the bucket exists.");
        } finally {
            setUploading(false);
        }
    };

    const handleTranscribe = async (file: File) => {
        setIsTranscribing(true);
        try {
            const text = await openAIService.transcribeAudio(file);
            setEditTranscript(text);
            alert("Transcription complete!");
        } catch (error) {
            console.error("Transcription failed", error);
            alert("Transcription failed. File might be too large (>25MB).");
        } finally {
            setIsTranscribing(false);
        }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        // Standard YouTube
        let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
        return url; // Return original if not matched (e.g. Vimeo/Loom)
    };

    const generateSummary = async () => {
        if (!session.transcript) {
            alert("No transcript available to summarize.");
            return;
        }

        setIsSummarizing(true);
        try {
            const prompt = `
            You are an expert Learning Experience Designer.
            Summarize the following session transcript.
            
            Guidelines:
            1. **The Hook**: Start with a 1-sentence "Hook" that explains why this session matters (Make it exciting!).
            2. **Key Takeaways**: Provide 3 bullet points of the most critical insights.
            3. **Action Plan**: Provide a checklist of 2-3 specific things the learner should do next.
            4. **Tone**: Energetic, encouraging, and professional.
            5. **Format**: Use strictly Markdown (headers, bolding, bullet points).
            
            Transcript:
            ${session.transcript.substring(0, 5000)}... (truncated)`;

            // 1. Generate Summary
            const text = await openAIService.getChatCompletion([{ role: 'user', content: prompt }]);

            // 2. Generate Embedding for RAG
            // We embed the SUMMARY + key metadata so it's searchable
            const embedding = await openAIService.getEmbeddings(`Session: ${session.title}\nSummary: ${text}`);

            // 3. Save Summary to Session Table
            const { error: sError } = await supabase
                .from('cohort_sessions')
                .update({ summary: text })
                .eq('id', sessionId);

            if (sError) throw sError;

            // 4. Save to Knowledge Base (RAG)
            const { error: kbError } = await supabase
                .from('knowledge_base')
                .insert({
                    org_id: (await supabase.from('profiles').select('org_id').eq('id', user?.id).single()).data?.org_id,
                    content: text,
                    metadata: {
                        source: 'cohort_session',
                        sessionId: sessionId,
                        title: session.title,
                        transcriptSnippet: session.transcript.substring(0, 200)
                    },
                    embedding: embedding
                });

            if (kbError) console.error("RAG Indexing failed", kbError); // Don't block UI

            setSession({ ...session, summary: text });

        } catch (err) {
            console.error("AI Summary failed", err);
            alert("Failed to generate summary. Please check your API key.");
        } finally {
            setIsSummarizing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading session...</div>;
    if (!session) return <div className="p-8 text-center">Session not found</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <button
                onClick={() => navigate(`/app/cohorts/${id}`)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Cohort
            </button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.title}</h1>
                    <p className="text-gray-500 text-sm">
                        {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Unscheduled'}
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                        {isEditing && (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-200 shadow-sm">
                                <Calendar size={14} className="text-gray-400" />
                                <input
                                    type="datetime-local"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="text-sm border-none focus:ring-0 text-gray-700 bg-transparent p-0"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <button
                                    onClick={handleDeleteSession}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Session"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                {isEditing ? "Done" : <Edit2 size={20} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={`grid grid-cols-1 gap-8 ${isAdmin && isEditing ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                {/* Left Column: Video & Main Content */}
                <div className={`${isAdmin && isEditing ? 'lg:col-span-2' : 'w-full'} space-y-8`}>

                    {/* Join Session CTA (If Scheduled & Future or Active) */}
                    {session.meeting_url && (
                        <div className="bg-indigo-600 rounded-xl p-4 flex items-center justify-between text-white shadow-lg animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Live Session Link</h3>
                                    <p className="text-indigo-100 text-sm">Join the class call here.</p>
                                </div>
                            </div>
                            <a
                                href={session.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Join Now
                            </a>
                        </div>
                    )}

                    {/* Video Player */}
                    <div className="bg-black rounded-xl overflow-hidden shadow-lg relative flex items-center justify-center group w-full">
                        {session.recording_url ? (
                            // Auto-detect if it's a native file vs embed
                            session.recording_url.includes('supabase.co') || session.recording_url.match(/\.(mp4|mov|webm)$/i) ? (
                                <video
                                    src={session.recording_url}
                                    controls
                                    className="w-full max-h-[80vh] object-contain"
                                />
                            ) : (
                                <div className="aspect-video w-full">
                                    <iframe
                                        src={getEmbedUrl(session.recording_url) || ''}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )
                        ) : (
                            <div className="aspect-video w-full flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <Play size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No recording available</p>
                                </div>
                            </div>
                        )}

                        {/* Edit Overlay */}
                        {isAdmin && isEditing && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8 z-10">
                                <div className="w-full max-w-md space-y-4">
                                    {/* Video URL Input */}
                                    <div>
                                        <label className="text-white text-sm font-medium mb-1 block flex items-center gap-2">
                                            <Youtube size={14} /> Video / Recording URL
                                        </label>
                                        <input
                                            type="text"
                                            value={editRecordingUrl}
                                            onChange={(e) => setEditRecordingUrl(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg text-sm"
                                            placeholder="https://youtube.com/watch?v=... or .mp4 URL"
                                        />
                                    </div>

                                    {/* Meeting URL Input */}
                                    <div>
                                        <label className="text-white text-sm font-medium mb-1 block flex items-center gap-2">
                                            <Users size={14} /> Join Link (Zoom/Meet)
                                        </label>
                                        <input
                                            type="text"
                                            value={editMeetingUrl}
                                            onChange={(e) => setEditMeetingUrl(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded-lg text-sm"
                                            placeholder="https://zoom.us/j/..."
                                        />
                                    </div>

                                    <div className="text-center text-gray-400 text-xs">- OR -</div>

                                    {/* File Upload */}
                                    <label className={`cursor-pointer w-full py-2 ${uploading ? 'bg-gray-600 cursor-wait' : 'bg-gray-700 hover:bg-gray-600'} rounded-lg text-white text-sm flex items-center justify-center gap-2 transition-colors`}>
                                        <Upload size={14} />
                                        {uploading ? 'Uploading...' : 'Upload Video File'}
                                        <input type="file" className="hidden" accept="video/*,audio/*" onChange={handleFileUpload} disabled={uploading} />
                                    </label>

                                    {isTranscribing && (
                                        <div className="text-center text-white text-xs animate-pulse">
                                            Transcribing audio... this may take a moment.
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSave}
                                        disabled={uploading || isTranscribing}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                                    >
                                        <Check size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pre-work / Session Content */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold text-lg">
                            <FileText className="text-gray-400" />
                            Session Content & Pre-work
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-600">
                            {session.description ? session.description.split('\n').map((line: string, i: number) => (
                                <p key={i}>{line}</p>
                            )) : <p className="italic text-gray-400">No content details provided.</p>}
                        </div>
                    </div>

                    {/* Resources Section (Moved here) */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                            <FileText size={16} className="text-indigo-500" /> Key Resources
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {resources.map((res: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center justify-between hover:bg-gray-100 group transition-colors border border-gray-200"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {res.type === 'file' ? <Download size={14} className="flex-shrink-0" /> : <ExternalLink size={14} className="flex-shrink-0" />}
                                            <span className="truncate">{res.title}</span>
                                        </div>
                                    </a>
                                    {isAdmin && isEditing && (
                                        <button
                                            onClick={() => handleDeleteResource(idx)}
                                            className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {resources.length === 0 && !isAdmin && (
                            <div className="text-gray-400 text-sm italic">No resources added yet.</div>
                        )}

                        {isAdmin && isEditing && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-500 mb-2 block">Add Resource</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={newResourceName}
                                        onChange={(e) => setNewResourceName(e.target.value)}
                                        className="flex-1 text-xs border border-gray-200 rounded p-2"
                                    />
                                    <label className="cursor-pointer px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 text-xs flex items-center gap-2 transition-colors">
                                        <Upload size={14} /> Upload
                                        <input type="file" className="hidden" onChange={handleResourceUpload} />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: AI & Transcript Management (Admin Only/Hidden) */}
                {isAdmin && isEditing && (
                    <div className="space-y-6">
                        {/* Admin Transcript */}
                        <details className="bg-gray-50 rounded-xl border border-gray-200 group">
                            <summary className="p-4 cursor-pointer text-sm font-medium text-gray-700 flex items-center justify-between list-none">
                                <span>Admin Tools</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 pt-0 border-t border-gray-100 mt-2">
                                <div className="mb-2 text-xs font-bold text-gray-500 uppercase">Transcript</div>
                                <textarea
                                    value={editTranscript}
                                    onChange={(e) => setEditTranscript(e.target.value)}
                                    className="w-full h-32 text-xs border border-gray-300 rounded-lg p-2 mb-2"
                                    placeholder="Transcript content..."
                                />
                                <button
                                    onClick={handleSave}
                                    className="w-full py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold text-gray-700"
                                >
                                    Save Transcript
                                </button>
                            </div>
                        </details>
                    </div>
                )}

            </div>

            {/* Full Width AI Summary */}
            <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-8 border border-indigo-100 shadow-sm relative group">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <Sparkles size={20} className="text-indigo-600" />
                        AI Summary
                    </h2>
                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsEditingSummary(!isEditingSummary)}
                                className="px-3 py-1.5 text-indigo-600 text-xs font-bold hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                            >
                                {isEditingSummary ? <><X size={14} /> Cancel Edit</> : <><Edit2 size={14} /> Edit</>}
                            </button>
                            <button
                                onClick={generateSummary}
                                disabled={isSummarizing || !session.transcript}
                                className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                            >
                                {isSummarizing ? 'Generating...' : 'Regenerate Summary'}
                            </button>
                        </div>
                    )}
                </div>

                {isEditingSummary ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <textarea
                            value={session.summary || ''}
                            onChange={(e) => setSession({ ...session, summary: e.target.value })}
                            className="w-full bg-white border border-indigo-200 rounded-lg p-4 text-gray-700 min-h-[300px] focus:ring-2 focus:ring-indigo-500 outline-none font-medium font-mono text-sm shadow-inner"
                            placeholder="AI Summary will appear here..."
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => {
                                    handleSave(); // Saves everything including summary if we updated session state correctly? 
                                    // handleSave updates from editTranscript variable etc. 
                                    // We need to explicitly update summary in DB here or rely on handleSave to include summary.
                                    // Let's call update directly to be safe or update local session and let handleSave pick it up?
                                    // handleSave uses `editTranscript`, `editRecordingUrl`, `resources`. It does NOT currently include `summary` in its update list.
                                    supabase.from('cohort_sessions').update({ summary: session.summary }).eq('id', sessionId).then(() => {
                                        setIsEditingSummary(false);
                                        alert("Summary saved.");
                                    });
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                            >
                                Save Summary
                            </button>
                        </div>
                    </div>
                ) : (
                    session.summary ? (
                        <div className="prose prose-indigo max-w-none text-gray-700">
                            <ReactMarkdown>{session.summary}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-indigo-400 text-sm italic">
                            Summary not available yet.
                        </p>
                    )
                )}
            </div>

            {/* Homework Section */}
            {sessionId && <CohortHomeworkSection sessionId={sessionId} />}
        </div>
    );
}
