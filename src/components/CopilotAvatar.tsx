import { useMemo } from 'react';
import { Crown, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface CopilotAvatarProps {
    level: number;
    streak: number;
    className?: string;
    placement?: 'right' | 'left' | 'top-left';
}

export function CopilotAvatar({ level, streak, className, placement = 'right' }: CopilotAvatarProps) {

    const evolutionStage = useMemo(() => {
        // Always use the cat avatar, but change border/shadow based on level
        const base = {
            title: "Study Buddy",
            image: "/avatars/cat-avatar.jpg",
            desc: "Always here to help!"
        };

        if (level >= 10) return {
            ...base,
            title: "Executive Cat",
            border: "border-yellow-400",
            shadow: "shadow-yellow-200",
        };
        if (level >= 5) return {
            ...base,
            title: "Manager Cat",
            border: "border-indigo-400",
            shadow: "shadow-indigo-200",
        };
        if (level >= 3) return {
            ...base,
            title: "Senior Cat",
            border: "border-blue-400",
            shadow: "shadow-blue-200",
        };
        return {
            ...base,
            title: "Intern Cat",
            border: "border-slate-300",
            shadow: "shadow-slate-200",
        };
    }, [level]);

    return (
        <div className={cn("relative group cursor-help", className)}>
            {/* Avatar Circle */}
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500 overflow-hidden bg-slate-100",
                evolutionStage.border,
                "hover:scale-110 hover:shadow-lg"
            )}>
                <img
                    src={evolutionStage.image}
                    alt={evolutionStage.title}
                    className="w-full h-full object-cover"
                />

                {/* Level Badge */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white z-10">
                    {level}
                </div>
            </div>

            {/* Streak Flame (Only if streak > 0) */}
            {streak > 0 && (
                <div className="absolute -top-2 -right-2 animate-bounce z-20">
                    <div className="relative">
                        <Zap size={16} className="text-orange-500 fill-orange-500" />
                    </div>
                </div>
            )}

            {/* Hover Tooltip / Stats Card */}
            <div className={cn(
                "absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-56",
                placement === 'right' && "left-14 top-0",
                placement === 'left' && "right-14 bottom-0",
                placement === 'top-left' && "right-0 bottom-16"
            )}>
                <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 text-sm">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                        {evolutionStage.title}
                        {level >= 10 && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{evolutionStage.desc}</div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Streak</span>
                            <span className="font-medium text-orange-500">{streak} Days 🔥</span>
                        </div>

                        {/* XP Bar */}
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>Level {level}</span>
                                <span>Level {level + 1}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                                    style={{ width: '65%' }} // Mock progress for now
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
