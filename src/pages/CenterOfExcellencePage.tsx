
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Download,
    Plus,
    CheckCircle,
    Star,
    ArrowUp,
    Filter
} from 'lucide-react';
import { libraryItems, requestItems } from '../data/coeData';
import './CenterOfExcellencePage.css';

export function CenterOfExcellencePage() {
    const [activeTab, setActiveTab] = useState<'library' | 'requests'>('library');
    const [libItems] = useState(libraryItems);
    const [reqItems, setReqItems] = useState(requestItems);

    const handleVote = (id: string) => {
        setReqItems(prev => prev.map(item =>
            item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
        ));
    };

    return (
        <div className="coe-page">
            {/* Background Effects */}
            <div className="glow-orb glow-top-center" />

            {/* Navigation (Shared with Course) */}
            <nav className="opal-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <div className="status-dot" />
                        <span>Opal <span className="logo-italic">Vanguard</span></span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/tools" className="nav-link">Tools</Link>
                        <Link to="/course" className="nav-link">AI Course</Link>
                        <Link to="/agent" className="nav-link active">Agent Library</Link>
                    </div>

                    <a href="https://optimizely.com/opal" target="_blank" rel="noopener noreferrer" className="btn-nav-apply">
                        Get Opal
                    </a>
                </div>
            </nav>

            <header className="coe-header">
                <div className="section-container center">
                    <div className="header-badge">
                        <Star size={14} />
                        <span>Community & Knowledge Base</span>
                    </div>
                    <h1>Agent <span className="text-gradient">Library</span></h1>
                    <p className="header-desc">
                        The official library of high-performance agents. Verified by Opal, built by the community.
                        Download what works, or request what you need.
                    </p>

                    <div className="coe-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
                            onClick={() => setActiveTab('library')}
                        >
                            Agent Library
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                            onClick={() => setActiveTab('requests')}
                        >
                            Wishlist & Requests
                        </button>
                    </div>
                </div>
            </header>

            <main className="coe-main section-container">
                {activeTab === 'library' ? (
                    <div className="library-view animate-in">
                        <div className="list-controls">
                            <div className="search-bar">
                                <Search size={18} />
                                <input type="text" placeholder="Search for agents, templates, workflows..." />
                            </div>
                            <div className="filter-btn">
                                <Filter size={18} />
                                <span>Filter</span>
                            </div>
                        </div>

                        <div className="library-grid">
                            {libItems.map(item => (
                                <div key={item.id} className="agent-card">
                                    <div className="card-top">
                                        <div className="card-header">
                                            <span className={`category-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                                            {item.verified && (
                                                <div className="verified-badge" title="Verified by Opal">
                                                    <CheckCircle size={14} />
                                                    <span>Verified</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>

                                    <div className="card-footer">
                                        <div className="author-info">
                                            <div className="author-avatar">{item.author[0]}</div>
                                            <div className="author-meta">
                                                <span className="author-name">{item.author}</span>
                                                <span className="author-role">{item.authorRole}</span>
                                            </div>
                                        </div>

                                        <div className="card-stats">
                                            <div className="stat with-border">
                                                <Download size={14} />
                                                <span>{item.stats.downloads}</span>
                                            </div>
                                            <button className="btn-download">
                                                Download JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="requests-view animate-in">
                        <div className="request-header">
                            <h2>Community Wishlist</h2>
                            <button className="btn-primary">
                                <Plus size={16} /> Submit Idea
                            </button>
                        </div>

                        <div className="requests-list">
                            {reqItems.sort((a, b) => b.upvotes - a.upvotes).map((item, idx) => (
                                <div key={item.id} className="request-row">
                                    <div className="vote-column">
                                        <button className="vote-btn" onClick={() => handleVote(item.id)}>
                                            <ArrowUp size={20} />
                                            <span className="vote-count">{item.upvotes}</span>
                                        </button>
                                    </div>
                                    <div className="req-content">
                                        <div className="req-top">
                                            <h3>{idx + 1}. {item.title}</h3>
                                            <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p>{item.description}</p>
                                        <div className="req-meta">
                                            <span className="meta-tag">{item.category}</span>
                                            <span className="meta-dot">•</span>
                                            <span>Requested by {item.author}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CenterOfExcellencePage;
