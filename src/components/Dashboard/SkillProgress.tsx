
interface Skill {
    name: string;
    level: number;
    color: string;
}

interface SkillProgressProps {
    skills: Skill[];
}

export function SkillProgress({ skills }: SkillProgressProps) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">Your Skills</h3>
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Details</button>
            </div>

            <div className="space-y-5">
                {skills.map((skill) => (
                    <div key={skill.name}>
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-bold text-gray-700 text-sm">{skill.name}</span>
                            <span className="font-bold text-gray-900 text-sm">{skill.level}%</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${skill.color}`}
                                style={{ width: `${skill.level}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
