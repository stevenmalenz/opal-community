import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Trash2, RefreshCw, Plus, Mail, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProgram } from '../context/ProgramContext';
import { generateCourseFromContent } from '../lib/courseGenerator';
import { LearnerDetail } from '../components/LearnerDetail';
import './ManagerHub.css';

function AssignBuddyModal({ isOpen, onClose, learner, team, onAssign }: { isOpen: boolean, onClose: () => void, learner: any, team: any[], onAssign: (buddyId: string) => void }) {
    const [selectedBuddyId, setSelectedBuddyId] = useState('');

    if (!isOpen) return null;

    const potentialBuddies = team.filter(m => m.id !== learner.id);

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Assign Study Buddy</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Select a buddy for <span className="font-semibold text-slate-700">{learner.full_name}</span>.
                </p>

                {learner.buddy_bio && (
                    <div className="bg-indigo-50 p-3 rounded-lg mb-4 text-xs text-indigo-800 border border-indigo-100">
                        <span className="font-bold block mb-1">Learner's Note:</span>
                        "{learner.buddy_bio}"
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Buddy</label>
                    <select
                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedBuddyId}
                        onChange={(e) => setSelectedBuddyId(e.target.value)}
                    >
                        <option value="">Choose a team member...</option>
                        {potentialBuddies.map(buddy => (
                            <option key={buddy.id} value={buddy.id}>
                                {buddy.full_name} {buddy.is_looking_for_buddy ? '(Looking!)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button
                        onClick={() => onAssign(selectedBuddyId)}
                        disabled={!selectedBuddyId}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Assign Buddy
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export function ManagerHub() {
    const { user } = useAuth();
    const { availablePrograms, refreshProgram, loading: programLoading } = useProgram(); // Use cached programs
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'tracks' | 'team'>('tracks');
    // const [courses, setCourses] = useState<any[]>([]); // Removed local state for courses
    const [team, setTeam] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [learnerCounts, setLearnerCounts] = useState<Record<string, number>>({});

    // UI State
    const [loading, setLoading] = useState(false); // Default to false since we have cached programs
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
    const [manageModal, setManageModal] = useState<{ courseId: string, courseName: string } | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [modal, setModal] = useState<{ type: 'regenerate' | 'delete' | null, courseId: string | null }>({ type: null, courseId: null });
    const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
    const [assignBuddyModal, setAssignBuddyModal] = useState<{ learner: any } | null>(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, activeTab]);

    const fetchData = async () => {
        // Don't set global loading for tracks if we already have them
        if (activeTab === 'team') {
            setLoading(true);
        }

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (profile?.org_id) {
                if (activeTab === 'tracks') {
                    // We use availablePrograms from context, so no need to fetch courses here
                    // Just fetch learner counts in the background
                    const counts: Record<string, number> = {};
                    if (availablePrograms) {
                        await Promise.all(availablePrograms.map(async (course) => {
                            const { count } = await supabase
                                .from('user_courses')
                                .select('*', { count: 'exact', head: true })
                                .eq('course_id', course.id);
                            counts[course.id] = count || 0;
                        }));
                        setLearnerCounts(counts);
                    }

                } else {
                    // Fetch team members
                    const { data: teamData, error: teamError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('org_id', profile.org_id);

                    if (teamError) throw teamError;

                    // Fetch enrollments for all team members
                    const teamIds = teamData?.map(m => m.id) || [];
                    let enrollments: any[] = [];
                    if (teamIds.length > 0) {
                        const { data: enrollmentData } = await supabase
                            .from('user_courses')
                            .select('user_id, course_id')
                            .in('user_id', teamIds);
                        enrollments = enrollmentData || [];
                    }

                    // Map enrollments to team members
                    const teamWithTracks = teamData?.map(member => {
                        const memberEnrollments = enrollments.filter(e => e.user_id === member.id);
                        const trackNames = memberEnrollments.map(e => {
                            // Try to find in availablePrograms first
                            const program = availablePrograms.find(p => p.id === e.course_id);
                            if (program) return program.title;

                            // If not found (maybe static program not in DB list yet?), check static list manually or return ID
                            // This handles the "Unknown Track" issue if the context hasn't loaded it yet
                            return e.course_id;
                        });
                        return { ...member, tracks: trackNames };
                    });

                    setTeam(teamWithTracks || []);

                    // Fetch pending invites
                    console.log("Fetching invites for org:", profile.org_id);
                    const { data: invitesData, error: invitesError } = await supabase
                        .from('team_invites')
                        .select('*')
                        .eq('org_id', profile.org_id)
                        .eq('status', 'pending');

                    if (invitesError) {
                        console.error("Error fetching invites:", invitesError);
                    } else {
                        console.log("Invites fetched:", invitesData);
                        // Map track_id to track name for invites if possible
                        const invitesWithTracks = invitesData?.map(invite => {
                            let trackName = '';
                            if (invite.track_id) {
                                const program = availablePrograms.find(p => p.id === invite.track_id);
                                trackName = program?.title || '';
                            }
                            return { ...invite, trackName };
                        });
                        setInvites(invitesWithTracks || []);
                    }
                }
            } else {
                console.warn("No org_id found for user:", user?.id);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
            console.log(`Updated user ${userId} to role ${newRole}`);
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role. Please try again.');
        }
    };

    const handleAssignBuddy = async (buddyId: string) => {
        if (!assignBuddyModal) return;

        try {
            // Update the learner's profile with the buddy_id
            const { error } = await supabase
                .from('profiles')
                .update({ buddy_id: buddyId, is_looking_for_buddy: false }) // Turn off "looking" once assigned
                .eq('id', assignBuddyModal.learner.id);

            if (error) throw error;

            // Optimistic update
            setTeam(prev => prev.map(m => {
                if (m.id === assignBuddyModal.learner.id) {
                    const buddy = team.find(t => t.id === buddyId);
                    return { ...m, buddy_id: buddyId, buddy_name: buddy?.full_name, is_looking_for_buddy: false };
                }
                return m;
            }));

            setAssignBuddyModal(null);
        } catch (error) {
            console.error('Error assigning buddy:', error);
            alert('Failed to assign buddy.');
        }
    };

    const confirmAction = async () => {
        if (!modal.type) return;

        if (modal.type === 'regenerate' && modal.courseId) {
            setRegeneratingId(modal.courseId);
            setModal({ type: null, courseId: null }); // Close modal immediately
            try {
                await generateCourseFromContent(user!, undefined, undefined, modal.courseId);
                fetchData();
            } catch (error: any) {
                console.error('Error regenerating course:', error);
            } finally {
                setRegeneratingId(null);
            }
        } else if (modal.type === 'delete') {
            try {
                const idsToDelete = modal.courseId ? [modal.courseId] : selectedTracks;
                if (idsToDelete.length === 0) return;

                // Use the RPC function for each course
                // This ensures all related data (progress, submissions) is cleaned up securely via server-side logic
                for (const id of idsToDelete) {
                    const { error } = await supabase.rpc('delete_course_by_id', { course_uuid: id });

                    if (error) {
                        console.error(`Error deleting course ${id}:`, error);
                        // Fallback: If RPC fails (e.g., function not found yet), try old way?
                        // No, better to throw because old way is broken.
                        throw error;
                    }
                }

                // Refresh global context instead of local state
                refreshProgram();
                setSelectedTracks([]);
            } catch (error: any) {
                console.error('Error deleting course:', error);
                alert(`Failed to delete course: ${error.message || error.error_description || 'Unknown error'}`);
            }
            setModal({ type: null, courseId: null });
        }
    };

    const toggleTrackSelection = (id: string) => {
        if (selectedTracks.includes(id)) {
            setSelectedTracks(selectedTracks.filter(trackId => trackId !== id));
        } else {
            setSelectedTracks([...selectedTracks, id]);
        }
    };

    const toggleAllTracks = () => {
        if (selectedTracks.length === availablePrograms.length) {
            setSelectedTracks([]);
        } else {
            setSelectedTracks(availablePrograms.map(c => c.id));
        }
    };

    console.log("ManagerHub Render", { manageModal, showInviteModal });

    return (
        <div className="knowledge-hub-container">
            {/* Modal Overlay - Rendered via Portal */}
            {modal.type && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="bg-white p-0 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                        <div className={`p-6 ${modal.type === 'delete' ? 'bg-red-50' : 'bg-blue-50'} border-b ${modal.type === 'delete' ? 'border-red-100' : 'border-blue-100'} flex items-center gap-4`}>
                            <div className={`p-3 rounded-full ${modal.type === 'delete' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {modal.type === 'delete' ? <Trash2 size={24} /> : <RefreshCw size={24} />}
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${modal.type === 'delete' ? 'text-red-900' : 'text-blue-900'}`}>
                                    {modal.type === 'regenerate' ? 'Regenerate Track?' : 'Delete Track?'}
                                </h3>
                                <p className={`text-sm ${modal.type === 'delete' ? 'text-red-700' : 'text-blue-700'}`}>
                                    {modal.type === 'regenerate' ? 'Update content from knowledge base' : 'This action cannot be undone'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 text-base leading-relaxed mb-6">
                                {modal.type === 'regenerate'
                                    ? 'This will re-analyze your knowledge base and update the track structure. Current progress for learners may be reset.'
                                    : `Are you sure you want to permanently delete ${modal.courseId ? 'this track' : `${selectedTracks.length} tracks`}? All associated learner progress will be lost.`}
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                    onClick={() => setModal({ type: null, courseId: null })}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${modal.type === 'delete'
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                        }`}
                                    onClick={confirmAction}
                                >
                                    {modal.type === 'regenerate' ? 'Yes, Regenerate' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Manage Users Modal - Rendered via Portal */}
            {manageModal && createPortal(
                <ManageUsersModal
                    courseId={manageModal.courseId}
                    courseName={manageModal.courseName}
                    onClose={() => setManageModal(null)}
                />,
                document.body
            )}

            {/* Invite Modal - Rendered via Portal */}
            {showInviteModal && createPortal(
                <InviteMembersModal
                    onClose={() => setShowInviteModal(false)}
                    onInvite={() => fetchData()} // Refresh list on invite
                />,
                document.body
            )}

            {/* Learner Detail Slide-over */}
            {selectedLearnerId && createPortal(
                <LearnerDetail
                    userId={selectedLearnerId}
                    onClose={() => setSelectedLearnerId(null)}
                />,
                document.body
            )}

            <div className="knowledge-main">
                <div className="knowledge-header">
                    <div className="header-title">
                        <h2>Manager Hub</h2>
                        <p>Manage learning tracks and team progress.</p>
                    </div>
                    <div className="header-actions">
                        {activeTab === 'tracks' ? (
                            <>
                                {selectedTracks.length > 0 && (
                                    <button
                                        className="btn-secondary text-red-500 hover:bg-red-50 hover:border-red-200"
                                        onClick={() => setModal({ type: 'delete', courseId: null })}
                                    >
                                        <Trash2 size={18} /> Delete ({selectedTracks.length})
                                    </button>
                                )}
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/onboarding')}
                                >
                                    <Plus size={18} /> New Track
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        console.log("Opening Invite Modal");
                                        setShowInviteModal(true);
                                    }}
                                >
                                    <Plus size={18} /> Invite Member
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="manager-tabs flex gap-4" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <button
                        className={`tab-btn ${activeTab === 'tracks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracks')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderBottom: activeTab === 'tracks' ? '2px solid var(--primary)' : 'none',
                            marginBottom: '-1px',
                            display: 'flex',
                            flexDirection: 'column', // Stack icon and text
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <BookOpen size={18} />
                        <span>Tracks</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderBottom: activeTab === 'team' ? '2px solid var(--primary)' : 'none',
                            marginBottom: '-1px',
                            display: 'flex',
                            flexDirection: 'column', // Stack icon and text
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <Users size={18} />
                        <span>Team</span>
                    </button>
                </div>

                {activeTab === 'tracks' && (
                    <>
                        <div className="content-table-wrapper">
                            {programLoading || loading ? (
                                <div className="p-8 text-center text-secondary">Loading tracks...</div>
                            ) : availablePrograms.length === 0 ? (
                                <div className="empty-state p-12 text-center">
                                    <BookOpen size={48} className="text-gray-300 mb-4 mx-auto" />
                                    <h3 className="text-lg font-semibold">No tracks found</h3>
                                    <p className="text-secondary mb-4">Create a new track to get started.</p>
                                    <button
                                        className="btn-primary mx-auto"
                                        onClick={() => navigate('/onboarding')}
                                    >
                                        <Plus size={18} /> Create Track
                                    </button>
                                </div>
                            ) : (
                                <table className="content-table">
                                    <thead>
                                        <tr>
                                            <th className="w-10 pl-6">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    checked={selectedTracks.length === availablePrograms.length && availablePrograms.length > 0}
                                                    onChange={toggleAllTracks}
                                                />
                                            </th>
                                            <th>Track Name</th>
                                            <th>Last Updated</th>
                                            <th>Learners</th>
                                            <th className="text-right pr-6" style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availablePrograms.map(course => (
                                            <tr key={course.id} className="hover:bg-tertiary/30 transition-colors">
                                                <td className="pl-6">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox"
                                                        checked={selectedTracks.includes(course.id)}
                                                        onChange={() => toggleTrackSelection(course.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <strong className="text-primary">{course.title}</strong>
                                                    </div>
                                                </td>
                                                <td className="text-sm text-secondary">
                                                    {new Date(course.updated_at || course.created_at || new Date()).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex -space-x-2">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-surface flex items-center justify-center text-xs font-bold text-blue-700">
                                                                <Users size={12} />
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-secondary">
                                                            {learnerCounts[course.id] !== undefined ? `${learnerCounts[course.id]} Learners` : '...'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-right pr-6">
                                                    <div className="flex justify-end gap-2 relative z-10">
                                                        <button
                                                            className="action-btn text-primary hover:bg-blue-50 relative z-20"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log("Manage clicked", course.id);
                                                                setManageModal({ courseId: course.id, courseName: course.title });
                                                            }}
                                                            title="Manage Learners"
                                                        >
                                                            <Users size={16} />
                                                        </button>
                                                        <button
                                                            className="action-btn text-blue-600 hover:bg-blue-50 relative z-20"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log("Regenerate clicked", course.id);
                                                                setModal({ type: 'regenerate', courseId: course.id });
                                                            }}
                                                            disabled={regeneratingId === course.id}
                                                            title="Regenerate Track"
                                                        >
                                                            <RefreshCw size={16} className={regeneratingId === course.id ? 'animate-spin' : ''} />
                                                        </button>
                                                        <button
                                                            className="action-btn text-red-500 hover:bg-red-50 relative z-20"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                console.log("Delete clicked", course.id);
                                                                setModal({ type: 'delete', courseId: course.id });
                                                            }}
                                                            title="Delete Track"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'team' && (
                    <div className="content-table-wrapper">
                        <table className="content-table">
                            <thead>
                                <tr>
                                    <th className="pl-6">Member</th>
                                    <th>Role</th>
                                    <th>Tracks</th>
                                    <th>Study Buddy</th>
                                    <th>Status</th>
                                    <th className="text-right pr-6" style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Active Members */}
                                {team.map(member => (
                                    <tr
                                        key={member.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedLearnerId(member.id)}
                                    >
                                        <td className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {member.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <strong className="block text-primary text-sm">{member.full_name || 'Unknown User'}</strong>
                                                    <span className="text-xs text-secondary">{member.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <select
                                                className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                                                value={member.role || 'learner'}
                                                onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="learner">Learner</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {member.tracks && member.tracks.length > 0 ? (
                                                    member.tracks.map((t: string, i: number) => (
                                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                            {t}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No tracks</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {member.buddy_id ? (
                                                <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full w-fit">
                                                    <Users size={12} />
                                                    <span>{team.find(t => t.id === member.buddy_id)?.full_name || 'Assigned'}</span>
                                                </div>
                                            ) : member.is_looking_for_buddy ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAssignBuddyModal({ learner: member });
                                                    }}
                                                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Assign Buddy
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td><span className="text-green-600 text-xs font-medium">Active</span></td>
                                        <td className="text-right pr-6">
                                            <button
                                                className="text-xs text-secondary hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLearnerId(member.id);
                                                }}
                                            >
                                                View Progress
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Pending Invites */}
                                {invites.map(invite => (
                                    <tr key={invite.id} className="bg-gray-50/50">
                                        <td className="pl-6">
                                            <div className="flex items-center gap-3 opacity-70">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                    <Mail size={14} />
                                                </div>
                                                <div>
                                                    <strong className="block text-gray-600 text-sm">{invite.email}</strong>
                                                    <span className="text-xs text-gray-400">Invitation Sent</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                {invite.role ? invite.role.charAt(0).toUpperCase() + invite.role.slice(1) : 'Learner'}
                                            </span>
                                        </td>
                                        <td>
                                            {invite.trackName ? (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {invite.trackName}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">-</span>
                                            )}
                                        </td>
                                        <td><span className="text-orange-500 text-xs font-medium">Pending</span></td>
                                        <td className="text-right pr-6">
                                            <button
                                                className="text-xs text-red-400 hover:text-red-600"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Revoke invitation?')) {
                                                        await supabase.from('team_invites').delete().eq('id', invite.id);
                                                        fetchData();
                                                    }
                                                }}
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {manageModal && createPortal(
                <ManageUsersModal
                    courseId={manageModal.courseId}
                    courseName={manageModal.courseName}
                    onClose={() => setManageModal(null)}
                />,
                document.body
            )}

            {/* Delete/Regenerate Modal would go here similarly */}
            {/* Assign Buddy Modal */}
            <AssignBuddyModal
                isOpen={!!assignBuddyModal}
                onClose={() => setAssignBuddyModal(null)}
                learner={assignBuddyModal?.learner}
                team={team}
                onAssign={handleAssignBuddy}
            />
        </div>
    );
}

// Manage Users Modal
function ManageUsersModal({ courseId, courseName, onClose }: { courseId: string, courseName: string, onClose: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (!user) {
                console.warn("No user found in ManageUsersModal");
                setUsers([]);
                return;
            }

            // Get current user's org
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error("Error fetching profile:", profileError);
                // Fallback: show empty state rather than crashing
                setUsers([]);
                return;
            }

            if (!profile?.org_id) {
                console.warn("User has no org_id");
                setUsers([]);
                return;
            }

            // Fetch all users in org
            const { data: allUsers, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .eq('org_id', profile.org_id);

            if (usersError) {
                console.error("Error fetching users:", usersError);
                setUsers([]);
                return;
            }

            // Fetch assigned users for this course
            const { data: assigned, error: assignedError } = await supabase
                .from('user_courses')
                .select('user_id')
                .eq('course_id', courseId);

            if (assignedError) {
                console.warn('user_courses table missing or error:', assignedError);
                setAssignedUserIds(new Set());
            } else {
                // CRITICAL FIX: Ensure we are capturing the user IDs correctly
                const ids = assigned?.map(a => a.user_id) || [];
                console.log("Fetched assigned IDs for course:", courseId, ids);
                setAssignedUserIds(new Set(ids));
            }

            setUsers(allUsers || []);
        } catch (error) {
            console.error('CRITICAL Error in ManageUsersModal:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignment = async (userId: string) => {
        const isAssigned = assignedUserIds.has(userId);

        try {
            if (isAssigned) {
                // Remove assignment
                const { error } = await supabase
                    .from('user_courses')
                    .delete()
                    .eq('course_id', courseId)
                    .eq('user_id', userId);

                if (error) throw error;

                const newSet = new Set(assignedUserIds);
                newSet.delete(userId);
                setAssignedUserIds(newSet);
            } else {
                // Add assignment
                const { error } = await supabase
                    .from('user_courses')
                    .insert({
                        course_id: courseId,
                        user_id: userId,
                        role: 'learner'
                    });

                if (error) throw error;

                const newSet = new Set(assignedUserIds);
                newSet.add(userId);
                setAssignedUserIds(newSet);
            }
        } catch (error) {
            console.error('Error toggling assignment:', error);
            alert('Failed to update assignment');
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    console.log("ManageUsersModal RENDERED", { courseId, courseName, usersCount: users.length, loading });

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) onClose();
            }}>
            <div
                style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    maxWidth: '32rem',
                    width: '100%',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '80vh'
                }}
            >
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>Manage Learners</h3>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Track: {courseName}</p>
                    </div>
                    <button onClick={onClose} style={{ color: '#6b7280', padding: '0.5rem', borderRadius: '9999px', cursor: 'pointer', border: 'none', background: 'transparent' }}>
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        style={{
                            width: '100%',
                            paddingLeft: '2.5rem',
                            paddingRight: '1rem',
                            paddingTop: '0.5rem',
                            paddingBottom: '0.5rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            outline: 'none',
                            color: '#111827',
                            fontSize: '0.875rem'
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            Loading users...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                            No users found in your organization.
                        </div>
                    ) : (
                        <div>
                            {filteredUsers.map((u, idx) => {
                                const isAssigned = assignedUserIds.has(u.id);
                                return (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderBottom: idx !== filteredUsers.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                                {u.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>{u.full_name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleAssignment(u.id)}
                                            style={{
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                border: 'none',
                                                backgroundColor: isAssigned ? '#dcfce7' : '#2563eb',
                                                color: isAssigned ? '#15803d' : '#ffffff',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            {isAssigned ? 'Assigned' : 'Assign'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Invite Members Modal
function InviteMembersModal({ onClose, onInvite }: { onClose: () => void, onInvite: (email: string) => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('learner');
    const [selectedTrackId, setSelectedTrackId] = useState<string>('');
    const [sent, setSent] = useState(false);
    const { user } = useAuth();
    const { availablePrograms } = useProgram();

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. Send Magic Link (Acts as Invite)
            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        invited_by: user?.id,
                        role: role,
                        track_id: selectedTrackId || undefined // Pass track_id if selected
                    }
                }
            });

            if (authError) throw authError;

            // 2. Persist Invite in DB
            // Get org_id first
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();

            if (profile?.org_id) {
                const inviteData: any = {
                    email,
                    role,
                    org_id: profile.org_id,
                    invited_by: user?.id,
                    status: 'pending'
                };

                if (selectedTrackId) {
                    inviteData.track_id = selectedTrackId;
                }

                const { error: dbError } = await supabase.from('team_invites').insert(inviteData);

                if (dbError) {
                    console.error("Error saving invite to DB:", dbError);
                    // If error is about missing column, retry without track_id
                    if (dbError.message?.includes('column "track_id" of relation "team_invites" does not exist')) {
                        delete inviteData.track_id;
                        await supabase.from('team_invites').insert(inviteData);
                    }
                }
            }

            setSent(true);
            onInvite(email); // Update parent state
        } catch (error: any) {
            console.error("Invite failed:", error);
            alert(`Failed to send invite: ${error.message}`);
        }
    };

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) onClose();
            }}>
            <div
                style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxWidth: '28rem',
                    width: '100%',
                    border: '1px solid #e5e7eb',
                    opacity: 1,
                    transform: 'scale(1)',
                    transition: 'all 0.2s ease-out'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Invite Member</h3>
                    <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '4rem', height: '4rem', backgroundColor: '#dcfce7', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#16a34a' }}>
                            <Mail size={32} />
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Invite Sent!</h4>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>We've sent an email to <strong>{email}</strong> with instructions to join.</p>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                borderRadius: '0.75rem',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleInvite}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="email"
                                    required
                                    placeholder="colleague@company.com"
                                    style={{
                                        width: '100%',
                                        paddingLeft: '2.75rem',
                                        paddingRight: '1rem',
                                        paddingTop: '0.75rem',
                                        paddingBottom: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Role</label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    backgroundColor: 'white'
                                }}
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="learner">Learner</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                {role === 'admin' ? 'Can manage tracks, users, and settings.' : 'Can view and complete assigned learning tracks.'}
                            </p>
                        </div>

                        {role === 'learner' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Assign to Track (Required)</label>
                                <select
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        outline: 'none',
                                        fontSize: '1rem',
                                        backgroundColor: 'white'
                                    }}
                                    value={selectedTrackId}
                                    onChange={(e) => setSelectedTrackId(e.target.value)}
                                >
                                    <option value="">Select a track...</option>
                                    {availablePrograms.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#f3f4f6',
                                    color: '#4b5563',
                                    borderRadius: '0.75rem',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    borderRadius: '0.75rem',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: (role === 'learner' && !selectedTrackId) ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                    opacity: (role === 'learner' && !selectedTrackId) ? 0.5 : 1
                                }}
                                disabled={role === 'learner' && !selectedTrackId}
                            >
                                Send Invite
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
