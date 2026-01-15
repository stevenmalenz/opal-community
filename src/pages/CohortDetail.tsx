import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Video, BookOpen, Plus, ArrowLeft, MoreHorizontal, PlayCircle, ArrowRight } from 'lucide-react';

export function CohortDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cohort, setCohort] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const [activeTab, setActiveTab] = useState<'curriculum' | 'members'>('curriculum');
    const [members, setMembers] = useState<any[]>([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    useEffect(() => {
        checkAdmin();
        if (id) fetchCohortData();
    }, [id]);

    const checkAdmin = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'admin') setIsAdmin(true);
    };

    const fetchCohortData = async () => {
        try {
            const { data: cohortData, error: cError } = await supabase
                .from('cohorts')
                .select('*')
                .eq('id', id)
                .single();

            if (cError) throw cError;
            setCohort(cohortData);

            // Fetch Sessions
            const { data: sessionData, error: sError } = await supabase
                .from('cohort_sessions')
                .select('*')
                .eq('cohort_id', id)
                .order('scheduled_at', { ascending: true });

            if (sError) throw sError;
            setSessions(sessionData || []);

            // Fetch Members
            // Note: In a real app we'd use a join, assuming profiles relation exists.
            // For safety, we'll manual join for now if needed, but let's try join first effectively.
            // If foreign key is set up to auth.users, we can't join public.profiles directly via Supabase auto-detection often unless explicit.
            // Let's do a 2-step fetch for safety.
            const { data: memberData } = await supabase.from('cohort_members').select('*').eq('cohort_id', id);

            if (memberData && memberData.length > 0) {
                const userIds = memberData.map(m => m.user_id);
                const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);

                // Merge role info
                const merged = memberData.map(m => ({
                    ...m,
                    profile: profiles?.find(p => p.id === m.user_id) || { full_name: 'Unknown User', email: 'N/A' }
                }));
                setMembers(merged);
            } else {
                setMembers([]);
            }

        } catch (error) {
            console.error('Error fetching cohort data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSession = async () => {
        const title = prompt("Session Title");
        if (!title) return;

        try {
            const { error } = await supabase.from('cohort_sessions').insert({
                cohort_id: id,
                title,
                scheduled_at: new Date().toISOString()
            });

            if (error) throw error;
            fetchCohortData();
        } catch (err) {
            alert("Failed to add session");
        }
    };

    const loadAvailableUsers = async () => {
        // Load users to add (exclude existing)
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
            const existingIds = new Set(members.map(m => m.user_id));
            setAvailableUsers(data.filter(u => !existingIds.has(u.id)));
        }
        setShowAddMemberModal(true);
    };

    const addMember = async (userId: string) => {
        try {
            const { error } = await supabase.from('cohort_members').insert({
                cohort_id: id,
                user_id: userId,
                role: 'student'
            });
            if (error) throw error;
            setShowAddMemberModal(false);
            fetchCohortData();
        } catch (err) {
            console.error(err);
            alert("Failed to add member");
        }
    };

    const removeMember = async (memberId: string) => {
        if (!confirm("Remove this member?")) return;
        try {
            const { error } = await supabase.from('cohort_members').delete().eq('id', memberId);
            if (error) throw error;
            fetchCohortData();
        } catch (err) {
            alert("Failed to remove member");
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!cohort) return <div className="p-8 text-center">Cohort not found</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <button onClick={() => navigate('/app/cohorts')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft size={20} />
                Back to Cohorts
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{cohort.name}</h1>
                        <p className="text-gray-500 max-w-2xl">{cohort.description || "No description provided."}</p>

                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <Calendar size={18} className="text-blue-500" />
                                <span className="text-sm font-medium">Started {new Date(cohort.start_date).toLocaleDateString()}</span>
                            </div>
                            {cohort.meeting_url && (
                                <a
                                    href={cohort.meeting_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline px-3 py-1.5"
                                >
                                    <Video size={18} />
                                    <span className="text-sm font-medium">Join Meeting Room</span>
                                </a>
                            )}
                        </div>
                    </div>
                    {isAdmin && (
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                            <MoreHorizontal size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'curriculum' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Curriculum & Sessions
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Members ({members.length})
                </button>
            </div>

            {/* CONTENT */}
            {activeTab === 'curriculum' ? (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="text-indigo-600" />
                            Curriculum & Sessions
                        </h2>
                        {isAdmin && (
                            <button
                                onClick={handleAddSession}
                                className="btn-primary flex items-center gap-2 px-3 py-1.5 text-sm"
                            >
                                <Plus size={16} />
                                Add Session
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {sessions.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No sessions scheduled yet.</p>
                            </div>
                        ) : (
                            sessions.map((session, index) => (
                                <div
                                    key={session.id}
                                    onClick={() => navigate(`/app/cohorts/${id}/session/${session.id}`)}
                                    className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-bold">
                                                <span className="text-xs uppercase text-blue-400">Session</span>
                                                <span className="text-xl">{index + 1}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {session.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    {session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString() : 'Unscheduled'}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    {session.recording_url ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            <PlayCircle size={12} /> Recording Available
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                                            No Recording
                                                        </span>
                                                    )}
                                                    {session.transcript && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                                            Transcript
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-gray-400 group-hover:translate-x-1 transition-transform">
                                            <ArrowRight />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="text-indigo-600" />
                            Cohort Members
                        </h2>
                        {isAdmin && (
                            <button
                                onClick={loadAvailableUsers}
                                className="btn-primary flex items-center gap-2 px-3 py-1.5 text-sm"
                            >
                                <Plus size={16} />
                                Add Member
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No members yet.</p>
                            </div>
                        ) : members.map(m => (
                            <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                                        {m.profile?.full_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{m.profile?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => removeMember(m.id)}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                        title="Remove Member"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ADD MEMBER MODAL */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Add Member</h3>
                            <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2">
                            {availableUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => addMember(u.id)}
                                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between border border-transparent hover:border-gray-100"
                                >
                                    <span className="font-medium text-gray-800">{u.full_name || u.email}</span>
                                    <Plus size={16} className="text-gray-400" />
                                </button>
                            ))}
                            {availableUsers.length === 0 && <p className="text-center text-gray-500 py-4">No other users found.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
