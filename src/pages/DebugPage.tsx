import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function DebugPage() {
    const { user } = useAuth();
    const [userCourses, setUserCourses] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [hasOrphans, setHasOrphans] = useState(false);

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${msg}`]);

    useEffect(() => {
        if (!user) return;
        runAudit().then(() => simulateContext());
    }, [user]);

    const runAudit = async () => {
        log('Starting Authenticated Audit...');
        setHasOrphans(false);

        // 1. Fetch Data
        const [ucRes, cRes] = await Promise.all([
            supabase.from('user_courses').select('*'),
            supabase.from('courses').select('*')
        ]);

        if (ucRes.error) log(`❌ user_courses error: ${ucRes.error.message}`);
        if (cRes.error) log(`❌ courses error: ${cRes.error.message}`);

        const uc = ucRes.data || [];
        const c = cRes.data || [];

        setUserCourses(uc);
        setCourses(c);
        log(`✅ user_courses count: ${uc.length}`);
        log(`✅ courses count: ${c.length}`);

        // 2. Analyze
        if (uc.length > 0) {
            const legacy = uc.filter(c => !c.status);
            if (legacy.length) log(`⚠️ Legacy courses (missing status): ${legacy.length}`);

            const structureless = uc.filter(c => !c.structure);
            if (structureless.length) log(`⚠️ Structureless courses: ${structureless.length}`);

            // ORPHAN CHECK
            // An orphan is a row with a course_id that does NOT exist in the 'courses' table
            const globalIds = new Set(c.map(g => g.id));
            const orphans = uc.filter(u => u.course_id && !globalIds.has(u.course_id));

            if (orphans.length > 0) {
                log(`🚨 FOUND ${orphans.length} ORPHAN CLAY COURSES!`);
                log(`👉 These are invisible because they link to non-existent templates.`);
                setHasOrphans(true);
            } else {
                log(`✅ No orphans found. All links valid.`);
            }
        }
    };

    const fixOrphans = async () => {
        log('🛠 Fixing Orphans...');

        // Find them again to be safe
        const globalIds = new Set(courses.map(g => g.id));
        const orphans = userCourses.filter(u => u.course_id && !globalIds.has(u.course_id));

        if (orphans.length === 0) {
            log('No orphans to fix.');
            return;
        }

        // Fix: Set course_id to NULL (Convert to Custom Course)
        const orphanIds = orphans.map(o => o.id);
        const { error } = await supabase
            .from('user_courses')
            .update({ course_id: null })
            .in('id', orphanIds);

        if (error) {
            log(`❌ Fix Failed: ${error.message}`);
        } else {
            log(`✅ FIXED ${orphans.length} ORPHANS!`);
            log(`🔄 They are now "Custom Courses". Refreshing audit...`);
            runAudit();
        }
    };

    const simulateContext = async () => {
        log('🧪 SIMULATING CONTEXT LOGIC...');

        // 1. Re-fetch
        const { data: uc } = await supabase.from('user_courses').select('*').eq('user_id', user?.id);
        const { data: gc } = await supabase.from('courses').select('*');
        const role = user?.user_metadata?.role || 'unknown';

        log(`👤 User Role: ${role}`);
        log(`📦 User Courses Fetched: ${uc?.length}`);
        log(`🌍 Global Courses Fetched: ${gc?.length}`);

        if (!uc || !gc) return;

        // 2. Logic Copy-Paste from ProgramContext
        const enrolledIds = new Set(uc.filter(u => u.course_id).map(u => u.course_id));
        log(`🔐 Enrolled IDs Count (Set): ${enrolledIds.size}`);

        // Custom
        const custom = uc.filter(u => !u.course_id);
        log(`🎨 Custom Courses Found (No ID): ${custom.length}`);

        // Global
        let globalCount = 0;
        if (role === 'learner') {
            const visible = gc.filter(g => enrolledIds.has(g.id));
            globalCount = visible.length;
            log(`👀 Visible Global (Learner): ${globalCount}`);

            // Debug Loop if 0
            if (globalCount === 0 && enrolledIds.size > 0) {
                log('🐛 DEBUG: Listing IDs to find mismatch...');
                log(`First Enrolled ID: ${Array.from(enrolledIds)[0]}`);
                log(`First Global ID: ${gc[0]?.id}`);
            }
        } else {
            globalCount = gc.length;
            log(`👀 Visible Global (Admin): ${globalCount}`);
        }

        const total = custom.length + globalCount;
        log(`🏁 TOTAL PROGRAMS THAT WOULD SHOW: ${total}`);
    };

    const runWriteTest = async () => {
        log('Running Write Test...');

        // Try Inserting
        const { data, error } = await supabase.from('user_courses').insert({
            user_id: user?.id,
            title: 'DEBUG_TEST',
            status: 'generating'
        }).select().single();

        if (error) {
            log(`❌ INSERT FAILED: ${error.message} (Code: ${error.code})`);
        } else {
            log(`✅ INSERT SUCCESS. ID: ${data.id}`);
            // Cleanup
            await supabase.from('user_courses').delete().eq('id', data.id);
            log(`✅ Cleanup SUCCESS.`);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">System Debugger</h1>

            <div className="p-4 bg-slate-100 rounded-lg">
                <h2 className="font-bold mb-2">Audit Log</h2>
                <div className="font-mono text-xs space-y-1 mb-4 h-48 overflow-auto border bg-white p-2">
                    {logs.map((l, i) => (
                        <div key={i} className="font-mono text-xs text-gray-600 border-b border-gray-100 py-1">
                            {l}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={runWriteTest} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        1. Run Write Test
                    </button>
                    {hasOrphans && (
                        <button onClick={fixOrphans} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 animate-pulse">
                            2. 🛠 FIX INVISIBLE COURSES
                        </button>
                    )}
                    <button onClick={simulateContext} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                        3. Test Context Logic
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h2 className="font-bold mb-2">User Courses ({userCourses.length})</h2>
                    <pre className="text-xs bg-slate-900 text-green-400 p-4 rounded overflow-auto h-96">
                        {JSON.stringify(userCourses, null, 2)}
                    </pre>
                </div>
                <div>
                    <h2 className="font-bold mb-2">Global Courses ({courses.length})</h2>
                    <pre className="text-xs bg-slate-900 text-blue-400 p-4 rounded overflow-auto h-96">
                        {JSON.stringify(courses, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
