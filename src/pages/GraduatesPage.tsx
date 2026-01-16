import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Award,
    Play,
    Linkedin,
    Globe,
    CheckCircle,
    Users
} from 'lucide-react';
import { graduates } from '../data/graduatesData';
import './GraduatesPage.css';

export function GraduatesPage() {
    const [activeCohort, setActiveCohort] = useState('All');

    // Extract unique cohorts and sort them
    const cohorts = ['All', ...Array.from(new Set(graduates.map(g => g.cohort))).sort()];

    const filteredGraduates = activeCohort === 'All'
        ? graduates
        : graduates.filter(g => g.cohort === activeCohort);

    return (
        <div className="graduates-page">
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
                        <Link to="/tools" className="nav-link">Tools</Link>
                        <Link to="/course" className="nav-link">AI Course</Link>
                        <Link to="/agent" className="nav-link">Agent Library</Link>
                        <Link to="/graduates" className="nav-link active">Graduates</Link>
                    </div>

                    <a href="https://optimizely.com/opal" target="_blank" rel="noopener noreferrer" className="btn-nav-apply">
                        Get Opal
                    </a>
                </div>
            </nav>

            {/* Header */}
            <header className="graduates-header">
                <div className="header-content">
                    <div className="header-badge">
                        <Award size={14} />
                        <span>Opal Academy - Official Certification</span>
                    </div>
                    <h1>Certified <span className="text-gradient">AI Marketers</span></h1>
                    <p className="header-desc">
                        Meet the certified AI marketers combining deep marketing expertise with Opal workflows to create an even larger impact.
                    </p>
                </div>
            </header>

            {/* Content Container */}
            <div className="content-container">
                {/* Cohort Tabs */}
                <div className="cohort-tabs">
                    {cohorts.map(cohort => (
                        <button
                            key={cohort}
                            className={`cohort-tab ${activeCohort === cohort ? 'active' : ''}`}
                            onClick={() => setActiveCohort(cohort)}
                        >
                            {cohort === 'All' ? 'All Graduates' : cohort}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="graduates-grid">
                    {filteredGraduates.map(grad => (
                        <div key={grad.id} className="graduate-card">
                            <div className="card-top">
                                <div className="avatar-wrapper">
                                    <img src={grad.imageUrl} alt={grad.name} className="grad-avatar" />
                                    <div className="verified-badge">
                                        <CheckCircle size={12} fill="#10b981" color="#fff" />
                                    </div>
                                </div>
                                <div className="grad-identity">
                                    <h3>{grad.name}</h3>
                                    <div className="grad-role">{grad.role}</div>
                                </div>
                            </div>

                            <div className="card-body">
                                <p className="workflow-desc">"{grad.description}"</p>
                            </div>

                            <div className="card-footer">
                                <div className="company-tag">
                                    <Globe size={14} />
                                    <span>{grad.company}</span>
                                </div>

                                {grad.workflowVideo && (
                                    <button className="btn-video-sm">
                                        <Play size={12} fill="currentColor" />
                                        <span>Workflow</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
