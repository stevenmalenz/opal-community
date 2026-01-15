import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProgram } from '../context/ProgramContext'; // For track name lookup

interface InviteMembersModalProps {
    onClose: () => void;
    onInvite?: () => void;
}

export function InviteMembersModal({ onClose, onInvite }: InviteMembersModalProps) {
    const { user } = useAuth();
    const { availablePrograms } = useProgram();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('learner');
    const [trackId, setTrackId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Get Org ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (!profile?.org_id) throw new Error("Organization not found");

            // 2. Check if user already exists in org (optional, but good UX)
            // Skipped for simplicity, handled by backend or edge cases

            // 3. Create Invite Record
            // Note: In a real app, this would trigger an email via Edge Function
            const { error: inviteError } = await supabase
                .from('team_invites')
                .insert({
                    org_id: profile.org_id,
                    email,
                    role,
                    track_id: trackId || null,
                    invited_by: user?.id,
                    status: 'pending'
                });

            if (inviteError) throw inviteError;

            // 4. Success
            alert(`Invitation sent to ${email}!`);
            if (onInvite) onInvite();
            onClose();

        } catch (err: any) {
            console.error("Invite error:", err);
            setError(err.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-slate-800 mb-2">Invite Team Member</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Send an invitation email to add a new member to your organization.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="learner">Learner</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Track (Optional)</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                value={trackId}
                                onChange={(e) => setTrackId(e.target.value)}
                            >
                                <option value="">No Track</option>
                                {availablePrograms.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2"
                        >
                            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
