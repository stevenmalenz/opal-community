import { Mic, FileText, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Task {
    id: string;
    title: string;
    type: 'voice' | 'quiz' | 'writing';
    dueDate: string;
    status: 'due' | 'in-progress' | 'review';
    link: string;
}

interface TaskHubProps {
    tasks: Task[];
}

export function TaskHub({ tasks }: TaskHubProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'voice': return <Mic size={18} />;
            case 'quiz': return <Brain size={18} />;
            case 'writing': return <FileText size={18} />;
            default: return <FileText size={18} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'due': return 'bg-red-50 text-red-600 border-red-100';
            case 'in-progress': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'review': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Homework tasks</h3>
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="grid grid-cols-2 gap-0.5">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                </button>
            </div>

            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className="group">
                        {/* Date Header */}
                        <div className={`flex justify - between items - center text - xs font - bold mb - 2 px - 1 ${task.status === 'due' ? 'text-red-500' : 'text-purple-500'} `}>
                            <span>{task.type === 'voice' ? 'Practice Pronunciation' : task.type === 'quiz' ? 'Knowledge Check' : 'Writing Assignment'}</span>
                            <span>Due: {task.dueDate}</span>
                        </div>

                        {/* Card */}
                        <Link to={task.link} className="block bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group-hover:border-indigo-100">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{task.title}</h4>
                            </div>

                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                {task.type === 'voice'
                                    ? 'Record a 2-minute voice message discussing the importance of...'
                                    : 'Complete a quick test on technology-related grammar and...'}
                            </p>

                            <div className="flex items-center justify-between">
                                <span className={`text - xs font - bold px - 3 py - 1.5 rounded - lg border ${getStatusColor(task.status)} `}>
                                    {task.status === 'due' ? 'Not started' : task.status === 'in-progress' ? 'In progress' : 'In review'}
                                </span>

                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100 transition-colors">
                                    {getIcon(task.type)}
                                    <span>{task.type === 'voice' ? 'Record audio' : 'Start'}</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
