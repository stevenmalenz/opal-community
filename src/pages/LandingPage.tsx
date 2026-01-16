import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    Sprout,
    X,
    ChevronDown,
    ChevronRight,
    Map,
    PenTool,
    Cpu,
    ShieldCheck,
    Rocket,
    CheckCircle,
    Zap,
    Search,
    ShieldAlert,
    LayoutTemplate,
    Languages,
    BarChart3,
    Plus,
    Linkedin,
    Book,
    GraduationCap,
    Sparkles,
    FileText,
    Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';
import './LandingPage.css';

// Adventure Map Card Data
const adventureCards = [
    { day: 1, title: 'Ideate', icon: Map, outcome: "Say goodbye to grunt work. We'll audit your week and find the high-impact tasks begging to be automated." },
    { day: 2, title: 'Blueprint', icon: PenTool, outcome: "Draw the blueprint. No coding needed! We'll map out a logic flow that thinks exactly like you do." },
    { day: 3, title: 'Build', icon: Cpu, outcome: "It's alive! Configure your custom Agents to write, analyze, and create with your brand's unique voice." },
    { day: 4, title: 'Test', icon: ShieldCheck, outcome: "Battle test mode. We'll push your agents to the limit to ensure they deliver gold, every single time." },
];

// Agent Use Cases
const agents = [
    { name: 'The Trend Hunter', icon: Search, color: 'blue', desc: 'Scours the web for emerging topics in your niche, summarizes them, and drafts 5 LinkedIn posts ready for review.' },
    { name: 'The Compliance Guardian', icon: ShieldAlert, color: 'purple', desc: 'Automatically checks every draft against your brand guidelines, legal requirements, and tone of voice. Zero errors.' },
    { name: 'The SEO Architect', icon: LayoutTemplate, color: 'orange', desc: 'Takes a keyword, generates a full blog outline, writes the meta description, and suggests internal linking structures.' },
    { name: 'The Global Voice', icon: Languages, color: 'pink', desc: 'Instantly translates and culturally adapts your campaign assets into 5 languages, preserving the emotional hook.' },
    { name: 'The Analyst', icon: BarChart3, color: 'teal', desc: 'Digests your weekly analytics reports and writes a plain-English executive summary highlighting wins and risks.' },
];

// Resources/Experts
const experts = [
    { name: 'Alex Wald', role: 'Senior PM, Opal AI', badge: 'Coaching', badgeColor: 'emerald', desc: '1:1 strategic guidance to unblock specific use cases.', img: 'https://media.licdn.com/dms/image/v2/D5603AQEoV7hZN5e4ZQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1702112215056?e=1769644800&v=beta&t=GPTP3ozZiEKOVJfKnPLR7L7Psh9ieNzIhffJAxSsuOA' },
    { name: 'Michiel Dorjee', role: 'Director, Digital Exp.', badge: 'Workshops', badgeColor: 'purple', desc: 'Live sessions on SEO, AEO, and high-converting UX.', img: 'https://media.licdn.com/dms/image/v2/C4D03AQFHOlModL8kXQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1597828267590?e=1769644800&v=beta&t=r9__Kb-fKgOaMHL96Q4sQJIu4rFlwMPmTapkuW4pVPQ' },
    { name: 'Patrick Lam', role: 'Tech Community Leader', badge: 'Community', badgeColor: 'blue', desc: 'Leading developer content & global community programs.', img: 'https://media.licdn.com/dms/image/v2/C4E03AQH0o1V06vVRMg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1555534522705?e=1769644800&v=beta&t=npyw_kAm_CsGGU92ljrU7e8eaIOQa0vmGrYyyV8_R7w' },
];

export function LandingPage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [revealedCards, setRevealedCards] = useState<number[]>([]);
    const [launchRevealed, setLaunchRevealed] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // GSAP Hero Animation
    useEffect(() => {
        const elements = document.querySelectorAll('.hero-anim');
        gsap.to(elements, {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            delay: 0.2
        });
    }, []);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        document.body.style.overflow = isModalOpen ? 'auto' : 'hidden';
    };

    const toggleCard = (day: number) => {
        if (revealedCards.includes(day)) {
            setRevealedCards(revealedCards.filter(d => d !== day));
        } else {
            setRevealedCards([...revealedCards, day]);
        }
    };

    const toggleLaunch = () => {
        if (!launchRevealed) {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.7 },
                colors: ['#34d399', '#10b981', '#ffffff']
            });
        }
        setLaunchRevealed(!launchRevealed);
    };

    const handleApplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Application Received! We will be in touch shortly.');
        toggleModal();
    };

    return (
        <div className="opal-landing">
            {/* Background Glows */}
            <div className="glow-orb glow-top-left" />
            <div className="glow-orb glow-bottom-right" />

            {/* Apply Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-backdrop" onClick={toggleModal} />
                    <div className="modal-content">
                        <button onClick={toggleModal} className="modal-close">
                            <X size={24} />
                        </button>

                        <h3 className="modal-title">Request Access</h3>
                        <p className="modal-subtitle">Join the waitlist for the next cohort. We review applications weekly.</p>

                        <form onSubmit={handleApplySubmit} className="modal-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="Jane Doe" required />
                            </div>
                            <div className="form-group">
                                <label>LinkedIn URL</label>
                                <input type="url" placeholder="linkedin.com/in/..." required />
                            </div>
                            <div className="form-group">
                                <label>Company Email</label>
                                <input type="email" placeholder="jane@company.com" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Optimizely Customer?</label>
                                    <div className="select-wrapper">
                                        <select>
                                            <option>Yes</option>
                                            <option>No</option>
                                        </select>
                                        <ChevronDown size={16} className="select-icon" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Have Opal?</label>
                                    <div className="select-wrapper">
                                        <select>
                                            <option>Yes</option>
                                            <option>No</option>
                                        </select>
                                        <ChevronDown size={16} className="select-icon" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn-apply">
                                Submit Application
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="opal-nav">
                <div className="nav-container">
                    <Link to="/" className="nav-logo">
                        <div className="status-dot" />
                        <span>Opal <span className="logo-italic">Vanguard</span></span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link active">Home</Link>
                        <Link to="/tools" className="nav-link">Tools</Link>
                        <Link to="/course" className="nav-link">AI Course</Link>
                        <Link to="/agent" className="nav-link">Agent Library</Link>
                    </div>

                    <a href="https://optimizely.com/opal" target="_blank" rel="noopener noreferrer" className="btn-nav-apply">
                        Get Opal
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section" ref={heroRef}>
                <div className="hero-content">
                    <div className="hero-anim hero-badge">
                        <Sprout size={12} />
                        <span>Applications open for Summer '26</span>
                    </div>

                    <h1 className="hero-anim hero-title">
                        Master Opal AI alongside <br />
                        <span className="hero-title-accent">the sharpest marketers.</span>
                    </h1>

                    <p className="hero-anim hero-subtitle">
                        Join the community of marketers who are learning how to master AI, getting more out of Optimizely, and building agents that save them 10+ hours a week, all through Opal.
                    </p>

                    <div className="hero-anim hero-actions">
                        <button onClick={toggleModal} className="btn-primary-hero">
                            Apply to Join
                            <ArrowRight size={16} />
                        </button>
                        <button onClick={() => navigate('/tools')} className="btn-secondary-hero">
                            <Cpu size={16} />
                            Explore Tools
                        </button>
                    </div>

                    <div className="hero-anim hero-social-proof">
                        <div className="avatar-stack">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="" />
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" alt="" />
                            <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&auto=format&fit=crop" alt="" />
                        </div>
                        <p>Joined by 400+ <span>marketers</span> from Spotify, Nike, & Adobe</p>
                    </div>
                </div>

                <div className="hero-grid-bg" />
            </header>

            {/* Chat Narrative Section */}
            <section className="chat-section">
                <div className="section-container">
                    <div className="section-header center">
                        <h2>You're not behind. <br /><span className="accent">You just need the map.</span></h2>
                    </div>

                    <div className="chat-card">
                        <div className="chat-glow" />

                        <div className="chat-messages">
                            {/* Message 1 */}
                            <div className="chat-message user">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" className="chat-avatar" />
                                <div className="chat-content">
                                    <div className="chat-name">Sarah, Brand Manager</div>
                                    <div className="chat-bubble user-bubble">
                                        Honestly, I'm overwhelmed. 😰 Everyone says "just use AI" but the workflows feel so complicated. I feel like I'm just guessing.
                                    </div>
                                </div>
                            </div>

                            {/* Message 2 */}
                            <div className="chat-message assistant">
                                <div className="chat-content">
                                    <div className="chat-name assistant-name">Opal Vanguard</div>
                                    <div className="chat-bubble assistant-bubble">
                                        Totally normal. We've all been there! Don't start from scratch. <br /><br />
                                        Try the <span className="highlight">"Q1 Experiment Ideas"</span> template in the library. It's pre-prompted for exactly this.
                                    </div>
                                </div>
                                <div className="chat-avatar-assistant">OV</div>
                            </div>

                            {/* Message 3 */}
                            <div className="chat-message user">
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" className="chat-avatar" />
                                <div className="chat-content">
                                    <div className="chat-name">Sarah, Brand Manager</div>
                                    <div className="chat-bubble user-bubble success">
                                        Okay wow... that was shockingly easy. ✨<br />
                                        I just did 4 hours of variations in 15 minutes. Is it always this fast?
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fast Track Section */}
            <section id="cohort" className="fasttrack-section">
                <div className="section-container">

                    {/* Context */}
                    <div className="fasttrack-intro">
                        <div className="fasttrack-text">
                            <span className="section-label">The 1-Week Fast Track</span>
                            <h2>Don't just learn. <br /><span className="accent">Build something real.</span></h2>
                            <p className="text-muted">
                                We know you've tried AI tools before and felt disappointed. The "magic" usually fades when you try to do real work.
                            </p>
                            <p className="text-highlight">
                                In your first week at Vanguard, you will build and ship a production-ready workflow in Opal that saves you 10+ hours a week.
                            </p>
                        </div>

                        <div className="workflow-preview">
                            <div className="glass-card workflow-card">
                                <div className="workflow-grid-bg" />

                                <div className="workflow-content">
                                    {/* Sidebar */}
                                    <div className="workflow-sidebar">
                                        <div className="sidebar-label">Agents</div>
                                        <div className="agent-item"><div className="dot blue" /> Brand Safe Check</div>
                                        <div className="agent-item"><div className="dot purple" /> Translate (DE/FR)</div>
                                        <div className="agent-item"><div className="dot orange" /> SEO Optimize</div>
                                        <div className="agent-item"><div className="dot pink" /> Image Gen</div>
                                    </div>

                                    {/* Canvas */}
                                    <div className="workflow-canvas">
                                        <div className="workflow-node">
                                            <div className="node-icon emerald"><FileText size={16} /></div>
                                            <div className="node-info">
                                                <div className="node-label">Trigger</div>
                                                <div className="node-title">Winter Brief</div>
                                            </div>
                                        </div>

                                        <div className="connector-line" />

                                        <div className="workflow-node">
                                            <div className="node-icon purple"><Sparkles size={16} /></div>
                                            <div className="node-info">
                                                <div className="node-label">Opal AI</div>
                                                <div className="node-title">Generate Assets</div>
                                            </div>
                                        </div>

                                        <div className="connector-line" />

                                        <div className="workflow-node active-node">
                                            <div className="active-badge">Active</div>
                                            <div className="node-icon blue"><Share2 size={16} /></div>
                                            <div className="node-info">
                                                <div className="node-label">Output</div>
                                                <div className="node-title">Social Suite</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* The Map */}
                    <div className="adventure-map">
                        <div className="map-header">
                            <h2><span className="accent">The Map</span></h2>
                            <p>
                                Walk away with a series of pre-built agents that will <span className="highlight">double your productivity</span>, <span className="highlight">save you hours each week</span>, and give you <span className="highlight">confidence to build any agent</span> you could dream of.
                            </p>
                        </div>

                        {/* SVG Path */}
                        <svg className="adventure-path-svg" viewBox="0 0 1000 1000" fill="none">
                            <path d="M 350 80 C 350 180, 650 180, 650 280 C 650 380, 350 380, 350 480 C 350 580, 650 580, 650 680 C 650 780, 500 780, 500 880"
                                stroke="#34d399" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" fill="none" />
                        </svg>

                        <div className="adventure-grid">
                            {/* Day 1 - Left aligned */}
                            <div className="advent-row left">
                                <div className={`advent-card ${revealedCards.includes(1) ? 'revealed' : ''}`} onClick={() => toggleCard(1)}>
                                    <div className="advent-inner">
                                        <div className="advent-front">
                                            <span className="day-label">Day 1</span>
                                            <Map size={16} className="day-icon" />
                                            <div className="day-title">Ideate</div>
                                            <div className="reveal-hint">Reveal <ChevronRight size={12} /></div>
                                        </div>
                                        <div className="advent-back">
                                            <div className="outcome-header">
                                                <CheckCircle size={16} />
                                                <span>Outcome</span>
                                            </div>
                                            <p>{adventureCards[0].outcome}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Day 2 - Right aligned */}
                            <div className="advent-row right">
                                <div className={`advent-card ${revealedCards.includes(2) ? 'revealed' : ''}`} onClick={() => toggleCard(2)}>
                                    <div className="advent-inner">
                                        <div className="advent-front">
                                            <span className="day-label">Day 2</span>
                                            <PenTool size={16} className="day-icon" />
                                            <div className="day-title">Blueprint</div>
                                            <div className="reveal-hint">Reveal <ChevronRight size={12} /></div>
                                        </div>
                                        <div className="advent-back">
                                            <div className="outcome-header">
                                                <CheckCircle size={16} />
                                                <span>Outcome</span>
                                            </div>
                                            <p>{adventureCards[1].outcome}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Day 3 - Left aligned */}
                            <div className="advent-row left">
                                <div className={`advent-card ${revealedCards.includes(3) ? 'revealed' : ''}`} onClick={() => toggleCard(3)}>
                                    <div className="advent-inner">
                                        <div className="advent-front">
                                            <span className="day-label">Day 3</span>
                                            <Cpu size={16} className="day-icon" />
                                            <div className="day-title">Build</div>
                                            <div className="reveal-hint">Reveal <ChevronRight size={12} /></div>
                                        </div>
                                        <div className="advent-back">
                                            <div className="outcome-header">
                                                <CheckCircle size={16} />
                                                <span>Outcome</span>
                                            </div>
                                            <p>{adventureCards[2].outcome}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Day 4 - Right aligned */}
                            <div className="advent-row right">
                                <div className={`advent-card ${revealedCards.includes(4) ? 'revealed' : ''}`} onClick={() => toggleCard(4)}>
                                    <div className="advent-inner">
                                        <div className="advent-front">
                                            <span className="day-label">Day 4</span>
                                            <ShieldCheck size={16} className="day-icon" />
                                            <div className="day-title">Test</div>
                                            <div className="reveal-hint">Reveal <ChevronRight size={12} /></div>
                                        </div>
                                        <div className="advent-back">
                                            <div className="outcome-header">
                                                <CheckCircle size={16} />
                                                <span>Outcome</span>
                                            </div>
                                            <p>{adventureCards[3].outcome}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Day 5 - Center */}
                            <div className="advent-row center">
                                <div className={`advent-card launch-card ${launchRevealed ? 'revealed' : ''}`} onClick={toggleLaunch}>
                                    <div className="advent-inner">
                                        <div className="advent-front launch-front">
                                            <span className="day-label launch-label">Day 5</span>
                                            <Rocket size={16} className="day-icon launch-icon" />
                                            <div className="day-title launch-title">Launch</div>
                                            <div className="reveal-hint launch-hint">Tap to Launch <Sparkles size={12} /></div>
                                        </div>
                                        <div className="advent-back launch-back">
                                            <div className="outcome-header">
                                                <Zap size={16} />
                                                <span>Victory</span>
                                            </div>
                                            <p>The Big Launch! Deploy your army of agents. Watch them work while you take the credit (and a coffee break).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="map-hint">Click any card to preview the curriculum.</p>
                    </div>
                </div>
            </section>

            {/* Agent Use Cases Section */}
            <section id="agents" className="agents-section">
                <div className="section-container">
                    <div className="section-header center">
                        <span className="section-label">Use Cases</span>
                        <h2>Meet Your <span className="accent">New Team.</span></h2>
                        <p>
                            They don't take coffee breaks, but they love collaboration. Here are the most popular agents our community is building to handle the heavy lifting.
                        </p>
                    </div>

                    <div className="agents-grid">
                        {agents.map((agent, idx) => (
                            <div key={idx} className="glass-card agent-card-item">
                                <div className={`agent-icon ${agent.color}`}>
                                    <agent.icon size={24} />
                                </div>
                                <h3>{agent.name}</h3>
                                <p>{agent.desc}</p>
                            </div>
                        ))}

                        {/* Dream Agent Card */}
                        <div className="agent-card-dream" onClick={toggleModal}>
                            <div className="dream-icon">
                                <Plus size={24} />
                            </div>
                            <h3>Your Dream Agent</h3>
                            <p>What will you build?</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Instructor Section */}
            <section id="instructor" className="instructor-section">
                <div className="section-container">
                    <div className="instructor-card">
                        <div className="instructor-glow" />

                        <div className="instructor-content">
                            <div className="instructor-image">
                                <img src="https://media.licdn.com/dms/image/v2/D4E03AQE6DssX7CPIzQ/profile-displayphoto-crop_800_800/B4EZuKFPEfHMAI-/0/1767548187319?e=1769644800&v=beta&t=CQ_p3yiJk1m5XivMKa9eDcYeXDiR06gyQ2bulmEVJAE" alt="Steven Male" />
                                <div className="instructor-name-overlay">
                                    <h3>Steven Male</h3>
                                </div>
                            </div>

                            <div className="instructor-bio">
                                <h2>Your <span className="accent">Teacher.</span></h2>
                                <blockquote>
                                    "In 2025 I launched enablement and training programs that have taught AI Search and how to build agents to <span className="highlight">2,500+ senior professionals</span>."
                                </blockquote>
                                <p>
                                    Steven has built custom enterprise training for giants like <span className="highlight">KAYAK, Xero, HubSpot, & Klaviyo</span>. He previously built and sold a marketing agency, and led growth at multiple startups.
                                </p>

                                <div className="trusted-logos">
                                    <span>Trusted by teams at:</span>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" alt="Spotify" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg" alt="Cisco" />
                                </div>

                                <a href="https://linkedin.com/in/stevenmale" target="_blank" rel="noopener noreferrer" className="linkedin-btn">
                                    <Linkedin size={16} />
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Resources Section */}
            <section id="resources" className="resources-section">
                <div className="section-container">
                    <div className="section-header center">
                        <span className="section-label">The Vanguard Ecosystem</span>
                        <h2>Everything you need to <span className="accent">win.</span></h2>
                    </div>

                    <div className="resources-grid">
                        {experts.map((expert, idx) => (
                            <div key={idx} className="glass-card expert-card">
                                <img src={expert.img} alt={expert.name} className="expert-avatar" />
                                <div className="expert-info">
                                    <div className="expert-header">
                                        <h3>{expert.name}</h3>
                                        <span className={`expert-badge ${expert.badgeColor}`}>{expert.badge}</span>
                                    </div>
                                    <p className="expert-role">{expert.role}</p>
                                    <p className="expert-desc">{expert.desc}</p>
                                    <a href="#" className="expert-link">Book <ArrowRight size={12} /></a>
                                </div>
                            </div>
                        ))}

                        {/* Docs Card */}
                        <div className="glass-card resource-card">
                            <div className="resource-icon orange">
                                <Book size={20} />
                            </div>
                            <h3>The Knowledge Base</h3>
                            <p>Comprehensive guides, API references, and blueprints.</p>
                            <a href="https://support.optimizely.com/hc/en-us/categories/36242844454797-Optimizely-Opal" target="_blank" rel="noopener noreferrer" className="resource-btn">
                                Read Docs
                            </a>
                        </div>

                        {/* Academy Card */}
                        <div className="glass-card resource-card featured">
                            <div className="resource-icon emerald">
                                <GraduationCap size={20} />
                            </div>
                            <h3>Opal Academy</h3>
                            <p>On-demand video courses. Learn at your own pace.</p>
                            <Link to="/course" className="resource-btn featured-btn">
                                Start Learning
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="cta-section">
                <div className="section-container center">
                    <h2>Ready to <span className="accent">Start?</span></h2>
                    <p>
                        The next cohort is filling up. Secure your spot in the Vanguard and start building your future today.
                    </p>

                    <button onClick={toggleModal} className="btn-primary-hero large">
                        Apply to Join
                        <ArrowRight size={16} />
                    </button>
                </div>

                <div className="cta-glow" />
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

export default LandingPage;
