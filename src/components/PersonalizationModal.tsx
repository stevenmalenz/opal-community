import React, { useState } from 'react';
import { X, Save, Brain } from 'lucide-react';
import { useUserMemory } from '../context/UserMemoryContext';

interface PersonalizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export function PersonalizationModal({ isOpen, onClose, onSave }: PersonalizationModalProps) {
    const { addMemory, getMemory, updateMemory, memories } = useUserMemory();

    const [answers, setAnswers] = useState({
        role: '',
        industry: '',
        goal: '',
        context: ''
    });

    // Load existing memories when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setAnswers({
                role: getMemory('Role') || '',
                industry: getMemory('Industry') || '',
                goal: getMemory('Goal') || '',
                context: getMemory('Additional Context') || ''
            });
        }
    }, [isOpen, getMemory]);

    if (!isOpen) return null;

    const handleSave = () => {
        // Helper to save or update
        const saveOrUpdate = (key: string, value: string, category: 'professional' | 'preference') => {
            const existing = memories.find(m => m.key === key);
            if (existing) {
                updateMemory(existing.id, value);
            } else {
                addMemory(key, value, category);
            }
        };

        if (answers.role) saveOrUpdate('Role', answers.role, 'professional');
        if (answers.industry) saveOrUpdate('Industry', answers.industry, 'professional');
        if (answers.goal) saveOrUpdate('Goal', answers.goal, 'professional');
        if (answers.context) saveOrUpdate('Additional Context', answers.context, 'preference');

        if (onSave) onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-purple-600">
                        <Brain size={24} />
                        <h2 className="text-xl font-bold">Personalize Your Path</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            What is your current role?
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Account Executive, SDR, Manager"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={answers.role}
                            onChange={e => setAnswers({ ...answers, role: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            What industry do you sell into?
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. SaaS, Healthcare, Finance"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={answers.industry}
                            onChange={e => setAnswers({ ...answers, industry: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            What is your main goal this quarter?
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Hit Quota, Get Promoted"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            value={answers.goal}
                            onChange={e => setAnswers({ ...answers, goal: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Any other context? (Optional)
                        </label>
                        <textarea
                            placeholder="e.g. I prefer short lessons, I struggle with closing, etc."
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 min-h-[80px]"
                            value={answers.context}
                            onChange={e => setAnswers({ ...answers, context: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Save & Personalize
                    </button>
                </div>
            </div>
        </div>
    );
}
