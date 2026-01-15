import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Card } from './Card';
import { useProgram } from '../context/ProgramContext';
import { generateExplainBackTopic } from '../lib/contextDrillsService';
import './ExplainBack.css';

export function ExplainBack() {
    const { currentProgram } = useProgram();
    const [concept, setConcept] = useState('Loading...');
    const [conceptContext, setConceptContext] = useState('');
    const [isLoadingTopic, setIsLoadingTopic] = useState(true);
    const [explanation, setExplanation] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<{ score: number; text: string } | null>(null);

    useEffect(() => {
        loadTopic();
    }, []);

    const loadTopic = async () => {
        setIsLoadingTopic(true);

        // Extract content from course
        if (!currentProgram) return null;

        const courseContent = currentProgram.learningPath
            .flatMap(module => module.lessons)
            .map(lesson => lesson.content || lesson.title)
            .join('\n\n')
            .substring(0, 3000);

        const topic = await generateExplainBackTopic(courseContent);

        if (topic) {
            setConcept(topic.concept);
            setConceptContext(topic.context);
        } else {
            // Fallback to first lesson title
            const firstLesson = currentProgram.learningPath[0]?.lessons[0];
            setConcept(firstLesson?.title || 'Core Concept');
            setConceptContext('Explain this concept in your own words.');
        }

        setIsLoadingTopic(false);
    };

    const KEYWORDS = ['why', 'how', 'because', 'example', 'specifically', 'step', 'process', 'result'];

    const handleAnalyze = async () => {
        if (!explanation.trim()) return;
        setIsAnalyzing(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const normalizedText = explanation.toLowerCase();
        const foundKeywords = KEYWORDS.filter(k => normalizedText.includes(k));
        const wordCount = explanation.trim().split(/\s+/).length;
        const score = Math.min(10, Math.floor((foundKeywords.length / 3) * 5 + (wordCount / 50) * 5));

        let feedbackText = '';
        if (score >= 8) {
            feedbackText = "Excellent! You provided a clear, detailed explanation with good examples.";
        } else if (score >= 5) {
            feedbackText = `Good start, but you missed some key concepts. Try to include terms like: ${KEYWORDS.filter(k => !normalizedText.includes(k)).slice(0, 3).join(', ')}.`;
        } else {
            feedbackText = "This explanation needs more detail. Focus on WHY and HOW this concept works.";
        }

        setFeedback({
            score: Math.max(1, score),
            text: feedbackText
        });
        setIsAnalyzing(false);
    };

    const [isRecording, setIsRecording] = useState(false);

    // Mock recording for now since we don't have transcription API
    const handleRecordToggle = () => {
        if (isRecording) {
            setIsRecording(false);
            // Simulate transcription
            setExplanation(prev => prev + " This feature allows users to implement workflows step by step.");
        } else {
            setIsRecording(true);
        }
    };

    return (
        <div className="explain-back-container">
            <Card className="concept-card">
                <div className="card-header">
                    <span className="badge">Concept to Teach</span>
                    <h3>{concept}</h3>
                </div>
                <p className="instruction">
                    {conceptContext || 'Explain this concept as if you were teaching a colleague. Focus on the "Why" and "How".'}
                </p>
                <button className="btn-secondary" onClick={loadTopic} disabled={isLoadingTopic} style={{ marginTop: '1rem' }}>
                    {isLoadingTopic ? 'Loading...' : 'New Topic'}
                </button>
            </Card>

            <div className="input-section">
                <textarea
                    className="explanation-input"
                    placeholder="Start your explanation here..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    rows={6}
                />
                <div className="controls">
                    <button
                        className={`btn-secondary ${isRecording ? 'recording-pulse' : ''}`}
                        onClick={handleRecordToggle}
                    >
                        <Mic size={18} /> {isRecording ? 'Stop Recording' : 'Record Answer'}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleAnalyze}
                        disabled={!explanation.trim() || isAnalyzing}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Submit Explanation'}
                    </button>
                </div>
            </div>

            {feedback && (
                <div className="feedback-section glass-panel">
                    <div className="feedback-header">
                        <div className="score-ring">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path
                                    className="circle"
                                    strokeDasharray={`${feedback.score * 10}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <text x="18" y="20.35" className="percentage">{feedback.score}</text>
                            </svg>
                        </div>
                        <div className="feedback-summary">
                            <h4>AI Assessment</h4>
                            <p>{feedback.text}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
