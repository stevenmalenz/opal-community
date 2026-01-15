import { ChevronRight, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PathCardProps {
    title: string;
    progress: number;
    currentStep: number;
    totalSteps: number;
    link: string;
}

export function PathCard({ title, progress, currentStep, totalSteps, link }: PathCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <Map size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Current Path</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{progress}% Complete</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {title}
            </h3>

            <p className="text-gray-500 text-sm mb-6">
                Step {currentStep} of {totalSteps} completed
            </p>

            <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <Link
                    to={link}
                    className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"
                >
                    <ChevronRight size={20} />
                </Link>
            </div>
        </div>
    );
}
