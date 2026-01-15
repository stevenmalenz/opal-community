import { Play, ArrowRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DailyMissionCardProps {
    title: string;
    description: string;
    duration: string;
    type: string;
    link: string;
}

export function DailyMissionCard({ title, description, duration, type, link }: DailyMissionCardProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl p-8">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-400 opacity-10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Target size={20} className="text-white" />
                    </div>
                    <span className="text-blue-100 font-semibold tracking-wide uppercase text-sm">Daily Mission</span>
                </div>

                <h2 className="text-3xl font-bold mb-3 leading-tight">{title}</h2>
                <p className="text-blue-100 mb-6 max-w-lg text-lg">{description}</p>

                <div className="flex items-center gap-6">
                    <Link
                        to={link}
                        className="group bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <Play size={20} fill="currentColor" />
                        Start Mission
                        <ArrowRight size={18} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                    <div className="flex items-center gap-4 text-sm font-medium text-blue-100">
                        <span>{type}</span>
                        <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                        <span>{duration}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
