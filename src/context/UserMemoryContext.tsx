import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface MemoryItem {
    id: string;
    key: string; // e.g., "Q3 Goal", "Current Role"
    value: string; // e.g., "Promotion to VP", "Account Executive"
    category: 'professional' | 'personal' | 'preference';
    lastUpdated: string; // ISO Date string
}

interface UserMemoryContextType {
    memories: MemoryItem[];
    addMemory: (key: string, value: string, category?: MemoryItem['category']) => void;
    updateMemory: (id: string, value: string) => void;
    deleteMemory: (id: string) => void;
    getMemory: (key: string) => string | undefined;
    clearMemory: () => void;
    isLoaded: boolean;
}

const UserMemoryContext = createContext<UserMemoryContextType | undefined>(undefined);

export function UserMemoryProvider({ children }: { children: ReactNode }) {
    const [memories, setMemories] = useState<MemoryItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('user_memory');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out the specific dummy data if it exists
                const filtered = parsed.filter((m: MemoryItem) =>
                    !(m.key === 'Role' && m.value === 'Account Executive') &&
                    !(m.key === 'Goal' && m.value === 'Promotion to VP of Sales') &&
                    !(m.key === 'KPIs' && m.value === 'Revenue Growth, Team Retention')
                );
                setMemories(filtered);
                // Update local storage immediately if we filtered anything
                if (filtered.length !== parsed.length) {
                    localStorage.setItem('user_memory', JSON.stringify(filtered));
                }
            } catch (e) {
                console.error("Failed to parse user memory", e);
            }
        } else {
            setMemories([]);
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage whenever memories change
    useEffect(() => {
        if (isLoaded && memories.length > 0) {
            localStorage.setItem('user_memory', JSON.stringify(memories));
        }
    }, [memories, isLoaded]);

    const addMemory = (key: string, value: string, category: MemoryItem['category'] = 'professional') => {
        const newItem: MemoryItem = {
            id: Date.now().toString(),
            key,
            value,
            category,
            lastUpdated: new Date().toISOString()
        };
        setMemories(prev => [...prev, newItem]);
    };

    const updateMemory = (id: string, value: string) => {
        setMemories(prev => prev.map(item =>
            item.id === id ? { ...item, value, lastUpdated: new Date().toISOString() } : item
        ));
    };

    const deleteMemory = (id: string) => {
        setMemories(prev => prev.filter(item => item.id !== id));
    };

    const getMemory = (key: string) => {
        return memories.find(m => m.key.toLowerCase() === key.toLowerCase())?.value;
    };

    const clearMemory = () => {
        setMemories([]);
        localStorage.removeItem('user_memory');
    };

    return (
        <UserMemoryContext.Provider value={{
            memories,
            addMemory,
            updateMemory,
            deleteMemory,
            getMemory,
            clearMemory,
            isLoaded
        }}>
            {children}
        </UserMemoryContext.Provider>
    );
}

export function useUserMemory() {
    const context = useContext(UserMemoryContext);
    if (context === undefined) {
        throw new Error('useUserMemory must be used within a UserMemoryProvider');
    }
    return context;
}
