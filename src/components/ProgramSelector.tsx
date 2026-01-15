import { ChevronDown, Check } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { useState } from 'react';
import { cn } from '../lib/utils';
import './ProgramSelector.css';

interface ProgramSelectorProps {
    isCollapsed?: boolean;
}

export function ProgramSelector({ isCollapsed }: ProgramSelectorProps) {
    const { currentProgram, availablePrograms, switchProgram } = useProgram();
    const [isOpen, setIsOpen] = useState(false);

    // Completely hide if collapsed
    if (isCollapsed) return null;

    return (
        <div className="program-selector">
            <button
                className="program-trigger"
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            >
                <div className="program-info">
                    <span className="program-label">Current Track</span>
                    <span className="program-title">{currentProgram?.title || 'Select Track'}</span>
                </div>
                <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="program-dropdown glass-panel">
                    {availablePrograms.map((program) => (
                        <button
                            key={program.id}
                            className={cn(
                                "program-option",
                                currentProgram?.id === program.id && "active"
                            )}
                            onClick={() => {
                                switchProgram(program.id);
                                setIsOpen(false);
                            }}
                        >
                            <span className="option-title">{program.title}</span>
                            {/* <span className="option-role">{program.role}</span> */ /* Removed per user request */}
                            {currentProgram?.id === program.id && <Check size={16} className="text-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
