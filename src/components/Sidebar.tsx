import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
    Home,
    Users,
    Settings,
    LogOut,
    Rocket,
    Cat, // Added Cat
    BookOpen,
    // Bell,
    MessageSquare,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { ProgramSelector } from './ProgramSelector';
import './Sidebar.css';

const navItems = [
    { icon: Home, label: 'Home', path: '/app/path' },
    { icon: MessageSquare, label: 'Questions', path: '/app/qa' },
    { icon: GraduationCap, label: 'Cohorts', path: '/app/cohorts' },
];

const adminItems = [
    { icon: Users, label: 'Manager Hub', path: '/app/manager' },
    { icon: CheckCircle, label: 'Coaching Hub', path: '/app/coaching' },
    { icon: BookOpen, label: 'Knowledge', path: '/app/admin' },
    { icon: Rocket, label: 'Create Course', path: '/onboarding' },
];

export interface SidebarProps {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setCollapsed }: SidebarProps) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    // const location = useLocation();
    // Removed local state
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    // const [showNotifications, setShowNotifications] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            // if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            //     setShowNotifications(false);
            // }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <aside
            className={cn("sidebar", isCollapsed ? "collapsed" : "w-56")}
            style={{ width: isCollapsed ? '70px' : '224px' }}
        >
            <button
                className="sidebar-toggle"
                onClick={() => setCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className="logo-container" onClick={() => setCollapsed(false)}>
                <div className="logo-box">
                    <div className="cat-wiggle">
                        <Cat size={18} fill="none" />
                    </div>
                </div>
                <span className="logo-text">Pawfessor</span>
            </div>

            <nav className="nav-menu">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn('nav-item', isActive && 'active')
                        }
                        data-label={item.label}
                    >
                        <item.icon size={20} className="shrink-0" />
                        <span>{item.label}</span>
                        <div className="active-indicator" />
                    </NavLink>
                ))}

                {/* Show Admin items if NOT learner, or if admin is in the name/email (fallback) */}
                {(user?.user_metadata?.role !== 'learner' || user?.email?.toLowerCase().includes('admin') || user?.user_metadata?.full_name?.toLowerCase().includes('admin')) && (
                    <>
                        <div className="nav-divider" />
                        {adminItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    cn('nav-item', isActive && 'active')
                                }
                                data-label={item.label}
                            >
                                <item.icon size={20} className="shrink-0" />
                                <span>{item.label}</span>
                                <div className="active-indicator" />
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            <div className="sidebar-program-selector">
                <ProgramSelector isCollapsed={isCollapsed} />
            </div>

            <div className="sidebar-footer" ref={profileRef}>
                {/* Notification Bell attached to side */}
                <div className="notification-anchor" ref={notifRef}>
                    {/* Only show bell if expanded OR handled properly in collapsed mode - skipping for collapsed simplification unless requested */}
                </div>

                <div
                    className={cn("user-profile", showProfileMenu && "active")}
                    onClick={() => {
                        setShowProfileMenu(!showProfileMenu);
                        // setShowNotifications(false);
                    }}
                >
                    <div className="avatar">
                        {user?.email?.substring(0, 2).toUpperCase() || '?'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">
                            {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="user-role">
                            {user?.user_metadata?.role ?
                                user.user_metadata.role.charAt(0).toUpperCase() + user.user_metadata.role.slice(1)
                                : 'Admin'}
                        </span>
                    </div>
                </div>

                {showProfileMenu && (
                    <div className="sidebar-popup profile-menu glass-panel">
                        <Link to="/app/settings" className="menu-item">
                            <Settings size={18} />
                            <span>Settings</span>
                        </Link>

                        <div className="menu-divider" />
                        <button onClick={handleSignOut} className="menu-item text-red-500 hover:text-red-600">
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </aside >
    );
}
