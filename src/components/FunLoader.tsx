import { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import './FunLoader.css';

interface FunLoaderProps {
    title?: string;
    steps?: string[];
    speed?: number; // ms per step
}

const DEFAULT_STEPS = [
    "Spinning up the AI engine...",
    "Analyzing content structure...",
    "Generating learning paths...",
    "Crafting scenario simulations...",
    "Polishing the experience..."
];

export function FunLoader({
    title = "Working our magic...",
    steps = DEFAULT_STEPS,
    speed = 1500
}: FunLoaderProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep < steps.length - 1) {
            const timer = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        }
    }, [currentStep, steps.length, speed]);

    return (
        <div className="fun-loader">
            <div className="loader-icon-large">
                <Sparkles size={32} className="text-primary" />
            </div>
            <h3>{title}</h3>

            <div className="processing-log">
                {steps.map((text, idx) => (
                    <div key={idx} className={`log-item ${idx <= currentStep ? 'visible' : ''} ${idx < currentStep ? 'completed' : ''} ${idx === currentStep ? 'active' : ''}`}>
                        <div className="log-icon">
                            {idx < currentStep ? (
                                <Check size={14} />
                            ) : idx === currentStep ? (
                                <Loader2 size={14} className="spin" />
                            ) : (
                                <div className="dot" />
                            )}
                        </div>
                        <span>{text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
