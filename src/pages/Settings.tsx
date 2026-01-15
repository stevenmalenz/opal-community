import { useState } from 'react';
import { Shield, User, Brain, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useUserMemory } from '../context/UserMemoryContext';
import { Card } from '../components/Card';
import './Settings.css';

export function Settings() {
    const { user } = useAuth();
    const { memories, addMemory, updateMemory, deleteMemory, clearMemory } = useUserMemory();

    // Local state for adding new memory
    const [isAdding, setIsAdding] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    // Local state for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Profile State
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
    const [companyName, setCompanyName] = useState(user?.user_metadata?.company_name || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);



    const handleAddMemory = () => {
        if (newKey && newValue) {
            addMemory(newKey, newValue);
            setNewKey('');
            setNewValue('');
            setIsAdding(false);
        }
    };

    const startEditing = (id: string, currentValue: string) => {
        setEditingId(id);
        setEditValue(currentValue);
    };

    const saveEdit = (id: string) => {
        updateMemory(id, editValue);
        setEditingId(null);
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName, company_name: companyName }
            });
            if (error) throw error;
            alert('Profile updated successfully!');
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword) return;
        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert('Password updated successfully!');
            setNewPassword('');
            setShowPasswordChange(false);
        } catch (error: any) {
            alert('Error updating password: ' + error.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);
        // AuthContext usually handles the redirect via onAuthStateChange, or we force reload/redirect
        window.location.href = '/login';
    };

    return (
        <div className="settings-container">
            <div className="settings-header mb-8">
                <h1>Settings</h1>
                <p className="text-secondary">Manage your account preferences and app settings.</p>
            </div>

            {/* Profile Section Merged Here */}
            <div className="card mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary">
                        {user?.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </h2>
                        <div className="flex items-center gap-3 text-secondary">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.user_metadata?.role === 'learner'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {user?.user_metadata?.role ?
                                    user.user_metadata.role.charAt(0).toUpperCase() + user.user_metadata.role.slice(1)
                                    : 'Admin'}
                            </span>
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-grid">
                {/* AI Memory Section - NEW */}
                <Card className="settings-section col-span-1 md:col-span-2">
                    <div className="section-header flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Brain className="section-icon text-purple-600" size={20} />
                            <div>
                                <h3>AI Memory & Personalization</h3>
                                <p className="text-xs text-slate-500 font-normal whitespace-normal break-words max-w-prose">Facts the AI knows about you to personalize your experience.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {memories.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete all memory? This cannot be undone.')) {
                                            clearMemory();
                                        }
                                    }}
                                    className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={14} /> Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
                            >
                                <Plus size={14} /> Add Fact
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        {isAdding && (
                            <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-lg flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    placeholder="Key (e.g. 'Goal')"
                                    className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Value (e.g. 'Become a Manager')"
                                    className="flex-[2] px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleAddMemory}
                                        className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                    >
                                        <Save size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="p-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {memories.length === 0 && !isAdding && (
                            <div className="text-center py-8 text-slate-400 text-sm italic">
                                No memories stored yet. Add one to help the AI know you better!
                            </div>
                        )}

                        {memories.map((item) => (
                            <div key={item.id} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-purple-200 hover:shadow-sm transition-all">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.key}</div>
                                    {editingId === item.id ? (
                                        <div className="flex gap-2 mt-1">
                                            <input
                                                type="text"
                                                className="flex-1 px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                                            />
                                            <button onClick={() => saveEdit(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={14} /></button>
                                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="text-sm font-medium text-slate-700 truncate">{item.value}</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditing(item.id, item.value)}
                                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteMemory(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="settings-section">
                    <div className="section-header">
                        <User className="section-icon" size={20} />
                        <h3>Account Details</h3>
                    </div>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={user?.email || ''} disabled className="disabled-input" />
                    </div>
                    <div className="form-group">
                        <label>Organization</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Your Organization"
                        />
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={isUpdatingProfile}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </Card>

                {/* API Keys Section Removed */}

                <Card className="settings-section">
                    <div className="section-header">
                        <Shield className="section-icon" size={20} />
                        <h3>Privacy & Security</h3>
                    </div>
                    <div className="action-list space-y-3">
                        {!showPasswordChange ? (
                            <button onClick={() => setShowPasswordChange(true)} className="text-btn">Change Password</button>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-sm font-semibold mb-2">New Password</h4>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-3 py-2 mb-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={isUpdatingPassword || !newPassword}
                                        className="bg-primary text-white text-sm px-3 py-1.5 rounded hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                    <button
                                        onClick={() => { setShowPasswordChange(false); setNewPassword(''); }}
                                        className="text-slate-500 text-sm px-3 py-1.5 hover:bg-slate-200 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <button onClick={handleLogout} className="text-btn danger">Log Out</button>
                        <button onClick={clearMemory} className="text-btn danger">Clear AI Memory</button>
                    </div>
                </Card>
            </div>
        </div >
    );
}
