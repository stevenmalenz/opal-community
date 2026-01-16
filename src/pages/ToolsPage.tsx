import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, Copy, Check, SearchX } from 'lucide-react';
import './ToolsPage.css';

// Tools Data
const toolsData = [
    // CMP
    { name: "Create Task", call: "create_task", desc: "Generates a new task in CMP, optionally related to a campaign.", cat: "cmp" },
    { name: "Create Campaign", call: "create_campaign", desc: "Create new marketing campaigns within the Content Marketing Platform.", cat: "cmp" },
    { name: "Create Work Request", call: "create_work_request", desc: "Submit a new work request using a specified template.", cat: "cmp" },
    { name: "Get CMP Resource", call: "get_cmp_resource", desc: "Retrieves context info about a task, campaign, or work request.", cat: "cmp" },
    { name: "Update Task", call: "update_task", desc: "Modify task attributes like title, owner, start date, or due date.", cat: "cmp" },
    { name: "Add Comment (Task)", call: "add_comment_on_cmp_task", desc: "Post a comment with optional attachments to a specific task.", cat: "cmp" },
    { name: "Find Library Folder", call: "find_library_folder", desc: "Search for folders in the CMP library using pattern matching.", cat: "cmp" },
    { name: "Suggest Content", call: "suggest_structured_content", desc: "AI suggestions for articles, blogs, or posts for a CMP task.", cat: "cmp" },

    // CMS
    { name: "Create Content Item", call: "cms_create_content_item", desc: "Creates a new empty content instance based on a content type.", cat: "cms" },
    { name: "Get Content Data", call: "cms_get_content_data", desc: "Retrieve detailed CMS content data, specific versions or published.", cat: "cms" },
    { name: "Publish Content", call: "cms_publish_content_item", desc: "Make a content version visible to site visitors immediately or scheduled.", cat: "cms" },
    { name: "Update Content Item", call: "cms_update_content_item", desc: "Update properties of a content item using JSON Merge Patch.", cat: "cms" },
    { name: "List Content Types", call: "cms_list_content_types", desc: "Get a list of all available content types in the CMS.", cat: "cms" },

    // Experimentation
    { name: "Suggest Variations", call: "exp_suggest_flag_variations", desc: "Generates flag variations for feature experimentation based on hypothesis.", cat: "experimentation" },
    { name: "Top Experiments", call: "exp_program_reporting_top_experiments", desc: "Returns experiments with highest lift (winning or losing) in a timeframe.", cat: "experimentation" },
    { name: "Win Rate", call: "exp_program_reporting_win_rate", desc: "Computes the experimentation win rate over a given time window.", cat: "experimentation" },
    { name: "Visual Editor Improve", call: "exp_generate_visual_editor_element_improvement", desc: "Expert CSS/HTML suggestions to enhance a selected element.", cat: "experimentation" },
    { name: "Execute Query", call: "exp_execute_query", desc: "Run a template-based query against Optimizely OpenSearch.", cat: "experimentation" },

    // Analytics / Data
    { name: "Run GA4 Report", call: "run_report", desc: "Query Google Analytics 4 data with specific dimensions and metrics.", cat: "analytics" },
    { name: "Semrush Summary", call: "fetch_semrush_summary", desc: "Fetch domain-level insights, traffic, and engagement metrics.", cat: "analytics" },
    { name: "Profound Sentiment", call: "profound_sentiment_report", desc: "Get report data showing emotional responses across companies/topics.", cat: "analytics" },
    { name: "Profound Visibility", call: "profound_visibility_report", desc: "Track company visibility metrics and performance in AI answers.", cat: "analytics" },
    { name: "Salesforce Query", call: "salesforce_query", desc: "Query CRM for leads, contacts, opportunities, and accounts.", cat: "analytics" },

    // Gen AI / Creative
    { name: "Generate Video", call: "generate_video", desc: "Create high-quality videos from text/images using Google Veo 3.", cat: "genai" },
    { name: "Generate Image", call: "generate_or_edit_image", desc: "Create new images from text descriptions or edit existing ones.", cat: "genai" },
    { name: "Analyze Image", call: "analyze_image_content", desc: "Understand content of images (screenshots/uploads) to answer questions.", cat: "genai" },
    { name: "Ideate", call: "ideate", desc: "Brainstorm on a topic and generate a plan of action using tools.", cat: "genai" },

    // Utility / Web
    { name: "Browse Web", call: "browse_web", desc: "Browses multiple webpages concurrently and returns the content.", cat: "utility" },
    { name: "Search Web", call: "search_web", desc: "Perform a Google search for a given query.", cat: "utility" },
    { name: "Analyze PageSpeed", call: "analyze_pagespeed", desc: "Check performance, SEO, and accessibility via PageSpeed Insights.", cat: "utility" },
    { name: "Send Email", call: "send_email", desc: "Send emails with optional attachments via Opal Backend.", cat: "utility" },
    { name: "Create Canvas", call: "create_canvas", desc: "Initialize a collaborative AI canvas for real-time iteration.", cat: "utility" },
    { name: "Convert to PDF", call: "convert_to_pdf", desc: "Convert a file or webpage URL into a PDF document.", cat: "utility" }
];

const categories = [
    { id: 'all', label: 'All' },
    { id: 'cmp', label: 'CMP' },
    { id: 'cms', label: 'CMS' },
    { id: 'experimentation', label: 'Experimentation' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'genai', label: 'Gen AI' },
    { id: 'utility', label: 'Utility' },
];

const categoryColors: Record<string, string> = {
    cmp: 'blue',
    cms: 'orange',
    experimentation: 'purple',
    analytics: 'teal',
    genai: 'pink',
    utility: 'emerald',
};

export function ToolsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [copiedCall, setCopiedCall] = useState<string | null>(null);

    const filteredTools = useMemo(() => {
        return toolsData.filter(tool => {
            const matchesSearch =
                tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.call.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeFilter === 'all' || tool.cat === activeFilter;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeFilter]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCall(text);
            setTimeout(() => setCopiedCall(null), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="tools-page">
            {/* Background Glows */}
            <div className="glow-orb glow-top-left" />
            <div className="glow-orb glow-bottom-right" />

            {/* Navigation */}
            <nav className="opal-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <div className="status-dot" />
                        <span>Opal <span className="logo-italic">Vanguard</span></span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/tools" className="nav-link active">Tools</Link>
                        <Link to="/course" className="nav-link">AI Course</Link>
                        <Link to="/agent" className="nav-link">Agent Library</Link>
                    </div>

                    <a href="https://optimizely.com/opal" target="_blank" rel="noopener noreferrer" className="btn-nav-apply">
                        Get Opal
                    </a>
                </div>
            </nav>

            {/* Header */}
            <header className="tools-header">
                <div className="section-container">
                    <div className="tools-header-content">
                        <div className="tools-badge">
                            <Cpu size={12} />
                            <span>System Capabilities v2.0</span>
                        </div>
                        <h1>The <span className="accent">Arsenal.</span></h1>
                        <p>
                            Opal isn't just a chat bot. It's a fully integrated orchestration layer.
                            Browse the complete library of tools your agents can wield to automate the impossible.
                        </p>
                    </div>
                </div>
            </header>

            {/* Search & Filter */}
            <section className="tools-filter-bar">
                <div className="section-container">
                    <div className="filter-container">
                        <div className="search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search tools (e.g. 'analytics', 'create task')..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="category-filters">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`filter-pill ${activeFilter === cat.id ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(cat.id)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="tools-grid-section">
                <div className="section-container">
                    {filteredTools.length > 0 ? (
                        <div className="tools-grid">
                            {filteredTools.map((tool, idx) => (
                                <div key={idx} className="tool-card glass-card">
                                    <div className="tool-card-header">
                                        <span className={`tool-badge ${categoryColors[tool.cat]}`}>
                                            {tool.cat}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(tool.call)}
                                            className="copy-btn"
                                            title="Copy function name"
                                        >
                                            {copiedCall === tool.call ? (
                                                <Check size={16} className="copied" />
                                            ) : (
                                                <Copy size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <h3>{tool.name}</h3>
                                    <p>{tool.desc}</p>
                                    <div className="tool-code">
                                        <code>{tool.call}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <SearchX size={32} />
                            </div>
                            <h3>No tools found</h3>
                            <p>Try adjusting your search terms or category filter.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="opal-footer">
                <div className="footer-container">
                    <div className="footer-logo">
                        <div className="status-dot" />
                        <span>Opal Vanguard</span>
                    </div>

                    <p>&copy; 2026 Optimizely.</p>
                </div>
            </footer>
        </div>
    );
}

export default ToolsPage;
