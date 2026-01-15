import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProgress {
    id: string;
    user_id: string;
    program_id: string;
    module_id: string;
    lesson_id: string;
    status: 'started' | 'completed';
    score?: number;
    completed_at?: string;
    created_at: string;
}

export function useProgress(userId?: string) {
    const [progress, setProgress] = useState<UserProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        async function fetchProgress() {
            try {
                const { data, error: fetchError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', userId);

                if (fetchError) throw fetchError;
                setProgress(data || []);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchProgress();
    }, [userId]);

    return { progress, loading, error };
}

export async function saveProgress(userId: string, data: {
    program_id: string;
    module_id: string;
    lesson_id: string;
    status: 'started' | 'completed';
    score?: number;
}) {
    const { error } = await supabase.from('user_progress').insert({
        user_id: userId,
        ...data,
        completed_at: data.status === 'completed' ? new Date().toISOString() : null,
    });

    if (error) throw error;
}
