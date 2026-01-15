
import { ActivityCard } from '../Dashboard/ActivityCard';
import { SkillProgress } from '../Dashboard/SkillProgress';

// Wrapper for the Activity/Streak Card
export function ActivityBubble({ streak }: { streak: number }) {
    return (
        <div className="max-w-sm w-full">
            <ActivityCard streak={streak} />
        </div>
    );
}

// Wrapper for the Skills Card
export function SkillsBubble({ skills }: { skills: any[] }) {
    return (
        <div className="max-w-md w-full bg-white rounded-3xl p-4 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 px-2">Your Skill Profile</h3>
            <SkillProgress skills={skills} />
        </div>
    );
}

// Wrapper for a "Task Offer" Card
export function TaskOfferBubble({ title, duration, type, onStart }: { title: string, duration: string, type: string, onStart: () => void }) {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm max-w-xs hover:shadow-md transition-shadow cursor-pointer" onClick={onStart}>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase ${type === 'quiz' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                    {type}
                </span>
                <span className="text-xs text-gray-400 font-medium">{duration}</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
            <button className="w-full py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                Start Now
            </button>
        </div>
    );
}
