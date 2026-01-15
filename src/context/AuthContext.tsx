import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Local dev login (email-only) support
        const stored = localStorage.getItem('local_user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                setSession(null);
                setLoading(false);
                return;
            } catch {
                localStorage.removeItem('local_user');
            }
        }

        // Check active sessions and subscribe to auth changes
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string) => {
        // Email-only local login (no magic link)
        const adminEmails = ['steven.male@hey.com', 'steven@opal.com'];
        const isAdmin = adminEmails.some(e => e.toLowerCase() === email.toLowerCase());

        const fakeUser: User = {
            id: `local-${email}`,
            email,
            phone: '',
            app_metadata: {
                role: isAdmin ? 'admin' : 'learner',
            },
            user_metadata: {
                full_name: email.split('@')[0] || email,
                role: isAdmin ? 'admin' : 'learner',
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            identities: [],
            role: 'authenticated',
            factors: [],
            is_anonymous: true,
        } as User;

        setUser(fakeUser);
        setSession(null);
        localStorage.setItem('local_user', JSON.stringify(fakeUser));
    };

    const signOut = async () => {
        localStorage.removeItem('local_user');
        setUser(null);
        setSession(null);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
