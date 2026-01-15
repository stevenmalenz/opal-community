import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
}

export function useProfiles(role?: string) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchProfiles() {
            try {
                let query = supabase
                    .from('profiles')
                    .select('*');

                if (role) {
                    query = query.eq('role', role);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;
                setProfiles(data || []);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfiles();
    }, [role]);

    return { profiles, loading, error };
}
