import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Check, MessageSquare } from 'lucide-react';

export function StudyBuddyOptIn() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isLooking, setIsLooking] = useState(false);
    const [bio, setBio] = useState('');
    const [buddy, setBuddy] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchStatus();
    }, [user]);

    const fetchStatus = async () => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_looking_for_buddy, buddy_bio, buddy_id')
                .eq('id', user!.id)
                .single();

            if (error) throw error;

            setIsLooking(profile.is_looking_for_buddy || false);
            setBio(profile.buddy_bio || '');

            if (profile.buddy_id) {
                const { data: buddyProfile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', profile.buddy_id)
                    .single();
                setBuddy(buddyProfile);
            }
        } catch (err) {
            console.error('Error fetching study buddy status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_looking_for_buddy: isLooking,
                    buddy_bio: bio
                })
                .eq('id', user!.id);

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error updating study buddy status:', err);
            alert('Failed to update status.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <UserPlus size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Study Buddy</h3>
                        <p className="text-sm text-slate-500">Find a partner to learn with.</p>
                    </div>
                </div>
                {buddy && (
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check size={12} /> Matched
                    </div>
                )}
            </div>

            {buddy ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <h4 className="font-semibold text-indigo-900 mb-1">Your Buddy</h4>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                            {buddy.full_name?.substring(0, 2).toUpperCase() || 'SB'}
                        </div>
                        <div>
                            <p className="font-medium text-slate-800">{buddy.full_name || 'Unknown User'}</p>
                            <p className="text-xs text-slate-500">{buddy.email}</p>
                        </div>
                        <button className="ml-auto p-2 hover:bg-indigo-100 rounded-full text-indigo-600" title="Message">
                            <MessageSquare size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-sm font-medium text-slate-700">I'm looking for a buddy</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isLooking}
                                onChange={(e) => setIsLooking(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {isLooking && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300 mt-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                What are you learning? / Bio
                            </label>
                            <textarea
                                className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                rows={3}
                                placeholder="I'm focusing on Sales Negotiation and would love to practice roleplays..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex justify-end items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        {saved && (
                            <span className="text-green-600 text-sm font-medium animate-in fade-in flex items-center gap-1">
                                <Check size={16} /> Saved!
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-all shadow-sm shadow-indigo-200 ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                } disabled:opacity-50`}
                        >
                            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Preferences'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
