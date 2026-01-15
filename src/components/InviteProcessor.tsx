import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function InviteProcessor() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !user.email) return;

        const processInvites = async () => {
            try {
                console.log("Processing invites for:", user.email);

                // Call the secure RPC function to accept invites
                const { data: acceptedInvites, error } = await supabase.rpc('accept_invite');

                if (error) {
                    console.error("Error calling accept_invite RPC:", error);
                    // Fallback to manual check if RPC fails (e.g. if not created yet)
                    // This helps during the transition period
                    return;
                }

                if (acceptedInvites && acceptedInvites.length > 0) {
                    console.log("Successfully accepted invites:", acceptedInvites);

                    for (const invite of acceptedInvites) {
                        // 1. Update profile role if needed
                        if (invite.role) {
                            await supabase
                                .from('profiles')
                                .update({ role: invite.role })
                                .eq('id', user.id);
                        }

                        // 1b. Switch Organization if needed
                        if (invite.org_id) {
                            // We need to check current profile org, but we don't have it here easily without fetching.
                            // It's safer to just update it to match the invite, as the invite is the source of truth for new access.
                            await supabase
                                .from('profiles')
                                .update({ org_id: invite.org_id })
                                .eq('id', user.id);
                        }

                        // 2. Enroll in track if invite has it
                        if (invite.track_id) {
                            console.log("Enrolling in track:", invite.track_id);

                            // Check if already enrolled
                            const { data: existingEnrollment } = await supabase
                                .from('user_courses')
                                .select('*')
                                .eq('user_id', user.id)
                                .eq('course_id', invite.track_id)
                                .single();

                            if (!existingEnrollment) {
                                const { error: enrollError } = await supabase
                                    .from('user_courses')
                                    .insert({
                                        user_id: user.id,
                                        course_id: invite.track_id,
                                        role: 'learner',
                                        progress: 0,
                                        status: 'not-started'
                                    });

                                if (enrollError) console.error("Error enrolling in track:", enrollError);
                            }
                        }
                    }

                    // Optional: Trigger a refresh of program context if needed
                    // But since this runs on mount, the ProgramContext might already be loading
                    // We might need to force a reload if role changed drastically
                } else {
                    console.log("No pending invites found.");
                }

            } catch (error) {
                console.error("Error processing invites:", error);
            }
        };

        processInvites();
    }, [user]);

    return null;
}
