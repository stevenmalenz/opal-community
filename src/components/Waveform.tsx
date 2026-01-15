import { useEffect, useState } from 'react';

export function Waveform({ isRecording }: { isRecording: boolean }) {
    const [bars, setBars] = useState<number[]>(Array(20).fill(10));

    useEffect(() => {
        if (!isRecording) return;

        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.random() * 24 + 8));
        }, 100);

        return () => clearInterval(interval);
    }, [isRecording]);

    return (
        <div className="flex items-center gap-1 h-8">
            {bars.map((height, i) => (
                <div
                    key={i}
                    className="w-1 bg-indigo-500 rounded-full transition-all duration-100"
                    style={{ height: `${height}px` }}
                />
            ))}
        </div>
    );
}
