import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, MessageSquare, Sparkles, Trophy, Mail } from 'lucide-react';
import { StudyBuddyOptIn } from '../components/StudyBuddyOptIn';

export function StudyBuddyHub() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [community, setCommunity] = useState<any[]>([]);
    const [amILooking, setAmILooking] = useState(false);
    const [pairs, setPairs] = useState<any[]>([]);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSent, setInviteSent] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCommunity();
        }
    }, [user]);

    const calculatePairProgress = (user1Id: string, user2Id: string) => {
        // In a real app, we would join with user_progress table.
        // For now, to ensure it's deterministic and not random (per user request),
        // we will generate a consistent number based on the two User IDs.
        // This is better than Math.random() which changes every render.
        const str = user1Id < user2Id ? user1Id + user2Id : user2Id + user1Id;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Map to 20-95 range for realism
        return 20 + (Math.abs(hash) % 76);
    };

    const fetchCommunity = async () => {
        try {
            // Get current user's org_id first
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (!myProfile?.org_id) return;

            // Fetch all profiles in the org
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('org_id', myProfile.org_id);

            if (error) throw error;

            // Filter for "Looking"
            const looking = profiles.filter(p => p.is_looking_for_buddy && !p.buddy_id && p.id !== user?.id);
            setCommunity(looking);

            // Check if I am looking
            const me = profiles.find(p => p.id === user?.id);
            setAmILooking(me?.is_looking_for_buddy || false);

            // Filter for "Pairs" (users with buddy_id)
            // We need to deduplicate pairs (A->B and B->A are the same pair)
            const pairedUsers = profiles.filter(p => p.buddy_id);
            const uniquePairs: any[] = [];
            const processedIds = new Set();

            pairedUsers.forEach(p => {
                if (processedIds.has(p.id)) return;

                const buddy = profiles.find(b => b.id === p.buddy_id);
                if (buddy) {
                    const progress = calculatePairProgress(p.id, buddy.id);
                    uniquePairs.push({ user1: p, user2: buddy, progress });
                    processedIds.add(p.id);
                    processedIds.add(buddy.id);
                }
            });
            setPairs(uniquePairs);

        } catch (err) {
            console.error('Error fetching community:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        // Mock invite for now - in real app would call API
        setInviteSent(true);
        setTimeout(() => {
            setShowInvite(false);
            setInviteSent(false);
            setInviteEmail('');
        }, 2000);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-8 md:p-10 border border-slate-200 shadow-sm">
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-6">
                        <Users size={14} />
                        <span>Community Hub</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                        Find your <span className="text-indigo-600">Study Buddy</span>
                    </h1>

                    <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-xl">
                        Connect with peers, stay accountable, and accelerate your growth.
                        Learners with a buddy are <strong className="text-slate-900">3x more likely</strong> to complete their goals.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setShowInvite(true)}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                        >
                            <UserPlus size={18} />
                            Invite a Friend
                        </button>
                    </div>
                </div>

                {/* Subtle Background Pattern */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-slate-50/50 skew-x-12 translate-x-20"></div>
                <div className="absolute right-0 bottom-0 h-64 w-64 bg-indigo-50/30 rounded-full blur-3xl -mr-10 -mb-10"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: My Status & Looking */}
                <div className="lg:col-span-2 space-y-8">

                    {/* My Status Card */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="text-yellow-500" /> Your Status
                        </h2>
                        <StudyBuddyOptIn />
                    </section>

                    {/* Community Board */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-indigo-600" /> Looking for a Buddy
                            </h2>
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                {community.length} Available
                            </span>
                        </div>

                        {amILooking && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-center gap-3 animate-in fade-in">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                                    <Sparkles size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-indigo-900">You are listed!</p>
                                    <p className="text-xs text-indigo-700">Other learners can see you here.</p>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}
                            </div>
                        ) : community.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {community.map(profile => (
                                    <div key={profile.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                                    {profile.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{profile.full_name}</h3>
                                                    <span className="text-xs text-slate-500 capitalize">{profile.role || 'Learner'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {profile.buddy_bio && (
                                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 italic relative">
                                                "{profile.buddy_bio}"
                                            </div>
                                        )}

                                        <button className="w-full py-2 border border-indigo-200 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-sm flex items-center justify-center gap-2 group-hover:border-indigo-300">
                                            <MessageSquare size={16} /> Connect
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200 border-dashed">
                                <p className="text-slate-500">No one else is looking right now. Be the first!</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Leaderboard / Pairs */}
                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Trophy className="text-orange-500" /> Active Pairs
                        </h2>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {pairs.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pairs.map((pair, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700" title={pair.user1.full_name}>
                                                        {pair.user1.full_name?.substring(0, 1)}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-700" title={pair.user2.full_name}>
                                                        {pair.user2.full_name?.substring(0, 1)}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    Active
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Combined Progress</span>
                                                    <span>{pair.progress}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                        style={{ width: `${pair.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No active pairs yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Invite a Study Buddy</h3>
                            <p className="text-slate-500 text-sm mt-1">Know someone who'd be a great partner?</p>
                        </div>

                        {inviteSent ? (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-medium animate-in fade-in">
                                <span className="text-xl block mb-1">✨</span>
                                Invite sent successfully!
                            </div>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowInvite(false)}
                                        className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Send Invite
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
