import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Award, MapPin, Briefcase, Link as LinkIcon, Share2, CheckCircle, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function PublicProfile() {
    const { userId } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [progress, setProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!userId) return;

            try {
                const [profileRes, coursesRes, progressRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', userId).single(),
                    supabase.from('user_courses').select('*').eq('user_id', userId),
                    supabase.from('user_progress').select('*').eq('user_id', userId)
                ]);

                if (profileRes.data) setProfile(profileRes.data);
                if (coursesRes.data) setCourses(coursesRes.data);
                if (progressRes.data) setProgress(progressRes.data);

            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [userId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center">Profile not found</div>;

    const completedCourses = courses.filter(c => c.status === 'completed');
    const activeCourses = courses.filter(c => c.status !== 'completed');
    const modulesCompleted = new Set(progress.filter(p => p.completed).map(p => `${p.course_id}-${p.module_id}`)).size;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header / Cover */}
            <div className="h-64 bg-gradient-to-r from-indigo-900 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar */}
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-400 shrink-0">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    profile.full_name?.[0]
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{profile.full_name}</h1>
                                    <p className="text-xl text-slate-500 font-medium">{profile.role || 'Enablement Professional'}</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        <span>San Francisco, CA</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Briefcase size={16} />
                                        <span>Tech Corp Inc.</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-indigo-600 font-medium">
                                        <LinkIcon size={16} />
                                        <a href="#" className="hover:underline">linkedin.com/in/{profile.full_name?.replace(/\s+/g, '').toLowerCase()}</a>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                                        <Share2 size={18} />
                                        Connect
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                            {/* Main Content */}
                            <div className="md:col-span-2 space-y-8">
                                <section>
                                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Briefcase size={20} className="text-indigo-600" />
                                        About
                                    </h2>
                                    <p className="text-slate-600 leading-relaxed">
                                        {profile.buddy_bio || "Passionate about sales enablement and continuous learning. Currently mastering new skills on FlowLearn."}
                                    </p>
                                </section>

                                {/* Active Courses Section */}
                                {activeCourses.length > 0 && (
                                    <section>
                                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                            <Award size={20} className="text-indigo-600" />
                                            Active Courses
                                        </h2>
                                        <div className="space-y-4">
                                            {activeCourses.map((course) => (
                                                <div key={course.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-100 transition-colors group">
                                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                        <Briefcase size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">{course.title || 'Untitled Course'}</h3>
                                                        <p className="text-sm text-slate-500">
                                                            {course.status === 'generating' ? 'Building Curriculum...' : 'In Progress'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Certifications Section */}
                                <section>
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Trophy size={20} className="text-indigo-600" />
                                        Certifications
                                    </h2>
                                    <div className="space-y-4">
                                        {completedCourses.length > 0 ? (
                                            completedCourses.map((course) => (
                                                <div key={course.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-100 transition-colors group">
                                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                        <Trophy size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900">{course.title}</h3>
                                                        <p className="text-sm text-slate-500">Issued by FlowLearn Academy</p>
                                                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            <CheckCircle size={12} /> Verified
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 italic">No certifications yet.</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar Stats */}
                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Skills</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {['Negotiation', 'Public Speaking', 'Leadership', 'Sales Strategy', 'Coaching'].map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-200 cursor-default">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="font-bold text-lg mb-2">FlowLearn Stats</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-3xl font-bold">{modulesCompleted}</div>
                                            <div className="text-indigo-200 text-sm">Modules Completed</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">{courses.length}</div>
                                            <div className="text-indigo-200 text-sm">Total Courses</div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 mb-12 text-slate-400 text-sm">
                    <p>© 2025 FlowLearn. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
