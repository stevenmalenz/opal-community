import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { ProgramConfig } from '../types/program';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

import { SALES_PROGRAM, CS_PROGRAM } from '../lib/programs';

interface ProgramContextType {
    currentProgram: ProgramConfig | null;
    availablePrograms: ProgramConfig[];
    switchProgram: (programId: string) => Promise<void>;
    refreshProgram: (programId?: string) => Promise<void>;
    markLessonComplete: (programId: string, moduleId: string, lessonId: string) => Promise<void>;
    markLessonMastered: (programId: string, moduleId: string, lessonId: string) => Promise<void>;
    getLesson: (programId: string, moduleId: string, lessonId: string) => any;
    updateLesson: (programId: string, moduleId: string, lessonId: string, content: string, title?: string) => Promise<void>;
    loading: boolean;
    isPersonalizationOpen: boolean;
    setIsPersonalizationOpen: (isOpen: boolean) => void;
    personalizationUpdateCount: number;
    triggerPersonalizationUpdate: () => void;
    completionPercentage: number;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export function ProgramProvider({ children }: { children: ReactNode }) {
    const [currentProgram, setCurrentProgram] = useState<ProgramConfig | null>(null);
    const [dbPrograms, setDbPrograms] = useState<ProgramConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
    const [personalizationUpdateCount, setPersonalizationUpdateCount] = useState(0);
    const { user } = useAuth();
    const isLocalUser = user?.id?.startsWith('local-');

    // Local storage helpers for email-only/local users
    const LOCAL_COURSES_KEY = 'local_courses';
    const loadLocalCourses = () => {
        try {
            const raw = localStorage.getItem(LOCAL_COURSES_KEY);
            if (!raw) return [];
            return JSON.parse(raw) as ProgramConfig[];
        } catch {
            return [];
        }
    };
    const saveLocalCourses = (courses: ProgramConfig[]) => {
        localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(courses));
    };
    // Derived completion percentage
    const completionPercentage = currentProgram?.learningPath
        ? (currentProgram.learningPath.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0) /
            Math.max(currentProgram.learningPath.reduce((acc, m) => acc + m.lessons.length, 0), 1)) * 100
        : 0;

    useEffect(() => {
        async function fetchPrograms() {
            if (!user) {
                setLoading(false);
                return;
            }

            // Local/demo mode: load from localStorage only
            if (isLocalUser) {
                const locals = loadLocalCourses();
                setDbPrograms(locals);
                const lastSelected = localStorage.getItem('current_program_id');
                const candidate = locals.find(p => p.id === lastSelected) || locals[0] || null;
                setCurrentProgram(candidate);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Fetch Global courses
                const { data: globalCourses, error } = await supabase
                    .from('courses')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // 2. Fetch User courses (Enrollments AND Custom)
                // 2. Fetch User courses (Enrollments AND Custom)
                const { data: userCoursesData, error: userError } = await supabase
                    .from('user_courses')
                    .select('*')
                    .eq('user_id', user.id);

                if (userError) throw userError;

                // 3. Fetch user progress
                const { data: progress, error: progressError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id);

                if (progressError) console.warn('Error fetching progress:', progressError);

                // PROCESS COURSES
                const allPrograms: ProgramConfig[] = [];
                const enrolledIds = new Set(userCoursesData?.filter((uc: any) => uc.course_id).map((uc: any) => uc.course_id) || []);

                // A. Custom Courses (from user_courses where course_id is NULL)
                if (userCoursesData) {
                    const customCourses = userCoursesData.filter((uc: any) => !uc.course_id);

                    const mappedCustom: ProgramConfig[] = customCourses.map((course: any) => {
                        return {
                            id: course.id,
                            title: course.title || 'Untitled Custom Course',
                            description: course.description || '',
                            role: course.structure?.role || 'General',
                            themeColor: 'indigo',
                            status: course.status, // Pass status through
                            skills: course.structure?.skills || [],
                            learningPath: (course.structure?.learningPath || []).map((m: any, mIdx: number) => {
                                const moduleId = m.id || `m${mIdx + 1}`;
                                const lessons = (m.lessons || []).map((l: any, lIdx: number) => {
                                    const lessonId = l.id || `l${lIdx + 1}`;
                                    const progressRecord = progress?.find((p: any) =>
                                        p.course_id === course.id &&
                                        p.module_id === moduleId &&
                                        p.lesson_id === lessonId
                                    );
                                    return {
                                        ...l,
                                        id: lessonId,
                                        completed: !!progressRecord?.completed || l.completed,
                                        mastered: !!progressRecord?.is_mastered || l.mastered
                                    };
                                });
                                const allComplete = lessons.every((l: any) => l.completed);
                                return {
                                    ...m,
                                    id: moduleId,
                                    lessons,
                                    status: (allComplete ? 'completed' : 'in-progress') as 'completed' | 'in-progress' | 'locked'
                                };
                            }),
                            scenarios: course.structure?.scenarios || [],
                            dailyDrill: course.structure?.dailyDrill || null,
                            diagnosticQuestions: course.structure?.diagnosticQuestions || null,
                            sources: course.structure?.sources || []
                        };
                    });
                    allPrograms.push(...mappedCustom);
                }

                // B. Global Courses (filtered by enrollment)
                if (globalCourses) {
                    const mappedGlobal: ProgramConfig[] = globalCourses.map(course => {
                        const staticProgram = [SALES_PROGRAM, CS_PROGRAM].find(p => p.id === course.id || p.title === course.name);

                        return {
                            id: course.id,
                            title: course.name || staticProgram?.title || 'Untitled Course',
                            description: course.description || '',
                            role: course.structure?.role || 'General',
                            themeColor: 'indigo',
                            skills: course.structure?.skills || SALES_PROGRAM.skills,
                            learningPath: (course.structure?.learningPath || SALES_PROGRAM.learningPath).map((m: any, mIdx: number) => {
                                const staticModule = staticProgram?.learningPath.find(sm => sm.id === (m.id || `m${mIdx + 1}`));
                                const moduleId = m.id || `m${mIdx + 1}`;
                                const lessons = (m.lessons || []).map((l: any, lIdx: number) => {
                                    const staticLesson = staticModule?.lessons.find(sl => sl.id === (l.id || `l${lIdx + 1}`));
                                    const lessonId = l.id || `l${lIdx + 1}`;
                                    const progressRecord = progress?.find((p: any) =>
                                        p.course_id === course.id &&
                                        p.module_id === moduleId &&
                                        p.lesson_id === lessonId
                                    );
                                    return {
                                        ...l,
                                        id: lessonId,
                                        content: l.content || staticLesson?.content,
                                        title: l.title || staticLesson?.title,
                                        completed: !!progressRecord?.completed || l.completed,
                                        mastered: !!progressRecord?.is_mastered || l.mastered
                                    };
                                });
                                const allComplete = lessons.every((l: any) => l.completed);
                                const anyComplete = lessons.some((l: any) => l.completed);
                                return {
                                    ...m,
                                    id: moduleId,
                                    lessons,
                                    status: (allComplete ? 'completed' : (anyComplete ? 'in-progress' : 'locked')) as 'completed' | 'in-progress' | 'locked'
                                };
                            }),
                            scenarios: course.structure?.scenarios || SALES_PROGRAM.scenarios,
                            dailyDrill: course.structure?.dailyDrill || SALES_PROGRAM.dailyDrill,
                            diagnosticQuestions: course.structure?.diagnosticQuestions || SALES_PROGRAM.diagnosticQuestions,
                            sources: course.structure?.sources || []
                        };
                    });

                    // Filter globals
                    if (user.user_metadata?.role === 'learner') {
                        allPrograms.push(...mappedGlobal.filter(p => enrolledIds.has(p.id)));
                    } else {
                        allPrograms.push(...mappedGlobal);
                    }
                }

                setDbPrograms(allPrograms);

                // Initial Selection Logic
                let updatedCurrent = allPrograms.find(p => p.id === currentProgram?.id) || allPrograms[0];
                if (!updatedCurrent && user.user_metadata?.role !== 'learner') {
                    updatedCurrent = SALES_PROGRAM;
                }
                setCurrentProgram(updatedCurrent || null);

            } catch (err: any) {
                console.error('Error fetching programs:', err);
                // Alert removed after debugging
                setCurrentProgram(SALES_PROGRAM);
            } finally {
                setLoading(false);
            }
        }

        fetchPrograms();
    }, [user]);

    const location = useLocation();

    // URL Sync Effect: Ensure Context matches URL
    useEffect(() => {
        if (loading || !dbPrograms.length) return;

        const path = location.pathname;
        // Check for /track/:id pattern
        const trackMatch = path.match(/\/track\/([^\/]+)/);

        if (trackMatch) {
            const urlProgramId = trackMatch[1];
            if (currentProgram?.id !== urlProgramId) {
                console.log("🔗 URL Sync: Switching to", urlProgramId);

                // Find and set
                const target = dbPrograms.find(p => p.id === urlProgramId);
                if (target) {
                    setCurrentProgram(target);
                } else {
                    // Not found? Try refresh? 
                    // To avoid infinite loops, rely on switchProgram if explicitly needed
                    // But for now, just set if found to keep it simple and safe.
                }
            }
        }
    }, [location.pathname, loading, dbPrograms]); // Depend on dbPrograms to run after fetch

    // Helper to fetch all programs
    const fetchAllProgramsData = async () => {
        if (!user) return [];
        try {
            // 1. Fetch Global
            const { data: globalCourses } = await supabase.from('courses').select('*');
            // 2. Fetch User
            const { data: userCoursesData } = await supabase.from('user_courses').select('*').eq('user_id', user.id);
            // 3. Fetch progress
            const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', user.id);

            // Reconstruct Programs
            const allPrograms: ProgramConfig[] = [];
            const enrolledIds = new Set(userCoursesData?.filter((uc: any) => uc.course_id).map((uc: any) => uc.course_id) || []);

            // A. Custom (Relaxed filter to show legacy courses)
            if (userCoursesData) {
                // Show all custom courses (no course_id). Trust the UI to handle missing structure.
                const customCourses = userCoursesData.filter((uc: any) => !uc.course_id);

                allPrograms.push(...customCourses.map((course: any) => ({
                    id: course.id,
                    title: course.title || 'Custom Course',
                    description: course.description,
                    role: course.structure?.role || 'General',
                    themeColor: 'indigo',
                    status: course.status, // Pass status through
                    skills: course.structure?.skills || [],
                    learningPath: (course.structure?.learningPath || []).map((m: any, mIdx: number) => {
                        const moduleId = m.id || `m${mIdx + 1}`;
                        const lessons = (m.lessons || []).map((l: any, lIdx: number) => {
                            const lessonId = l.id || `l${lIdx + 1}`;
                            const progressRecord = progress?.find((p: any) => p.course_id === course.id && p.module_id === moduleId && p.lesson_id === lessonId);
                            return { ...l, id: lessonId, completed: !!progressRecord?.completed || l.completed, mastered: !!progressRecord?.is_mastered || l.mastered };
                        });
                        const allComplete = lessons.every((l: any) => l.completed);
                        return { ...m, id: moduleId, lessons, status: allComplete ? 'completed' : (lessons.some((l: any) => l.completed) ? 'in-progress' : 'locked') };
                    }),
                    scenarios: course.structure?.scenarios || [],
                    dailyDrill: course.structure?.dailyDrill || null,
                    diagnosticQuestions: course.structure?.diagnosticQuestions || null,
                    sources: course.structure?.sources || []
                })));
            }

            // B. Global
            if (globalCourses) {
                const mappedGlobal = globalCourses.map((course: any) => {
                    const staticProgram = [SALES_PROGRAM, CS_PROGRAM].find(p => p.id === course.id || p.title === course.name);
                    return {
                        id: course.id,
                        title: course.name || staticProgram?.title || 'Unknown Course',
                        description: course.description,
                        role: course.structure?.role || 'General',
                        themeColor: 'indigo',
                        skills: course.structure?.skills || [],
                        learningPath: (course.structure?.learningPath || []).map((m: any, mIdx: number) => {
                            const moduleId = m.id || `m${mIdx + 1}`;
                            const lessons = (m.lessons || []).map((l: any, lIdx: number) => {
                                const lessonId = l.id || `l${lIdx + 1}`;
                                const progressRecord = progress?.find((p: any) => p.course_id === course.id && p.module_id === moduleId && p.lesson_id === lessonId);
                                return { ...l, id: lessonId, completed: !!progressRecord?.completed || l.completed, mastered: !!progressRecord?.is_mastered || l.mastered };
                            });
                            const allComplete = lessons.every((l: any) => l.completed);
                            return { ...m, id: moduleId, lessons, status: allComplete ? 'completed' : (lessons.some((l: any) => l.completed) ? 'in-progress' : 'locked') };
                        }),
                        scenarios: course.structure?.scenarios || [],
                        dailyDrill: course.structure?.dailyDrill || null,
                        diagnosticQuestions: course.structure?.diagnosticQuestions || null,
                        sources: course.structure?.sources || []
                    };
                });
                if (user.user_metadata?.role === 'learner') {
                    allPrograms.push(...mappedGlobal.filter((p: any) => enrolledIds.has(p.id)));
                } else {
                    allPrograms.push(...mappedGlobal);
                }
            }

            return allPrograms;

        } catch (err) {
            console.error('Error fetching programs data:', err);
            return [];
        }
    };

    const refreshProgram = async (forceProgramId?: string) => {
        const allPrograms = await fetchAllProgramsData();
        setDbPrograms(allPrograms);

        // Selection Logic with FORCE SWITCH
        if (forceProgramId) {
            const target = allPrograms.find(p => p.id === forceProgramId);
            if (target) {
                console.log('✅ Force selection successful:', target.title);
                setCurrentProgram(target);
            } else {
                console.warn('⚠️ Force program request not found in refreshed list:', forceProgramId);
            }
        } else {
            // Else keep current or default to newest (allPrograms[0] is newest custom due to order)
            // If currentProgram is set, try to find updated version of it.
            let updatedCurrent = currentProgram ? allPrograms.find(p => p.id === currentProgram.id) : null;

            // If not found (or null), default to first available
            if (!updatedCurrent && allPrograms.length > 0) {
                updatedCurrent = allPrograms[0];
            }

            setCurrentProgram(updatedCurrent || null);
        }
    };

    const switchProgram = async (programId: string) => {
        // Optimistic switch for static programs or already loaded ones
        const localTarget = dbPrograms.find(p => p.id === programId);

        if (localTarget) {
            setCurrentProgram(localTarget);
            return;
        }

        // If not found locally, triggers refresh to find it (race condition fix)
        console.log('🔄 Program not found locally, refreshing...', programId);
        await refreshProgram(programId);
    };

    const markLessonComplete = async (programId: string, moduleId: string, lessonId: string) => {
        if (!currentProgram) return;

        // Optimistic update
        if (!currentProgram.learningPath) return;
        const updatedPath = currentProgram.learningPath.map(m => {
            if (m.id === moduleId) {
                const updatedLessons = m.lessons.map(l => {
                    if (l.id === lessonId) {
                        return { ...l, completed: true };
                    }
                    return l;
                });
                const allComplete = updatedLessons.every(l => 'completed' in l && l.completed);
                return {
                    ...m,
                    lessons: updatedLessons,
                    status: (allComplete ? 'completed' : 'in-progress') as 'completed' | 'in-progress' | 'locked'
                };
            }
            return m;
        });

        setCurrentProgram({ ...currentProgram, learningPath: updatedPath });

        try {
            const { error } = await supabase.from('user_progress').upsert({
                user_id: user?.id,
                course_id: programId,
                module_id: moduleId,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,course_id,lesson_id'
            });

            if (error) throw error;
        } catch (err) {
            console.error('Error saving progress:', err);
        }
    };

    const markLessonMastered = async (programId: string, moduleId: string, lessonId: string) => {
        if (!currentProgram) return;

        if (!currentProgram.learningPath) return;
        const updatedPath = currentProgram.learningPath.map(m => {
            if (m.id === moduleId) {
                const updatedLessons = m.lessons.map(l => {
                    if (l.id === lessonId) {
                        return { ...l, mastered: true };
                    }
                    return l;
                });
                return { ...m, lessons: updatedLessons };
            }
            return m;
        });

        setCurrentProgram({ ...currentProgram, learningPath: updatedPath });

        try {
            const { error } = await supabase.from('user_progress').upsert({
                user_id: user?.id,
                course_id: programId,
                module_id: moduleId,
                lesson_id: lessonId,
                is_mastered: true,
                mastered_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,course_id,lesson_id'
            });

            if (error) console.warn('Error saving mastery:', error);
        } catch (err) {
            console.error('Error saving mastery:', err);
        }
    };

    const getLesson = (programId: string, moduleId: string, lessonId: string) => {
        if (!currentProgram) return null;
        let program = currentProgram.id === programId ? currentProgram : dbPrograms.find(p => p.id === programId);
        if (!program) {
            if (programId === SALES_PROGRAM.id) program = SALES_PROGRAM;
            else if (programId === CS_PROGRAM.id) program = CS_PROGRAM;
        }
        if (!program) return null;
        if (!program.learningPath) return null;
        const module = program.learningPath.find(m => m.id === moduleId);
        if (!module) return null;

        // Try strict ID match first
        let lesson = module.lessons.find(l => l.id === lessonId);

        // Fallback: Try matching by title (for AI generated courses where ID might be title-like or URL used title)
        if (!lesson) {
            const decodedId = decodeURIComponent(lessonId);
            lesson = module.lessons.find(l => l.title === decodedId || l.title === lessonId);
        }

        return lesson;
    };

    const updateLesson = async (programId: string, moduleId: string, lessonId: string, content: string, title?: string) => {
        if (!currentProgram) return;

        // Optimistic Update
        if (!currentProgram.learningPath) return;
        const updatedPath = currentProgram.learningPath.map(m => {
            if (m.id === moduleId) {
                const updatedLessons = m.lessons.map(l => {
                    if (l.id === lessonId) {
                        return { ...l, content, title: title || l.title };
                    }
                    return l;
                });
                return { ...m, lessons: updatedLessons };
            }
            return m;
        });

        const updatedProgram = { ...currentProgram, learningPath: updatedPath };
        setCurrentProgram(updatedProgram);

        try {
            const { data: courseData, error: fetchError } = await supabase
                .from('courses')
                .select('structure')
                .eq('id', programId)
                .single();

            if (fetchError) throw fetchError;

            const currentStructure = courseData.structure || {};
            const newLearningPath = (currentStructure.learningPath || []).map((m: any, mIdx: number) => {
                const mId = m.id || `m${mIdx + 1}`;
                if (mId === moduleId) {
                    const newLessons = (m.lessons || []).map((l: any, lIdx: number) => {
                        const lId = l.id || `l${lIdx + 1}`;
                        if (lId === lessonId) {
                            return { ...l, content, title: title || l.title };
                        }
                        return l;
                    });
                    return { ...m, lessons: newLessons };
                }
                return m;
            });

            const newStructure = { ...currentStructure, learningPath: newLearningPath };
            const { error: updateError } = await supabase
                .from('courses')
                .update({ structure: newStructure })
                .eq('id', programId);

            if (updateError) throw updateError;

        } catch (err) {
            console.error('Error updating lesson:', err);
            alert("Failed to save changes. Please try again.");
        }
    };

    return (
        <ProgramContext.Provider value={{
            currentProgram,
            availablePrograms: dbPrograms,
            switchProgram,
            refreshProgram,
            markLessonComplete,
            markLessonMastered,
            getLesson,
            updateLesson,
            loading,
            isPersonalizationOpen,
            setIsPersonalizationOpen,
            personalizationUpdateCount,
            triggerPersonalizationUpdate: () => setPersonalizationUpdateCount(prev => prev + 1),
            completionPercentage
        }}>
            {children}
        </ProgramContext.Provider>
    );
}

export function useProgram() {
    const context = useContext(ProgramContext);
    if (context === undefined) {
        throw new Error('useProgram must be used within a ProgramProvider');
    }
    return context;
}
