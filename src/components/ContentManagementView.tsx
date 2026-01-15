import { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import './ContentManagementView.css';

interface ContentItem {
    id: string;
    title: string;
    url: string | null;
    content_type: string;
    created_at: string;
    metadata: any;
}

export function ContentManagementView() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContent, setNewContent] = useState({ title: '', url: '', type: 'webpage' });
    const { user } = useAuth();

    useEffect(() => {
        fetchContent();
    }, [user]);

    const fetchContent = async () => {
        if (!user) return;

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profile?.org_id) {
                // FALLBACK: Try app_metadata
                const fallbackOrgId = user.app_metadata?.org_id;
                console.warn("Profile org_id missing, trying fallback:", fallbackOrgId);

                if (!fallbackOrgId) {
                    setLoading(false);
                    return;
                }

                // Use fallback
                const { data, error } = await supabase
                    .from('content')
                    .select('*')
                    .eq('org_id', fallbackOrgId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setContent(data || []);
                return;
            }

            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContent(data || []);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContent = async () => {
        if (!user || !newContent.title) return;

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profile?.org_id) throw new Error('No organization found');

            const { error } = await supabase.from('content').insert({
                org_id: profile.org_id,
                title: newContent.title,
                url: newContent.url || null,
                content_type: newContent.type,
                raw_content: `Manual entry: ${newContent.title}`,
                metadata: { source: 'manual', added_by: user.email },
            });

            if (error) throw error;

            setShowAddModal(false);
            setNewContent({ title: '', url: '', type: 'webpage' });
            fetchContent();
        } catch (error: any) {
            console.error('Error adding content:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            const { error } = await supabase.from('content').delete().eq('id', id);
            if (error) throw error;
            fetchContent();
        } catch (error: any) {
            console.error('Error deleting content:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [suggestedUpdates, setSuggestedUpdates] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSync = async () => {
        setIsUpdating(true);
        try {
            // 1. Get current course
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            if (!profile?.org_id) throw new Error('No org');

            const { data: courses } = await supabase
                .from('courses')
                .select('*')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false })
                .limit(1);

            const currentCourse = courses?.[0];
            if (!currentCourse) throw new Error('No course found to update');

            // 2. Get all content context
            const contextString = content.map(c => `Title: ${c.title}\nURL: ${c.url}`).join('\n\n');

            // 3. Generate updates
            const { generateCourseUpdates } = await import('../lib/aiService');
            const updates = await generateCourseUpdates(currentCourse.structure, contextString);

            setSuggestedUpdates({
                courseId: currentCourse.id,
                currentStructure: currentCourse.structure,
                newModules: updates.newModules
            });
            setShowUpdateModal(true);

        } catch (err: any) {
            console.error('Error syncing:', err);
            alert('Failed to generate updates: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMergeUpdates = async () => {
        if (!suggestedUpdates) return;
        setIsUpdating(true);

        try {
            const updatedStructure = {
                ...suggestedUpdates.currentStructure,
                learningPath: [
                    ...suggestedUpdates.currentStructure.learningPath,
                    ...suggestedUpdates.newModules
                ]
            };

            const { error } = await supabase
                .from('courses')
                .update({ structure: updatedStructure })
                .eq('id', suggestedUpdates.courseId);

            if (error) throw error;

            setShowUpdateModal(false);
            setSuggestedUpdates(null);
            alert('Course updated successfully!');
        } catch (err: any) {
            console.error('Error merging:', err);
            alert('Failed to merge: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="content-management-loading">
                <Loader2 className="spin" size={32} />
                <p>Loading content...</p>
            </div>
        );
    }

    return (
        <div className="content-management-view">
            <div className="content-header">
                <div>
                    <h2>Knowledge Base</h2>
                    <p>Manage all content sources for your training courses</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary" onClick={handleSync} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="spin" size={18} /> : <Loader2 size={18} />}
                        {isUpdating ? 'Analyzing...' : 'Sync to Course'}
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add Content
                    </button>
                </div>
            </div>

            <div className="content-grid">
                {content.length === 0 ? (
                    <Card className="empty-state-card">
                        <FileText size={48} className="empty-icon" />
                        <h3>No content yet</h3>
                        <p>Add your first knowledge source to get started</p>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} />
                            Add Content
                        </button>
                    </Card>
                ) : (
                    content.map((item) => (
                        <Card key={item.id} className="content-card">
                            <div className="content-card-header">
                                <div className="content-icon">
                                    {item.content_type === 'webpage' ? <LinkIcon size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="content-actions">
                                    <button className="icon-btn" onClick={() => handleDelete(item.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3>{item.title}</h3>
                            {item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="content-url">
                                    {item.url}
                                </a>
                            )}
                            <div className="content-meta">
                                <span className="content-type">{item.content_type}</span>
                                <span className="content-date">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {item.metadata?.scrape_type && (
                                <div className="content-badge">
                                    {item.metadata.scrape_type === 'full_sitemap' ? '🌐 Full Sitemap' : '📄 Single Page'}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Content</h3>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                placeholder="e.g., Product Documentation"
                                value={newContent.title}
                                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>URL (optional)</label>
                            <input
                                type="url"
                                placeholder="https://docs.example.com"
                                value={newContent.url}
                                onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={newContent.type}
                                onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                            >
                                <option value="webpage">Webpage</option>
                                <option value="pdf">PDF</option>
                                <option value="video">Video</option>
                                <option value="notion">Notion</option>
                                <option value="slack">Slack</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleAddContent}
                                disabled={!newContent.title}
                            >
                                Add Content
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUpdateModal && suggestedUpdates && (
                <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Review Suggested Updates</h3>
                        <p className="text-muted mb-4">Based on your new content, we suggest adding the following modules:</p>

                        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                            {suggestedUpdates.newModules.length === 0 ? (
                                <p>No new modules suggested at this time.</p>
                            ) : (
                                suggestedUpdates.newModules.map((module: any, i: number) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <h4 className="font-semibold text-primary mb-2">{module.title}</h4>
                                        <div className="space-y-2">
                                            {module.lessons.map((lesson: any, j: number) => (
                                                <div key={j} className="flex items-center gap-2 text-sm text-muted">
                                                    <FileText size={14} />
                                                    {lesson.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowUpdateModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleMergeUpdates}
                                disabled={suggestedUpdates.newModules.length === 0 || isUpdating}
                            >
                                {isUpdating ? 'Merging...' : 'Accept & Merge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
