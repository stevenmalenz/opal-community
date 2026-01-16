import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Clock,
    Users,
    Play,
    GraduationCap,
    Target,
    Zap,
    FileText,
    ExternalLink,
    ChevronDown,
    Award,
    CheckCircle
} from 'lucide-react';
import { aiFluencyCourse } from '../data/courseData';
import './PublicCoursePage.css';

export function PublicCoursePage() {
    const [expandedLevels, setExpandedLevels] = useState<string[]>(['level-1']);
    const [completedExperiments, setCompletedExperiments] = useState<string[]>([]);
    const headerRef = useRef<HTMLDivElement>(null);
    const levelsRef = useRef<HTMLDivElement>(null);

    const toggleLevel = (id: string) => {
        setExpandedLevels(prev =>
            prev.includes(id)
                ? prev.filter(levelId => levelId !== id)
                : [...prev, id]
        );
    };

    const toggleExperiment = (title: string) => {
        setCompletedExperiments(prev => {
            const newProgress = prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title];

            return newProgress;
        });
    };

    return (
        <div className="public-course-page">
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
                        <Link to="/tools" className="nav-link">Tools</Link>
                        <Link to="/course" className="nav-link active">AI Course</Link>
                        <Link to="/agent" className="nav-link">Agent Library</Link>
                        <Link to="/graduates" className="nav-link">Graduates</Link>
                    </div>

                    <a href="https://optimizely.com/opal" target="_blank" rel="noopener noreferrer" className="btn-nav-apply">
                        Get Opal
                    </a>
                </div>
            </nav>

            {/* Header */}
            <header className="course-header" ref={headerRef}>
                <div className="section-container center">
                    <div className="header-badge">
                        <GraduationCap size={14} />
                        <span>Opal Academy - Official Certification</span>
                    </div>

                    <h1>The AI Fluency <span className="text-gradient">Blueprint</span></h1>

                    <p className="course-description">
                        This 10-level course takes marketing professionals from casual ChatGPT users to building
                        AI workflows that save 10+ hours weekly. Designed for learning by doing.
                    </p>

                    <div className="course-meta">
                        <div className="meta-item">
                            <BookOpen size={16} />
                            <span>10 Levels</span>
                        </div>
                        <div className="meta-item">
                            <Clock size={16} />
                            <span>30-50 Hours</span>
                        </div>
                        <div className="meta-item">
                            <Users size={16} />
                            <span>Intermediate</span>
                        </div>
                        <div className="meta-item">
                            <Award size={16} />
                            <span>Certificate Included</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="course-content" ref={levelsRef}>
                <div className="section-container">
                    <div className="levels-container">
                        {aiFluencyCourse.map((level, index) => {
                            const isExpanded = expandedLevels.includes(level.id);
                            const totalExps = level.experiments.length;
                            const completedExps = level.experiments.filter(e => completedExperiments.includes(e.title)).length;
                            const isComplete = totalExps > 0 && totalExps === completedExps;

                            return (
                                <div key={level.id} className={`level-card glass-card ${isExpanded ? 'expanded' : ''} ${isComplete ? 'completed' : ''}`}>
                                    {/* Level Header (Always Visible) */}
                                    <div className="level-header" onClick={() => toggleLevel(level.id)}>
                                        <div className="level-badge-container">
                                            <div className={`level-number ${isComplete ? 'done' : ''}`}>
                                                {isComplete ? <CheckCircle size={16} /> : level.levelNumber}
                                            </div>
                                            {index < aiFluencyCourse.length - 1 && <div className="level-connector" />}
                                        </div>

                                        <div className="level-title-section">
                                            <div className="level-meta-top">
                                                <span className="level-duration"><Clock size={12} /> {level.duration}</span>
                                                {index === 9 && <span className="level-tag platform">Opal Native</span>}
                                                {completedExps > 0 && <span className="level-progress">{completedExps}/{totalExps} Done</span>}
                                            </div>
                                            <h3>{level.title}</h3>
                                            <div className="level-goal">
                                                <Target size={14} />
                                                <span>{level.goal}</span>
                                            </div>
                                        </div>

                                        <button className="level-toggle">
                                            <ChevronDown size={20} className={isExpanded ? 'rotate-180' : ''} />
                                        </button>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="level-body">
                                            {level.hook ? (
                                                <div className="flavor-content">
                                                    <div className="flavor-section hook">
                                                        <h4>The Hook</h4>
                                                        <p>{level.hook}</p>
                                                    </div>

                                                    <div className="flavor-section concept">
                                                        <h4>The Concept</h4>
                                                        {level.concept?.split('\n\n').map((paragraph, pIdx) => (
                                                            <p key={pIdx}>{paragraph}</p>
                                                        ))}
                                                    </div>

                                                    <div className="flavor-section example">
                                                        <h4>Real World Example</h4>
                                                        <p>{level.realWorldExample}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="level-description">{level.description}</p>
                                            )}

                                            {/* Experiments Grid - Renamed to The Challenge if flavor exists */}
                                            <div className="section-block">
                                                <h4>
                                                    <Zap size={16} className="text-yellow" />
                                                    {level.hook ? 'The Challenge' : 'Experiments'}
                                                </h4>
                                                <div className="experiments-grid">
                                                    {level.experiments.map((exp, i) => {
                                                        const isChecked = completedExperiments.includes(exp.title);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`experiment-card ${isChecked ? 'checked' : ''}`}
                                                                onClick={() => toggleExperiment(exp.title)}
                                                            >
                                                                <div className="exp-checkbox">
                                                                    {isChecked && <CheckCircle size={14} />}
                                                                </div>
                                                                <div className="exp-content">
                                                                    <div className="exp-header">
                                                                        <h5>{exp.title}</h5>
                                                                        <span className="exp-duration">{exp.duration}</span>
                                                                    </div>
                                                                    <p className="exp-desc">{exp.description}</p>
                                                                    <ul className="exp-steps">
                                                                        {exp.steps.map((step, s) => (
                                                                            <li key={s}>{step}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Resources List */}
                                            <div className="section-block">
                                                <h4><FileText size={16} className="text-blue" /> Resources</h4>
                                                <div className="resources-list">
                                                    {level.resources.map((res, i) => (
                                                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-item">
                                                            <div className="resource-icon">
                                                                {res.type === 'Video' ? <Play size={14} /> : <ExternalLink size={14} />}
                                                            </div>
                                                            <div className="resource-info">
                                                                <span className="resource-title">{res.title}</span>
                                                                <span className="resource-type">{res.type} • {res.duration}</span>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Milestone */}
                                            <div className="milestone-box">
                                                <div className="milestone-icon">
                                                    <Award size={20} />
                                                </div>
                                                <div className="milestone-content">
                                                    <span className="milestone-label">Milestone to Unlock Level {level.levelNumber + 1}</span>
                                                    <p>{level.milestone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

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

export default PublicCoursePage;
