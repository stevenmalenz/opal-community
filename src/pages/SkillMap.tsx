import { Link } from 'react-router-dom';
import { ArrowRight, Target, AlertCircle } from 'lucide-react';

import { Card } from '../components/Card';
import { useProgram } from '../context/ProgramContext';
import './SkillMap.css';


export function SkillMap() {
    const { currentProgram } = useProgram();

    if (!currentProgram || !currentProgram.skills) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Skill Map Found</h2>
                <p className="text-slate-500 mb-4">Create a track to generate your skill profile.</p>
            </div>
        );
    }

    const skills = currentProgram.skills;

    // Calculate radar chart points
    const getCoordinates = (score: number, index: number, total: number, radius: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const x = Math.cos(angle) * (radius * (score / 100));
        const y = Math.sin(angle) * (radius * (score / 100));
        return { x, y };
    };

    const size = 300;
    const center = size / 2;
    const radius = 100;
    const totalSkills = skills.length;

    const polyPoints = skills.map((skill, i) => {
        const { x, y } = getCoordinates(skill.score, i, totalSkills, radius);
        return `${center + x},${center + y}`;
    }).join(' ');




    return (
        <div className="skill-map-container">
            <div className="skill-header">
                <h2>Your Skill Profile</h2>
                <p>Based on your diagnostic and recent practice.</p>
            </div>

            <div className="skill-grid">
                {/* Radar Chart Card */}
                <Card className="radar-card">
                    <div className="radar-chart-container">
                        <svg width={size} height={size} className="radar-svg">
                            {/* Background Grid */}
                            {[20, 40, 60, 80, 100].map((level) => (
                                <polygon
                                    key={level}
                                    points={skills.map((_, i) => {
                                        const { x, y } = getCoordinates(level, i, totalSkills, radius);
                                        return `${center + x},${center + y}`;
                                    }).join(' ')}
                                    className="radar-grid"

                                />
                            ))}

                            {/* Axes */}
                            {skills.map((_, i) => {
                                const { x, y } = getCoordinates(100, i, totalSkills, radius);
                                return (

                                    <line
                                        key={i}
                                        x1={center}
                                        y1={center}
                                        x2={center + x}
                                        y2={center + y}
                                        className="radar-axis"
                                    />
                                );
                            })}

                            {/* Data Polygon */}
                            <polygon points={polyPoints} className="radar-polygon" />

                            {/* Data Points */}
                            {skills.map((skill, i) => {
                                const { x, y } = getCoordinates(skill.score, i, totalSkills, radius);
                                return (
                                    <g key={skill.id}>

                                        <circle cx={center + x} cy={center + y} r="4" className="radar-point" />
                                        {/* Labels positioned slightly outside */}
                                        <text
                                            x={center + x * 1.25}
                                            y={center + y * 1.25}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="radar-label"
                                        >
                                            {skill.name}
                                        </text>
                                    </g>

                                );
                            })}
                        </svg>
                    </div>
                </Card>

                {/* Gaps & Recommendations */}
                <div className="gaps-list">
                    <h3 className="section-title">Priority Focus Areas</h3>
                    {skills.filter(s => s.score < 75).map((skill) => (
                        <Card key={skill.id} className="gap-card">
                            <div className="gap-header">
                                <div className="gap-title">

                                    <AlertCircle size={20} className="text-accent" />
                                    <h4>{skill.name}</h4>
                                </div>
                                <span className="score-badge">{skill.score}/100</span>

                            </div>
                            <p className="gap-description">
                                Your performance in {skill.name} is below the team average.
                                Focus on this to improve your overall win rate.
                            </p>

                            <div className="gap-action">
                                <Link to="/practice" className="btn-small">
                                    Start Drill <ArrowRight size={16} />
                                </Link>
                            </div>
                        </Card>
                    ))}

                    <Card className="strength-card">
                        <div className="gap-header">
                            <div className="gap-title">
                                <Target size={20} className="text-secondary" />
                                <h4>Top Strength: Product Knowledge</h4>
                            </div>
                            <span className="score-badge high">90/100</span>
                        </div>
                        <p className="gap-description">
                            You're an expert here! Consider mentoring peers on the new product features.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
