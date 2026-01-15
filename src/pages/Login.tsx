import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Loader2, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Login.css';

export function Login() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email);
            const adminEmails = ['steven.male@hey.com', 'steven@opal.com'];
            const isAdmin = adminEmails.some(eaddr => eaddr.toLowerCase() === email.toLowerCase());
            const redirect = (location.state as any)?.redirect || (isAdmin ? '/onboarding' : '/app/path');
            navigate(redirect);
        } catch (error) {
            console.error(error);
            alert('Error logging in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel">
                <div className="login-header">
                    <div style={{
                        backgroundColor: '#000',
                        borderRadius: '12px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Zap size={28} className="text-white" fill="currentColor" />
                    </div>
                    <h1>Opal Vanguard</h1>
                    <p>Sign in to continue your training.</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? <Loader2 className="spin" size={18} /> : 'Sign In with Email'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="sub-text">Access is invite-only. Contact Steven to join.</p>
                </div>
            </div>
        </div>
    );
}
