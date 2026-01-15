import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function DebugData() {
    const [data, setData] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function runDiagnostics() {
            const results: any = {};

            // 1. User
            const { data: { user } } = await supabase.auth.getUser();
            results.user = user ? { id: user.id, email: user.email } : 'No User';

            if (user) {
                // 2. Profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                results.profile = profile || profileError;

                // 3. Courses (Raw Fetch)
                const { data: courses, error: coursesError } = await supabase
                    .from('courses')
                    .select('*');
                results.courses = courses || coursesError;

                // 4. User Courses
                const { data: enrollments, error: enrollError } = await supabase
                    .from('user_courses')
                    .select('*')
                    .eq('user_id', user.id);
                results.enrollments = enrollments || enrollError;
            }

            setData(results);
            setLoading(false);
        }

        runDiagnostics();
    }, []);

    if (loading) return <div className="p-4 bg-gray-100">Running Diagnostics...</div>;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-96 bg-gray-900 text-green-400 p-4 overflow-auto z-[99999] border-t-4 border-green-600 font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">🔍 DEBUG CONSOLE</h3>
                <button onClick={() => setData(null)} className="text-red-400 hover:text-red-300">Close</button>
            </div>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
