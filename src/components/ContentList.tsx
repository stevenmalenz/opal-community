import { useState, useEffect } from 'react';
import { FileText, Globe, Youtube, MoreHorizontal, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './ContentList.css';

interface ContentItem {
    id: string;
    title: string;
    content_type: string;
    url: string | null;
    created_at: string;
    metadata: any;
}

export function ContentList({
    refreshTrigger,
    onEdit,
    searchQuery = '',
    filterType = 'all',
    courseId
}: {
    refreshTrigger?: number,
    onEdit?: (item: ContentItem) => void,
    searchQuery?: string,
    filterType?: string,
    courseId?: string
}) {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    useEffect(() => {
        fetchContent();
    }, [user, refreshTrigger, courseId]); // Add courseId dependency

    const fetchContent = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profile?.org_id) {
                setLoading(false);
                return;
            }

            let query = supabase
                .from('content')
                .select('*')
                .eq('org_id', profile.org_id)
                .order('created_at', { ascending: false });

            // Apply Course Filter if provided (and not a global static course ID like 'sales-mastery' which might not be in metadata)
            // But actually, we only tag content for CUSTOM courses usually.
            // If the user selects "Sales Negotiation", we might not have content tagged with that.
            // But for the "Clay" use case, it's a custom course with a generated ID.
            if (courseId && !['sales-mastery', 'customer-success'].includes(courseId)) {
                // Filter by metadata->courseId
                query = query.contains('metadata', { courseId: courseId });
            }

            const { data, error } = await query;

            if (error) throw error;
            setContent(data || []);
            setSelectedIds(new Set()); // Clear selection on refresh
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            const { error } = await supabase
                .from('content')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchContent(); // Refresh list
            setOpenDropdown(null);
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Failed to delete content');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

        try {
            const { error } = await supabase
                .from('content')
                .delete()
                .in('id', Array.from(selectedIds));

            if (error) throw error;
            await fetchContent();
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Failed to delete content');
        }
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === content.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(content.map(c => c.id)));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'webpage': return <Globe size={16} className="text-blue-400" />;
            case 'video': return <Youtube size={16} className="text-red-400" />;
            default: return <FileText size={16} className="text-gray-400" />;
        }
    };

    // getSource removed as it was unused

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const filteredContent = content.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' ||
            (filterType === 'text' && (item.content_type === 'notion' || item.metadata?.file_type === 'text')) ||
            (filterType === 'file' && item.content_type === 'file') ||
            (filterType === 'web_scrape' && item.content_type === 'webpage' && item.metadata?.scrape_type !== 'full_sitemap') ||
            (filterType === 'site_scrape' && item.metadata?.scrape_type === 'full_sitemap');

        return matchesSearch && matchesFilter;
    });

    // Grouping Logic
    const groupedContent = filteredContent.reduce((acc, item) => {
        let domain = 'Other';
        if (item.url) {
            try {
                domain = new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`).hostname;
            } catch (e) { }
        } else if (item.content_type === 'notion') {
            domain = 'Notion';
        } else if (item.content_type === 'file') {
            domain = 'Files';
        }

        if (!acc[domain]) acc[domain] = [];
        acc[domain].push(item);
        return acc;
    }, {} as Record<string, ContentItem[]>);

    const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

    const toggleDomain = (domain: string) => {
        setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
    };

    if (loading) {
        return (
            <div className="content-list-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader2 className="spin" size={32} style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading content...</p>
            </div>
        );
    }

    if (content.length === 0) {
        return (
            <div className="content-list-container" style={{ padding: '2rem', textAlign: 'center' }}>
                <FileText size={48} style={{ margin: '0 auto', opacity: 0.2 }} />
                <h3 style={{ marginTop: '1rem' }}>No content yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>Click "New Content" to add your first knowledge source</p>
            </div >
        );
    }

    return (
        <div className="content-list-container">
            {selectedIds.size > 0 && (
                <div className="bulk-actions-bar" style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedIds.size} selected</span>
                    <button
                        onClick={handleBulkDelete}
                        className="btn-danger-ghost"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                </div>
            )}
            <div className="list-header">
                <div className="col-checkbox" style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                    <input
                        type="checkbox"
                        checked={selectedIds.size === filteredContent.length && filteredContent.length > 0}
                        onChange={toggleSelectAll}
                    />
                </div>
                <div className="col-title" style={{ flex: 1 }}>Title / Domain</div>
                <div className="col-status" style={{ width: '100px' }}>Status</div>
                <div className="col-date" style={{ width: '100px' }}>Last Sync</div>
                <div className="col-actions" style={{ width: '50px' }}></div>
            </div>

            <div className="list-body">
                {Object.entries(groupedContent).map(([domain, items]) => {
                    // Default to collapsed or expanded based on preference. Using local state.

                    return (
                        <div key={domain} className="domain-group" style={{ marginBottom: '0.5rem' }}>
                            <div
                                className="domain-header"
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    borderRadius: '8px'
                                }}
                                onClick={() => toggleDomain(domain)}
                            >
                                <MoreHorizontal size={14} style={{ transform: expandedDomains[domain] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                <Globe size={14} className="text-indigo-500" />
                                {domain} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', fontWeight: 400 }}>({items.length} pages)</span>
                            </div>

                            {expandedDomains[domain] && (
                                <div className="domain-items">
                                    {items.map(item => (
                                        <div key={item.id} className="list-row" style={{ background: selectedIds.has(item.id) ? 'var(--bg-tertiary)' : undefined, paddingLeft: '2rem' }}>
                                            <div className="col-checkbox" style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={() => toggleSelection(item.id)}
                                                />
                                            </div>
                                            <div className="col-title">
                                                <div className="content-icon">{getIcon(item.content_type)}</div>
                                                <span className="content-title">{item.title}</span>
                                            </div>
                                            {/* Removed separate source column as it's grouped */}
                                            <div className="col-status">
                                                <span className="status-pill success"><CheckCircle size={12} /> Synced</span>
                                            </div>
                                            <div className="col-date">{getTimeAgo(item.created_at)}</div>
                                            <div className="col-actions" style={{ position: 'relative' }}>
                                                <button
                                                    className="icon-btn-ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdown(openDropdown === item.id ? null : item.id);
                                                    }}
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                {openDropdown === item.id && (
                                                    // ... Dropdown content (reuse existing)
                                                    <>
                                                        <div
                                                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                                            onClick={() => setOpenDropdown(null)}
                                                        />
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                right: 0,
                                                                top: '100%',
                                                                background: '#ffffff',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                padding: '0.5rem',
                                                                minWidth: '150px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                                zIndex: 999,
                                                                marginTop: '0.25rem'
                                                            }}
                                                        >
                                                            {(item.content_type === 'notion' || item.metadata?.file_type === 'text') && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (onEdit) onEdit(item);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', color: '#374151' }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                >
                                                                    <FileText size={14} /> Edit
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', color: '#ef4444' }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
