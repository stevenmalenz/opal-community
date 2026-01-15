interface Skill {
    name: string;
    score: number;
}

interface RadarChartProps {
    skills: Skill[];
}

export function RadarChart({ skills }: RadarChartProps) {
    const size = 300;
    const center = size / 2;
    const radius = 90; // Leave space for labels
    const angleStep = (Math.PI * 2) / skills.length;

    const getCoordinates = (value: number, index: number) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top (-90deg)
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
    };

    const points = skills.map((skill, i) => {
        const { x, y } = getCoordinates(skill.score, i);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center justify-center relative">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Web */}
                {[20, 40, 60, 80, 100].map((level) => (
                    <polygon
                        key={level}
                        points={skills.map((_, i) => {
                            const { x, y } = getCoordinates(level, i);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray={level === 100 ? "0" : "4 4"}
                    />
                ))}

                {/* Spokes */}
                {skills.map((_, i) => {
                    const { x, y } = getCoordinates(100, i);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data Area */}
                <polygon
                    points={points}
                    fill="url(#radarGradient)"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                />

                {/* Gradients */}
                <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {/* Data Points */}
                {skills.map((skill, i) => {
                    const { x, y } = getCoordinates(skill.score, i);
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="white"
                            stroke="#4f46e5"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Labels */}
                {skills.map((skill, i) => {
                    const { x, y } = getCoordinates(125, i); // Push labels further out

                    // Dynamic text anchor based on position
                    let textAnchor: "start" | "middle" | "end" = "middle";
                    if (x < center - 10) textAnchor = "end";
                    if (x > center + 10) textAnchor = "start";

                    // Dynamic baseline
                    let dominantBaseline: "auto" | "central" | "hanging" | "middle" = "middle";
                    if (y < center - 10) dominantBaseline = "auto"; // Top labels
                    if (y > center + 10) dominantBaseline = "hanging"; // Bottom labels

                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            dominantBaseline={dominantBaseline}
                            className="text-xs font-bold fill-gray-600 uppercase tracking-wider"
                            style={{ fontSize: '10px' }}
                        >
                            {skill.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
