import { useState } from 'react';
import { Search, BookOpen, ArrowRight } from 'lucide-react';
import { useProgram } from '../context/ProgramContext';
import { Card } from '../components/Card';
import { FlashCardModal } from '../components/FlashCardModal';
import type { Lesson } from '../types/program';

export function Library() {
    const { currentProgram } = useProgram();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLesson, setSelectedLesson] = useState<(Lesson & { uniqueId?: string }) | null>(null);

    // Flatten all lessons from all modules
    const allLessons = currentProgram?.learningPath.flatMap(module =>
        module.lessons.map((lesson, index) => ({
            ...lesson,
            moduleId: module.id,
            moduleTitle: module.title,
            uniqueId: `${module.id}-${lesson.id}-${index}`
        }))
    ) || [];

    const filteredLessons = allLessons.filter(lesson => {
        const query = searchQuery.toLowerCase();
        const title = (lesson.flash_card_title || lesson.title).toLowerCase();
        return title.includes(query);
    });

    return (
        <div className="min-h-screen bg-[#F7F7F5] pb-20">
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">How-to Guides</h1>
                    <p className="text-slate-500 mb-8">Step-by-step instructions for common tasks and jobs to be done.</p>

                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="I want to..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all outline-none text-slate-900 placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div className="">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLessons.map((lesson) => (
                            <Card
                                key={lesson.uniqueId}
                                className="group relative bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer"
                                onClick={() => setSelectedLesson(lesson)}
                            >
                                <div className="p-6 flex flex-col h-full">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 leading-snug line-clamp-3 flex-1">
                                        {lesson.flash_card_title || (lesson.title.startsWith('How to') ? lesson.title : `How to ${lesson.title}`)}
                                    </h3>

                                    <div className="mt-auto pt-4 flex items-center border-t border-slate-50">
                                        <button className="text-sm font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Read Guide <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {filteredLessons.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No guides found</h3>
                            <p className="text-slate-500">Try searching for a different task.</p>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {selectedLesson && (
                    <FlashCardModal
                        lesson={selectedLesson}
                        onClose={() => setSelectedLesson(null)}
                    />
                )}
            </div>
        </div>
    );
}
