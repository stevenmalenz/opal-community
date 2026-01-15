import { Flame } from 'lucide-react';

interface StreakWidgetProps {
    streak: number;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${streak > 0 ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
                    <Flame size={24} fill={streak > 0 ? "currentColor" : "none"} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{streak}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Day Streak</div>
                </div>
            </div>
            {streak > 0 && (
                <div className="text-sm text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                    On Fire! 🔥
                </div>
            )}
        </div>
    );
}
