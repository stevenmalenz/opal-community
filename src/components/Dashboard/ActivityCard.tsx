import { Flame, Zap } from 'lucide-react';

interface ActivityCardProps {
    streak: number;
}

export function ActivityCard({ streak }: ActivityCardProps) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Activity</h3>
                <span className="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Flame size={12} fill="currentColor" />
                    {streak} days in row!
                </span>
            </div>

            <div className="flex items-end gap-1 h-16 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const isActive = i < 5; // Mock active days
                    const height = isActive ? ['60%', '80%', '40%', '100%', '70%'][i] : '20%';

                    return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full bg-gray-100 rounded-lg relative h-full overflow-hidden">
                                <div
                                    className={`absolute bottom-0 w-full rounded-lg transition-all duration-500 ${isActive ? 'bg-purple-400' : 'bg-gray-200'}`}
                                    style={{ height }}
                                >
                                    {isActive && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Zap size={10} className="text-white opacity-50" fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
