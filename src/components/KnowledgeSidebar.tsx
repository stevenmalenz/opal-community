import {
    Database,
    BarChart3,
    Settings,
    ChevronRight,
    FolderOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import './KnowledgeSidebar.css';

interface KnowledgeSidebarProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

export function KnowledgeSidebar({ activeView, onViewChange }: KnowledgeSidebarProps) {
    return (
        <div className="knowledge-sidebar">
            <div className="sidebar-header">
                <h3>Knowledge</h3>
            </div>

            <div className="sidebar-section">
                <div className="section-title">Sources</div>
                <div
                    className={`nav-item ${activeView === 'content' ? 'active' : ''}`}
                    onClick={() => onViewChange('content')}
                >
                    <Database size={16} />
                    <span>Content</span>
                    <ChevronRight size={14} className="arrow" />
                </div>
            </div>



            {/* The new structure for management and reporting */}
            <div className="sidebar-section">
                <div className="section-title">Management</div>
                <button
                    className={cn('sidebar-link', activeView === 'content-library' && 'active')}
                    onClick={() => onViewChange('content-library')}
                >
                    <FolderOpen size={18} />
                    Content Library
                </button>
                <button
                    className={cn('sidebar-link', activeView === 'management' && 'active')}
                    onClick={() => onViewChange('management')}
                >
                    <Settings size={18} />
                    Manage Content
                </button>
            </div>

            <div className="sidebar-section">
                <div className="section-title">Reporting</div>
                <button
                    className={cn('sidebar-link', activeView === 'reporting' && 'active')}
                    onClick={() => onViewChange('reporting')}
                >
                    <BarChart3 size={18} />
                    Content Usage
                </button>
            </div>

            <div className="sidebar-footer">
                <div
                    className={`nav-item ${activeView === 'onboarding' ? 'active' : ''}`}
                    onClick={() => onViewChange('onboarding')}
                >
                    <Settings size={16} />
                    <span>Setup Guide</span>
                </div>
            </div>
        </div>
    );
}
