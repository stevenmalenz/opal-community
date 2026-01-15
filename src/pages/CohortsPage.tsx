import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, ArrowRight, Wand2, Database, Trash2 } from 'lucide-react';
import { CohortWizard } from '../components/CohortWizard';
import { useProgram } from '../context/ProgramContext';
import { openAIService } from '../lib/openai';

export function CohortsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [indexing, setIndexing] = useState(false);
    const { availablePrograms, currentProgram } = useProgram();

    useEffect(() => {
        checkAdmin();
        fetchCohorts();
    }, [user]);

    const checkAdmin = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'admin') setIsAdmin(true);
    };

    const fetchCohorts = async () => {
        try {
            const { data, error } = await supabase
                .from('cohorts')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) throw error;
            setCohorts(data || []);
        } catch (error) {
            console.error('Error fetching cohorts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCohortCreated = () => {
        setShowWizard(false);
        fetchCohorts();
    };

    const handleIndexLibrary = async () => {
        if (!confirm("This will generate embeddings for ALL lessons in the library. It consumes OpenAI credits. Continue?")) return;
        setIndexing(true);
        try {
            let count = 0;
            // Iterate all programs
            for (const program of availablePrograms) {
                // Iterate all modules
                for (const module of program.learningPath) {
                    // Iterate all lessons
                    for (const lesson of module.lessons) {
                        if (!lesson.content) continue;

                        const contentText = `Course: ${program.title}\nModule: ${module.title}\nLesson: ${lesson.title}\n\n${lesson.content}`;
                        const embedding = await openAIService.getEmbeddings(contentText);

                        // Check if exists to avoid dupes (simple check by title/source metadata could be added but generic is fine for MVP)
                        // Actually, we should probably delete old ones for this course? For now, we just append.

                        await supabase.from('knowledge_base').insert({
                            org_id: (await supabase.from('profiles').select('org_id').eq('id', user?.id).single()).data?.org_id,
                            content: contentText,
                            metadata: {
                                source: 'course_content',
                                programId: program.id,
                                lessonId: lesson.id,
                                title: lesson.title
                            },
                            embedding
                        });
                        count++;
                    }
                }
            }
            alert(`Successfully indexed ${count} lessons into the Knowledge Base!`);
        } catch (err) {
            console.error("Indexing failed", err);
            alert("Indexing failed. Check console.");
        } finally {
            setIndexing(false);
        }
    };

    const handleDeleteCohort = async (cohortId: string) => {
        if (!confirm("Are you sure you want to delete this cohort? This cannot be undone.")) return;
        try {
            const { error } = await supabase.from('cohorts').delete().eq('id', cohortId);
            if (error) throw error;
            fetchCohorts();
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete cohort.");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {showWizard && (
                <CohortWizard
                    onClose={() => setShowWizard(false)}
                    onCreated={handleCohortCreated}
                    defaultCourse={currentProgram}
                />
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Live Cohorts</h1>
                    <p className="text-gray-500 mt-1">Join a group learning journey.</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleIndexLibrary}
                            disabled={indexing}
                            className="btn-secondary flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                            <Database size={18} />
                            {indexing ? 'Indexing...' : 'Index Library'}
                        </button>
                        <button
                            onClick={() => setShowWizard(true)}
                            className="btn-primary flex items-center gap-2 px-4 py-2"
                        >
                            <Wand2 size={18} />
                            Co-Design Cohort
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading cohorts...</div>
            ) : cohorts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 text-center max-w-2xl mx-auto mt-8">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                        <Wand2 size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Community Learning = Higher Success</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Running a cohort is the single best way to ensure your team *actually* completes the training.
                        By setting a schedule and learning together, you create momentum and accountability that self-paced learning lacks.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Users size={16} className="text-purple-600" /> Community
                            </div>
                            <p className="text-xs text-gray-500">Learners help each other, reducing support burden.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Calendar size={16} className="text-purple-600" /> Structure
                            </div>
                            <p className="text-xs text-gray-500">Deadlines drive action. "Someday" becomes "Tuesday".</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Database size={16} className="text-purple-600" /> Outcomes
                            </div>
                            <p className="text-xs text-gray-500">Cohort completion rates are 5-10x higher.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => setShowWizard(true)}
                            className="btn-primary py-3 px-8 text-lg shadow-xl shadow-purple-100"
                        >
                            Design Your First Cohort
                        </button>
                        <p className="text-xs text-gray-400">
                            Powered by AI Curriculum Designer
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cohorts.map(cohort => (
                        <div key={cohort.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                            <div className="h-32 bg-gradient-to-r from-teal-600 to-teal-800 relative">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="absolute bottom-4 left-4 text-white font-bold text-xl pr-12">
                                    {cohort.name}
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCohort(cohort.id); }}
                                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                    <Calendar size={16} />
                                    <span>Starts {new Date(cohort.start_date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-6 flex-1">
                                    {cohort.description || "Join this cohort to accelerate your learning with peers."}
                                </p>
                                <button
                                    onClick={() => navigate(`/app/cohorts/${cohort.id}`)}
                                    className="w-full py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                    View Details <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
