import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingView } from '../components/OnboardingView';
import { useAuth } from '../context/AuthContext';

export function OnboardingPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;

        // If no user, send to login
        if (!user) {
            navigate('/login');
            return;
        }

        // Learners should not access onboarding; send them to learning path
        const role = user.user_metadata?.role;
        if (role === 'learner') {
            navigate('/app/path');
            return;
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // If we are here and not loading, we assume user is present and allowed (admin)
    if (!user) return null;

    return (
        <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
            <OnboardingView />
        </div>
    );
}
