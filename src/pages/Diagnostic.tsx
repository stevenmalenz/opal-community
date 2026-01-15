import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { Card } from '../components/Card';
import { useProgram } from '../context/ProgramContext';

import { cn } from '../lib/utils';
import './Diagnostic.css';

export function Diagnostic() {
    const navigate = useNavigate();
    const { currentProgram } = useProgram();

    if (!currentProgram || !currentProgram.diagnosticQuestions) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Diagnostic Found</h2>
                <p className="text-slate-500 mb-4">Create a track to start your assessment.</p>
            </div>
        );
    }

    const questions = currentProgram.diagnosticQuestions;
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentQuestion = questions[currentStep];
    const isLastStep = currentStep === questions.length - 1;
    const progress = ((currentStep + 1) / questions.length) * 100;

    const handleAnswer = (answer: string) => {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    };

    const handleNext = () => {
        if (isLastStep) {
            setIsSubmitting(true);
            // Simulate AI analysis
            setTimeout(() => {
                navigate('/skills');
            }, 2000);
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <div className="diagnostic-container">
            <div className="diagnostic-header">
                <h2>Diagnostic Assessment</h2>
                <p>Let's personalize your learning path.</p>
            </div>

            <div className="progress-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>

            <Card className="diagnostic-card">
                <div className="question-content">
                    <span className="step-indicator">Question {currentStep + 1} of {questions.length}</span>
                    <h3 className="question-text">{currentQuestion.question}</h3>

                    <div className="options-grid">
                        {currentQuestion.type === 'choice' || currentQuestion.type === 'rating' ? (
                            currentQuestion.options?.map((option) => (
                                <button
                                    key={option}
                                    className={cn(
                                        'option-btn',
                                        answers[currentQuestion.id] === option && 'selected'
                                    )}
                                    onClick={() => handleAnswer(option)}
                                >
                                    {answers[currentQuestion.id] === option && <Check size={16} />}
                                    {option}
                                </button>
                            ))
                        ) : (
                            <textarea
                                className="text-input"
                                placeholder={currentQuestion.placeholder}
                                value={answers[currentQuestion.id] || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                                rows={4}
                            />
                        )}
                    </div>
                </div>


                <div className="diagnostic-actions">
                    <button
                        className="btn-secondary"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSubmitting}
                    >
                        <ChevronLeft size={20} /> Back
                    </button>

                    <button
                        className="btn-primary"
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id] || isSubmitting}
                    >

                        {isSubmitting ? (
                            'Analyzing...'
                        ) : (
                            <>
                                {isLastStep ? 'Finish' : 'Next'} <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </Card>
        </div>
    );
}
