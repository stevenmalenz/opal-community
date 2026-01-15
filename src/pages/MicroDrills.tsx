import { useState, useEffect } from 'react';
import { Zap, Check, X, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useProgram } from '../context/ProgramContext';
import { generateMicroDrills } from '../lib/contextDrillsService';
import { cn } from '../lib/utils';
import './MicroDrills.css';

interface Drill {
    id?: number;
    question: string;
    options: string[];
    correct: number;
}

const FALLBACK_DRILLS: Drill[] = [
    {
        id: 1,
        question: "Loading course-specific questions...",
        options: ["Please wait", "Generating from course content", "Using AI", "Almost ready"],
        correct: 0
    }
];

export function MicroDrills() {
    const { currentProgram } = useProgram();
    const [drills, setDrills] = useState<Drill[]>(FALLBACK_DRILLS);
    const [isLoadingDrills, setIsLoadingDrills] = useState(true);
    const [currentDrill, setCurrentDrill] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        if (currentProgram) {
            loadDrills();
        }
    }, [currentProgram]);

    const loadDrills = async () => {
        if (!currentProgram) return;

        setIsLoadingDrills(true);
        setCurrentDrill(0);
        setSelectedOption(null);
        setIsCorrect(null);

        // Extract content from course
        const courseContent = currentProgram.learningPath
            .flatMap(module => module.lessons)
            .map(lesson => `${lesson.title}: ${lesson.content || ''}`)
            .join('\n\n')
            .substring(0, 4000);

        const generatedDrills = await generateMicroDrills(courseContent, 5);

        if (generatedDrills && generatedDrills.length > 0) {
            setDrills(generatedDrills.map((drill: any, idx: number) => ({ ...drill, id: idx + 1 })));
        } else {
            // Fallback to lesson titles if AI fails
            const lessons = currentProgram.learningPath.flatMap(m => m.lessons).slice(0, 3);
            setDrills(lessons.map((lesson, idx) => ({
                id: idx + 1,
                question: `What is the main topic of "${lesson.title}"?`,
                options: [
                    lesson.title,
                    "Something else",
                    "Not this",
                    "Also not this"
                ],
                correct: 0
            })));
        }

        setIsLoadingDrills(false);
    };

    if (!currentProgram) return <div className="p-8">Loading...</div>;

    const handleOptionClick = (index: number) => {
        if (selectedOption !== null) return;

        setSelectedOption(index);
        const correct = index === drills[currentDrill].correct;
        setIsCorrect(correct);

        if (correct) {
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const handleNext = () => {
        if (currentDrill < drills.length - 1) {
            setCurrentDrill(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            loadDrills(); // Reload with new questions
        }
    };

    return (
        <div className="drills-container">
            <div className="drills-header">
                <div>
                    <h2>Micro-Drills</h2>
                    <p>Rapid-fire practice based on your course content.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="streak-counter">
                        <Zap size={20} className="streak-icon" />
                        <span>{streak} Streak</span>
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={loadDrills}
                        disabled={isLoadingDrills}
                    >
                        {isLoadingDrills ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                        {isLoadingDrills ? ' Loading...' : ' New Questions'}
                    </button>
                </div>
            </div>

            <div className="drill-area">
                <Card className="drill-card">
                    <div className="drill-progress">
                        Question {currentDrill + 1} of {drills.length}
                    </div>

                    <h3 className="drill-question">{drills[currentDrill].question}</h3>

                    <div className="options-list">
                        {drills[currentDrill].options.map((option, index) => (
                            <button
                                key={index}
                                className={cn(
                                    "drill-option",
                                    selectedOption === index && (isCorrect ? "correct" : "incorrect"),
                                    selectedOption !== null && index === drills[currentDrill].correct && "correct"
                                )}
                                onClick={() => handleOptionClick(index)}
                                disabled={selectedOption !== null || isLoadingDrills}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                {option}
                                {selectedOption === index && (
                                    <span className="option-status">
                                        {isCorrect ? <Check size={20} /> : <X size={20} />}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {selectedOption !== null && (
                        <div className="drill-footer">
                            <div className={cn("feedback-msg", isCorrect ? "success" : "error")}>
                                {isCorrect ? "Correct! Great job." : "Not quite. The correct answer is highlighted."}
                            </div>
                            <button className="btn-next" onClick={handleNext}>
                                {currentDrill === drills.length - 1 ? (
                                    <> <RefreshCw size={18} /> New Set </>
                                ) : (
                                    <> Next <ArrowRight size={18} /> </>
                                )}
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
