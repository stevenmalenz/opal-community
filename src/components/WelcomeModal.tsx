import { useState, useEffect } from 'react';
import { X, Target, Sparkles, ArrowRight, User, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useUserMemory } from '../context/UserMemoryContext';
import './WelcomeModal.css';

interface WelcomeModalProps {
    onClose: () => void;
    courseName?: string;
}

export function WelcomeModal({ onClose, courseName = "Enablement Masterclass" }: WelcomeModalProps) {
    const { user } = useAuth();
    const { addMemory, getMemory } = useUserMemory();
    const [isClosing, setIsClosing] = useState(false);
    const [step, setStep] = useState<'welcome' | 'personalize' | 'confirm'>('welcome');

    // Form State
    const [role, setRole] = useState('');
    const [goal, setGoal] = useState('');
    const [kpis, setKpis] = useState('');

    // Load existing memory if available
    useEffect(() => {
        const existingRole = getMemory('Role');
        const existingGoal = getMemory('Goal');
        const existingKpis = getMemory('KPIs');
        if (existingRole) setRole(existingRole);
        if (existingGoal) setGoal(existingGoal);
        if (existingKpis) setKpis(existingKpis);
    }, [getMemory]);

    const handleClose = async () => {
        setIsClosing(true);
        // Persist that the user has seen the welcome modal
        if (user) {
            try {
                await supabase.auth.updateUser({
                    data: { has_seen_welcome: true }
                });
            } catch (error) {
                console.error("Failed to update user metadata:", error);
            }
        }
        setTimeout(() => onClose(), 300);
    };

    const handleSavePersonalization = () => {
        if (role) addMemory('Role', role, 'professional');
        if (goal) addMemory('Goal', goal, 'professional');
        if (kpis) addMemory('KPIs', kpis, 'professional');
        setStep('confirm');
    };

    return (
        <div className={`welcome - modal - overlay ${isClosing ? 'fade-out' : ''} `}>
            <div className={`welcome - modal glass - panel ${isClosing ? 'scale-out' : ''} `}>
                <button className="close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                {step === 'welcome' && (
                    <>
                        <div className="modal-header-visual">
                            <div className="icon-badge">
                                <Sparkles size={24} className="text-primary" />
                            </div>
                        </div>
                        <h2>Welcome to FlowLearn!</h2>
                        <p className="welcome-text">
                            Your team has selected the <strong>{courseName}</strong> path for you.
                            Let's personalize your experience to make it relevant to your role.
                        </p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <div className="feature-icon bg-blue-50 text-blue-600">
                                    <Target size={18} />
                                </div>
                                <div className="feature-content">
                                    <h4>Tailored for You</h4>
                                    <p>Content specific to your team's goals and your role.</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-primary large full-width" onClick={() => setStep('personalize')}>
                                Personalize My Path <ArrowRight size={18} className="ml-2" />
                            </button>
                            <button className="btn-text" onClick={handleClose}>
                                Skip for now
                            </button>
                        </div>
                    </>
                )}

                {step === 'personalize' && (
                    <>
                        <div className="modal-header-visual">
                            <div className="icon-badge">
                                <User size={24} className="text-blue-600" />
                            </div>
                        </div>
                        <h2>Tell us about you</h2>
                        <p className="welcome-text">
                            The AI will use this to tailor examples and quizzes to your specific context.
                        </p>

                        <div className="form-stack mb-6">
                            <div className="form-group">
                                <label>What is your current role?</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Account Executive"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="form-group">
                                <label>What is your main career goal?</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Become a Team Lead"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="form-group">
                                <label>Key KPIs you are measured on?</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Revenue, Churn Rate"
                                    value={kpis}
                                    onChange={(e) => setKpis(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-primary large full-width" onClick={handleSavePersonalization}>
                                Save & Personalize
                            </button>
                        </div>
                    </>
                )}

                {step === 'confirm' && (
                    <>
                        <div className="modal-header-visual">
                            <div className="icon-badge bg-green-100">
                                <CheckCircle size={24} className="text-green-600" />
                            </div>
                        </div>
                        <h2>All Set!</h2>
                        <p className="welcome-text">
                            We've saved your preferences. Would you like us to automatically tailor all future lesson content to match your role and goals?
                        </p>

                        <div className="bg-blue-50 p-4 rounded-xl mb-6 text-sm text-blue-800">
                            <strong>Note:</strong> This means you won't need to manually personalize each lesson. The AI will do it for you.
                        </div>

                        <div className="modal-actions">
                            <button className="btn-primary large full-width" onClick={handleClose}>
                                Yes, Tailor All Courses
                            </button>
                            <button className="btn-secondary full-width" onClick={handleClose}>
                                No, I'll do it manually
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
