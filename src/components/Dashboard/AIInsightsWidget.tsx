import { Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Recommendation {
    id: string;
    title: string;
    duration: string;
    type: string;
    link: string;
    completed?: boolean;
}

interface AIInsightsWidgetProps {
    recommendations: Recommendation[];
}

export function AIInsightsWidget({ recommendations }: AIInsightsWidgetProps) {
    return (
        <div className="bg-green-50 rounded-3xl p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-green-600" size={20} />
                <h3 className="text-lg font-bold text-green-900">AI Insights</h3>
            </div>
            <p className="text-green-700/80 mb-6 text-sm font-medium">
                AI has prepared these recommendations to improve your skills
            </p>

            <div className="space-y-3">
                {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-green-100/50 hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{rec.title}</h4>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    {rec.type === 'drills' ? '🎯' : '⏱️'} {rec.duration}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                                {rec.type === 'drills' ? 'Practice this exercise to improve.' : 'Complete this to strengthen understanding.'}
                            </p>
                        </div>

                        {rec.completed ? (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                <CheckCircle size={16} />
                                Complete
                            </div>
                        ) : (
                            <Link
                                to={rec.link}
                                className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-green-300 hover:text-green-700 transition-colors shadow-sm"
                            >
                                Start
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
