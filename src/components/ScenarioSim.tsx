import { useState, useRef } from 'react';
import { Mic, RotateCcw } from 'lucide-react';
import { Card } from './Card';
import type { Scenario } from '../types/program';
import './ScenarioSim.css';

interface ScenarioSimProps {
    scenario: Scenario;
}

export function ScenarioSim({ scenario }: ScenarioSimProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const [transcript, setTranscript] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Mock Transcription
                setTranscript("I understand your concern about the price. However, when you look at the total cost of ownership and the efficiency gains, our solution actually saves you 20% in the first year.");

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setPermissionError(null);
            setTranscript(''); // Clear previous transcript
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setPermissionError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleReset = () => {
        setAudioUrl(null);
        setIsRecording(false);
        setTranscript('');
        chunksRef.current = [];
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert("Response submitted successfully! (Mock)");
        setIsSubmitting(false);
        handleReset();
    };

    return (
        <div className="scenario-sim">
            <Card className="context-card">
                <div className="context-header">
                    <span className="badge">Scenario</span>
                    <h3>{scenario.title}</h3>
                </div>
                <p className="context-text">
                    <strong>Prospect:</strong> {scenario.role}<br />
                    <strong>Context:</strong> {scenario.context}<br />
                    <strong>Goal:</strong> {scenario.goal}
                </p>
            </Card>

            <div className="sim-interface">
                <div className="response-area">
                    <div className="recording-status">
                        {isRecording ? (
                            <div className="recording-indicator">
                                <span className="pulse-dot"></span>
                                <span>Recording...</span>
                                <div className="waveform-mock">
                                    <span></span><span></span><span></span><span></span><span></span>
                                </div>
                            </div>
                        ) : audioUrl ? (
                            <div className="audio-player-wrapper">
                                <audio controls src={audioUrl} className="audio-player" />
                                {transcript && (
                                    <div className="transcript-preview">
                                        <strong>Transcript:</strong>
                                        <p>"{transcript}"</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="placeholder-text">
                                {permissionError ? (
                                    <span className="error-text">{permissionError}</span>
                                ) : (
                                    "Press record and deliver your response..."
                                )}
                            </div>
                        )}
                    </div>

                    <div className="controls">
                        <button className="btn-secondary" onClick={handleReset} disabled={isRecording || isSubmitting}>
                            <RotateCcw size={18} /> Reset
                        </button>

                        {!audioUrl ? (
                            <button
                                className={`btn - record ${isRecording ? 'recording' : ''} `}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? (
                                    <>
                                        <div className="stop-icon" /> Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic size={24} /> Start Recording
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Response'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
