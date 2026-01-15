import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { openAIService } from '../lib/openai';
import { Wand2, Loader2, Check, Info, X, ExternalLink } from 'lucide-react';
import { addDays, format, nextMonday } from 'date-fns';

interface CohortWizardProps {
    onClose: () => void;
    onCreated: () => void;
    defaultCourse?: any;
}

export function CohortWizard({ onClose, onCreated, defaultCourse }: CohortWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [cohortName, setCohortName] = useState('');
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(format(nextMonday(new Date()), 'yyyy-MM-dd'));
    const [weeks, setWeeks] = useState(3);
    const [sessionsPerWeek, setSessionsPerWeek] = useState(3);

    useEffect(() => {
        fetchCourses();
    }, []);

    // Sync selected object when ID or list changes
    useEffect(() => {
        if (selectedCourseId && courses.length > 0) {
            const course = courses.find(c => c.id === selectedCourseId);
            setSelectedCourse(course || null);
        }
    }, [selectedCourseId, courses]);

    const fetchCourses = async () => {
        const { data } = await supabase.from('courses').select('*');
        setCourses(data || []);

        // Auto-select default course
        if (defaultCourse) {
            // Prefer ID match from DB
            const found = data?.find(c => c.id === defaultCourse.id);
            if (found) {
                setSelectedCourseId(found.id);
            } else if (defaultCourse.id) {
                // Even if not in DB list (e.g. static), try to select by ID if possible? 
                // Actually, if it's not in the 'courses' table, we can't really select it easily for the dropdown.
                // We'll stick to what we found.
            }
        }
    };

    const generateSchedule = async () => {
        if (!selectedCourse) return;
        setLoading(true);

        try {
            const prompt = `
                I am designing a ${weeks}-week live cohort for the course: "${selectedCourse.name}".
                It should a schedule with ${sessionsPerWeek} sessions per week.
                Total Sessions: ${weeks * sessionsPerWeek}.
                The final session should be a "Demo Day" or "Final Presentation".
                
                Course Description: ${selectedCourse.description || 'N/A'}
                Structure: ${JSON.stringify(selectedCourse.structure || {})}

                Please generate a JSON array of ${weeks * sessionsPerWeek} sessions.
                Format: [{ "title": "...", "description": "...", "dayOffset": 0, "reference": { "moduleId": "...", "lessonId": "...", "label": "Module X: Lesson Y" } }]
                dayOffset 0 = First Monday.
                Important: The 'description' field MUST contain Pre-work instructions and session agenda.
                Also, for each session, identify the PRIMARY lesson it covers and fill the 'reference' object with the exact IDs from the structure. If it's a general session, reference may be null.
                Make the content engaging and progressive.
            `;

            // Note: In real app, we should use a stronger JSON mode enforcement.
            // Using a simple chat completion and parsing for MVP.
            const response = await openAIService.getChatCompletion([
                { role: 'system', content: 'You are a curriculum designer. Output ONLY valid JSON array.' },
                { role: 'user', content: prompt }
            ]);

            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const sessions = JSON.parse(cleanJson);
            setSchedule(sessions);
            setCohortName(`${selectedCourse.name} - ${format(new Date(startDate), 'MMM yyyy')}`);
            setStep(2);
        } catch (error) {
            console.error("Failed to generate schedule", error);
            alert("AI generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const createCohort = async () => {
        setLoading(true);
        try {
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            if (!profile?.org_id) throw new Error("No Org ID");

            // 1. Create Cohort
            // We should attach course_id here too if we want cohorts linked to courses!
            // The cohort schema might not have course_id yet? Let's check schema.
            // Wait, previous schema check for cohorts table didn't show course_id. 
            // Users requested "Dropdown on cohort page... default to current track".
            // That implies filtering too? 
            // For now, MVP: we just use the name/desc. 
            // But if we want robust linking later we should add it.
            // Sticking to existing schema for now (name/description).

            const { data: cohort, error: cError } = await supabase
                .from('cohorts')
                .insert({
                    org_id: profile.org_id,
                    name: cohortName,
                    description: `Live cohort for ${selectedCourse.name}`,
                    start_date: startDate,
                    created_by: user?.id
                })
                .select()
                .single();

            if (cError) throw cError;

            // 2. Create Sessions
            const sessionInserts = schedule.map(s => ({
                cohort_id: cohort.id,
                title: s.title,
                description: s.description,
                scheduled_at: addDays(new Date(startDate), s.dayOffset).toISOString()
            }));

            const { error: sError } = await supabase.from('cohort_sessions').insert(sessionInserts);
            if (sError) throw sError;

            onCreated();
        } catch (error) {
            console.error(error);
            alert("Failed to create cohort");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Wand2 className="text-purple-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Co-Design Cohort
                        </h2>
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="text-gray-400 hover:text-purple-600 transition-colors ml-1"
                            title="Why run a cohort?"
                        >
                            <Info size={18} />
                        </button>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Close</button>
                </div>

                <div className="p-8 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Base Course</label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow text-gray-900"
                                >
                                    <option value="" disabled>-- Select a course/track --</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Choose the underlying curriculum for this cohort.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (First Monday)</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Wks)</label>
                                        <input
                                            type="number"
                                            min="1" max="12"
                                            value={weeks}
                                            onChange={(e) => setWeeks(parseInt(e.target.value))}
                                            className="w-full p-3 border border-gray-300 rounded-xl text-center focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sessions/Wk</label>
                                        <input
                                            type="number"
                                            min="1" max="5"
                                            value={sessionsPerWeek}
                                            onChange={(e) => setSessionsPerWeek(parseInt(e.target.value))}
                                            className="w-full p-3 border border-gray-300 rounded-xl text-center focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                                <h4 className="text-sm font-bold text-purple-900 mb-1">AI Curriculum Designer</h4>
                                <p className="text-xs text-purple-700">
                                    We'll generate a comprehensive <strong>{weeks * sessionsPerWeek}-session schedule</strong> tailored to "{selectedCourse?.name || 'your course'}", complete with agendas and pre-work.
                                </p>
                            </div>

                            <button
                                onClick={generateSchedule}
                                disabled={!selectedCourse || loading}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg font-medium shadow-purple-200 shadow-lg mt-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                                {loading ? 'Designing Schedule...' : 'Generate Plan'}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cohort Name</label>
                                <input
                                    type="text"
                                    value={cohortName}
                                    onChange={(e) => setCohortName(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl font-bold text-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <h3 className="font-bold text-gray-900">Proposed Schedule</h3>
                                    <span className="text-xs text-gray-500 badge bg-gray-100 px-2 py-1 rounded-full">{schedule.length} Sessions</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {schedule.map((s, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                                            <div className="min-w-[4rem] flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200 h-16 w-16 shadow-sm">
                                                <span className="text-xs text-gray-500 uppercase font-bold">{format(addDays(new Date(startDate), s.dayOffset), 'MMM')}</span>
                                                <span className="text-xl font-bold text-gray-900">{format(addDays(new Date(startDate), s.dayOffset), 'd')}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                    {s.title}
                                                    {s.reference && s.reference.moduleId && (
                                                        <a
                                                            href={`/app/program/${selectedCourse.id}/module/${s.reference.moduleId}/lesson/${s.reference.lessonId}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] uppercase font-bold tracking-wide hover:bg-blue-200 transition-colors"
                                                            title="View Source Lesson"
                                                        >
                                                            {s.reference.label || 'Lesson'} <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-600 leading-relaxed">{s.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={createCohort}
                                    disabled={loading}
                                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Check size={18} />}
                                    {loading ? 'Launching...' : 'Confirm & Launch'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* WHY COHORTS? EDUCATIONAL MODAL */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
                                <Info size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Why Run a Cohort?</h3>
                        </div>

                        <div className="space-y-6 text-gray-600">
                            <p>
                                Cohort-based learning transforms solitary studying into a community experience.
                                By setting a shared start date and schedule, you create <strong>accountability</strong> and <strong>momentum</strong>.
                            </p>

                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Best Practices</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex gap-2 items-start">
                                        <Check size={16} className="text-green-500 mt-0.5" />
                                        <span>Target <strong>3-4 weeks</strong> for optimal engagement.</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <Check size={16} className="text-green-500 mt-0.5" />
                                        <span>Host 2-3 live sessions per week (mix of teaching & office hours).</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <Check size={16} className="text-green-500 mt-0.5" />
                                        <span>End with a "Demo Day" to celebrate completion.</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">Recommended Reading</h4>
                                <a
                                    href="https://seths.blog/2025/10/finding-your-cohort/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium group"
                                >
                                    Seth Godin on "Finding Your Cohort"
                                    <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="w-full btn-secondary bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-xl font-medium"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
