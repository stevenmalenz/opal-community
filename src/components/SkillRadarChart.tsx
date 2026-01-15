

interface Skill {
    name: string;
    score: number;
}

interface SkillRadarChartProps {
    skills: Skill[];
}

export function SkillRadarChart({ skills }: SkillRadarChartProps) {
    // Simple SVG Radar Chart Implementation
    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 20;
    const angleStep = (Math.PI * 2) / skills.length;

    const getCoordinates = (value: number, index: number) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
    };

    const points = skills.map((skill, i) => {
        const { x, y } = getCoordinates(skill.score, i);
        return `${x},${y}`;
    }).join(' ');

    const bgPoints = skills.map((_, i) => {
        const { x, y } = getCoordinates(100, i);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Polygon */}
                <polygon points={bgPoints} fill="none" stroke="#e5e7eb" strokeWidth="1" />

                {/* Inner Grid (50%) */}
                <polygon
                    points={skills.map((_, i) => {
                        const { x, y } = getCoordinates(50, i);
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />

                {/* Data Polygon */}
                <polygon points={points} fill="rgba(37, 99, 235, 0.2)" stroke="#2563eb" strokeWidth="2" />

                {/* Labels */}
                {skills.map((skill, i) => {
                    const { x, y } = getCoordinates(115, i); // Push labels out a bit
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[10px] fill-gray-500 font-medium uppercase"
                        >
                            {skill.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
