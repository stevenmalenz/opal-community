import { Play, ArrowRight, Target, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeroCardProps {
    title: string;
    description: string;
    duration: string;
    type: string;
    link: string;
}

export function HeroCard({ title, description, duration, type, link }: HeroCardProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 text-white shadow-2xl transition-all hover:shadow-indigo-500/25 group">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-700"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-blue-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-700"></div>

            <div className="relative z-10 p-8 md:p-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg border border-white/10">
                            <Target size={20} className="text-purple-200" />
                        </div>
                        <span className="text-purple-200 font-bold tracking-wider uppercase text-xs">Daily Mission</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight tracking-tight">
                        {title}
                    </h2>
                    <p className="text-purple-100/90 mb-8 max-w-xl text-lg leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <Link
                        to={link}
                        className="relative overflow-hidden bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
                    >
                        <Play size={22} fill="currentColor" />
                        <span>Start Mission</span>
                        <ArrowRight size={20} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    </Link>

                    <div className="flex items-center gap-4 text-sm font-medium text-purple-200 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
                        <span className="flex items-center gap-1.5">
                            <Zap size={16} />
                            {type}
                        </span>
                        <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={16} />
                            {duration}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
