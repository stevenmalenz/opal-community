import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If auth is done loading and we still don't have a user, something went wrong
        if (!loading && !user) {
            // Check for error in URL hash
            const hash = window.location.hash;
            console.log("AuthCallback: Hash content:", hash); // Debug log

            if (hash.includes('error=')) {
                const params = new URLSearchParams(hash.substring(1)); // remove #
                const errorDescription = params.get('error_description');
                setError(errorDescription || 'Authentication failed.');
            } else {
                // Just no session found
                setError('No session found. Please try logging in again.');
            }

            // Redirect after a delay
            const timer = setTimeout(() => navigate('/login'), 3000);
            return () => clearTimeout(timer);
        }

        async function handleCallback() {
            if (!user) return;

            try {
                // Check if user has a profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!profile) {
                    // New user - create org and profile from metadata
                    const metadata = user.user_metadata;

                    // Create organization
                    const { data: org, error: orgError } = await supabase
                        .from('organizations')
                        .insert({
                            name: metadata.company_name || 'My Organization',
                        })
                        .select()
                        .single();

                    if (orgError) throw orgError;

                    // Create profile
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: user.id,
                            org_id: org.id,
                            email: user.email,
                            full_name: metadata.full_name,
                            role: metadata.role || 'learner',
                        });

                    if (profileError) throw profileError;

                } else {
                    // Existing profile - check if we need to update anything from metadata?
                    // For now, we assume existing profiles are good.
                }

                // CHECK FOR PENDING INVITES
                // Use the secure RPC to accept invites (bypasses RLS)
                const { data: acceptedInvites, error: rpcError } = await supabase.rpc('accept_invite');

                if (rpcError) {
                    console.error("Error calling accept_invite RPC in AuthCallback:", rpcError);
                    // If RPC fails (e.g. not exists), we could try fallback, but likely RLS will fail too.
                    // We'll proceed so the user at least gets logged in.
                }

                if (acceptedInvites && acceptedInvites.length > 0) {
                    console.log("AuthCallback: Successfully accepted invites:", acceptedInvites);

                    for (const invite of acceptedInvites) {
                        // 1. If invite has a role, ensure profile matches
                        if (invite.role && profile?.role !== invite.role) {
                            await supabase
                                .from('profiles')
                                .update({ role: invite.role })
                                .eq('id', user.id);
                        }

                        // 1b. CRITICAL: Ensure user is in the correct Organization
                        if (invite.org_id && profile?.org_id !== invite.org_id) {
                            console.log("Switching user to invited organization:", invite.org_id);
                            await supabase
                                .from('profiles')
                                .update({ org_id: invite.org_id })
                                .eq('id', user.id);
                        }

                        // 2. Enroll in track if invite has it
                        // Prioritize track_id from the DB invite over metadata if available
                        const trackId = invite.track_id || user.user_metadata?.track_id;

                        if (trackId) {
                            // Check if already enrolled
                            const { data: existingEnrollment } = await supabase
                                .from('user_courses')
                                .select('*')
                                .eq('user_id', user.id)
                                .eq('course_id', trackId)
                                .single();

                            if (!existingEnrollment) {
                                await supabase
                                    .from('user_courses')
                                    .insert({
                                        user_id: user.id,
                                        course_id: trackId,
                                        role: 'learner',
                                        progress: 0,
                                        status: 'not-started'
                                    });
                            }
                        }
                    }
                }

                // 3. Redirect based on role
                const role = profile?.role || user.user_metadata?.role;

                if (role === 'learner') {
                    navigate('/app/path');
                } else {
                    // Default to admin/manager view
                    navigate('/app/admin');
                }
            } catch (err: any) {
                console.error("Error in AuthCallback:", err);
                setError(err.message);
            }
        }

        if (user) {
            handleCallback();
        }
    }, [user, loading, navigate]);

    if (error) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="text-center text-red-600">
                    <h2>Authentication Error</h2>
                    <p>{error}</p>
                </div>
                <p className="text-gray-500">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <div className="text-center">
                <h2>Completing sign in...</h2>
                <p className="text-gray-500">Setting up your account</p>
            </div>
        </div>
    );
}
