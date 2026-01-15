import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import { ContentList } from '../components/ContentList';
import { AddContentModal } from '../components/AddContentModal';
import { ReportingView } from '../components/ReportingView';
import { useAuth } from '../context/AuthContext';
import { useProgram } from '../context/ProgramContext';
import { supabase } from '../lib/supabase';
import './AdminConsole.css';

export function AdminConsole() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView] = useState<'content' | 'scraper' | 'reporting' | 'onboarding' | 'management'>('content');
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [regenerateContext, setRegenerateContext] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [togglingPublic, setTogglingPublic] = useState(false);
    const { user } = useAuth();
    const { refreshProgram, currentProgram } = useProgram();

    const navigate = useNavigate();

    useEffect(() => {
        async function checkOnboarding() {
            console.log("AdminConsole: Checking onboarding status...");
            if (!user) {
                console.log("AdminConsole: No user, stopping.");
                setLoading(false);
                return;
            }

            // If using local email auth (id starts with local-), allow access without Supabase checks
            if (user.id.startsWith('local-')) {
                setLoading(false);
                return;
            }

            try {
                // Check if user has any content
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('org_id')
                    .eq('id', user.id)
                    .single();

                // If profile query fails (table doesn't exist), show onboarding
                if (profileError) {
                    console.warn('Profile query failed, showing onboarding:', profileError);
                    navigate('/onboarding');
                    return;
                }

                if (!profile?.org_id) {
                    console.log("AdminConsole: No org_id, navigating to onboarding.");
                    navigate('/onboarding');
                    return;
                }

                const { data: content, error: contentError } = await supabase
                    .from('content')
                    .select('id')
                    .eq('org_id', profile.org_id)
                    .limit(1);

                // If content query fails (table doesn't exist), show onboarding
                if (contentError) {
                    console.warn('Content query failed, showing onboarding:', contentError);
                    navigate('/onboarding');
                    return;
                }

                // If no content exists, show onboarding
                if (!content || content.length === 0) {
                    console.log("AdminConsole: No content found, navigating to onboarding.");
                    navigate('/onboarding');
                } else {
                    console.log("AdminConsole: Content found, staying on admin.");
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                // On error, default to onboarding
                navigate('/onboarding');
            } finally {
                setLoading(false);
            }
        }

        checkOnboarding();
    }, [user, navigate]);

    // Load current course public flag
    useEffect(() => {
        async function loadVisibility() {
            if (!currentProgram) return;
            try {
                // Try courses table
                const { data: courseRow } = await supabase
                    .from('courses')
                    .select('is_public')
                    .eq('id', currentProgram.id)
                    .maybeSingle();

                if (courseRow?.is_public !== undefined) {
                    setIsPublic(!!courseRow.is_public);
                    return;
                }

                // Fallback to user_courses
                const { data: userCourseRow } = await supabase
                    .from('user_courses')
                    .select('is_public')
                    .eq('id', currentProgram.id)
                    .maybeSingle();

                if (userCourseRow?.is_public !== undefined) {
                    setIsPublic(!!userCourseRow.is_public);
                }
            } catch (err) {
                console.warn('Could not load course visibility flag', err);
            }
        }
        loadVisibility();
    }, [currentProgram]);

    // Loading state is now handled within the main render to avoid full-screen flash


    // Removed inline onboarding view check since we redirect now

    const handleContentAdded = () => {
        setRefreshKey(prev => prev + 1);
        setShowAddModal(false);
        setEditingItem(null);
    };

    const handleTogglePublic = async () => {
        if (!currentProgram) return;
        setTogglingPublic(true);
        const next = !isPublic;
        try {
            // Update both tables; ignore missing rows
            const updates = { is_public: next };
            await supabase.from('courses').update(updates).eq('id', currentProgram.id);
            await supabase.from('user_courses').update(updates).eq('id', currentProgram.id);
            setIsPublic(next);
        } catch (err: any) {
            console.error('Failed to toggle visibility', err);
            alert('Could not update course visibility. Please try again.');
        } finally {
            setTogglingPublic(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowAddModal(true);
    };

    return (
        <div className="knowledge-hub-container" style={{ gridTemplateColumns: '1fr' }}>
            <div className="knowledge-main">
                <div className="knowledge-header">
                    <div className="header-title">
                        <h2>Content</h2>
                        <p>Manage and optimize your knowledge base.</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn-secondary"
                            disabled={!currentProgram || togglingPublic}
                            onClick={handleTogglePublic}
                        >
                            {togglingPublic ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                            {isPublic ? 'Public (Opal Course)' : 'Make Public'}
                        </button>


                        <button
                            className="btn-secondary"
                            disabled={loading}
                            onClick={() => setShowRegenerateModal(true)}
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Regenerating...' : 'Regenerate Course'}
                        </button>
                        <button
                            className="btn-secondary"
                            disabled={loading}
                            onClick={async () => {
                                if (!user) return;
                                if (!confirm('Generate Flash Cards for all lessons? This may take a while.')) return;

                                try {
                                    setLoading(true);
                                    const { generateFlashCards } = await import('../lib/courseGenerator');
                                    const count = await generateFlashCards(user);
                                    alert(`Generated flash cards for ${count} lessons!`);
                                    await refreshProgram();
                                } catch (e: any) {
                                    console.error('Flash card generation failed:', e);
                                    alert('Failed: ' + e.message);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <Sparkles size={18} className={loading ? 'animate-spin' : ''} />
                            Generate Flash Cards
                        </button>
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} /> New Content
                        </button>
                    </div>
                </div>

                {view === 'content' ? (
                    <>
                        <div className="knowledge-toolbar">
                            <div className="search-input-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="filter-dropdown-wrapper" style={{ position: 'relative' }}>
                                <select
                                    className="btn-filter"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    style={{
                                        appearance: 'none',
                                        paddingRight: '2rem',
                                        height: '100%',
                                        paddingTop: '0.8rem',
                                        paddingBottom: '0.8rem'
                                    }}
                                >
                                    <option value="all">All Types</option>
                                    <option value="text">Text / Notes</option>
                                    <option value="file">Files</option>
                                    <option value="web_scrape">Web Scrape</option>
                                    <option value="site_scrape">Site Scrape</option>
                                </select>
                                <Filter size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div className="content-table-wrapper glass-panel">
                            {currentProgram && !['sales-mastery', 'customer-success'].includes(currentProgram.id) && (
                                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 text-indigo-700 text-sm">
                                    <Sparkles size={16} />
                                    <span>Viewing content for track: <strong>{currentProgram.title}</strong></span>
                                </div>
                            )}

                            {loading ? (
                                <div className="p-4 space-y-4">
                                    <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 bg-gray-50 rounded animate-pulse"></div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <ContentList
                                    refreshTrigger={refreshKey}
                                    onEdit={handleEdit}
                                    searchQuery={searchQuery}
                                    filterType={filterType}
                                    courseId={currentProgram?.id}
                                />
                            )}
                        </div>
                    </>
                ) : view === 'reporting' ? (
                    <div className="reporting-container">
                        <button className="back-btn" onClick={() => setView('content')} style={{ marginBottom: '1rem' }}>
                            ← Back to Content
                        </button>
                        <ReportingView />
                    </div>
                ) : null}
            </div>

            {showAddModal && (
                <AddContentModal
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingItem(null);
                    }}
                    onConnect={handleContentAdded}
                    editItem={editingItem}
                />
            )}

            {showRegenerateModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '32rem', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Regenerate Course</h3>
                        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                            Guide the AI to focus on specific topics or learning goals for this version of the course.
                        </p>
                        <textarea
                            value={regenerateContext}
                            onChange={(e) => setRegenerateContext(e.target.value)}
                            placeholder="e.g. Focus heavily on API error handling and rate limits..."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.875rem'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={() => setShowRegenerateModal(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!user) return;
                                    setShowRegenerateModal(false);
                                    try {
                                        setLoading(true);
                                        const { generateCourseFromContent } = await import('../lib/courseGenerator');

                                        // Find the most recent course to update
                                        const { data: courses } = await supabase
                                            .from('courses')
                                            .select('id')
                                            .order('created_at', { ascending: false })
                                            .limit(1);

                                        const courseId = courses && courses.length > 0 ? courses[0].id : undefined;

                                        console.log('Regenerating course with context...', { courseId, context: regenerateContext });
                                        await generateCourseFromContent(user, regenerateContext, undefined, courseId);
                                        console.log('Regeneration complete.');

                                        // Refresh program data context
                                        await refreshProgram();

                                        alert('Course updated successfully!');
                                        setRegenerateContext('');
                                    } catch (e: any) {
                                        console.error('Regeneration failed:', e);
                                        alert('Failed to regenerate: ' + e.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="btn-primary"
                            >
                                <RefreshCw size={16} /> Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
