import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useProgram } from '../context/ProgramContext';
import { cn } from '../lib/utils';
import { PersonalizationModal } from './PersonalizationModal';
import { useState } from 'react';
import './Layout.css';

export function Layout() {
    const { isPersonalizationOpen, setIsPersonalizationOpen, triggerPersonalizationUpdate } = useProgram();
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="app-layout">
            <Sidebar isCollapsed={isCollapsed} setCollapsed={setIsCollapsed} />
            <main
                className={cn(
                    "main-content transition-all duration-300 ease-in-out"
                )}
                style={{ marginLeft: isCollapsed ? '70px' : '224px' }}
            >
                <div className="content-container">
                    <div className="page-content">
                        <Outlet />
                    </div>
                </div>
            </main>
            <PersonalizationModal
                isOpen={isPersonalizationOpen}
                onClose={() => setIsPersonalizationOpen(false)}
                onSave={() => {
                    triggerPersonalizationUpdate();
                    setIsPersonalizationOpen(false);
                }}
            />
        </div>
    );
}
