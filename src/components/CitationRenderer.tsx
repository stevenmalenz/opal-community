import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

interface Source {
    id: number;
    title: string;
    url?: string;
}

interface CitationRendererProps {
    text: string;
    sources: Source[];
}

export function CitationRenderer({ text, sources }: CitationRendererProps) {
    // Regex to match [1], [2], etc.
    // We split the text by this regex to get segments.
    // The regex is /(\[\d+\])/g
    const parts = text.split(/(\[\d+\])/g);

    return (
        <span className="leading-relaxed">
            {parts.map((part, i) => {
                const match = part.match(/^\[(\d+)\]$/);
                if (match) {
                    const index = parseInt(match[1]);
                    const source = sources.find(s => s.id === index);

                    if (source) {
                        return <CitationChip key={i} source={source} index={index} />;
                    }
                    return <span key={i} className="text-gray-400 text-xs align-super ml-0.5 select-none" title="Source not found">{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}

export function CitationChip({ source, index }: { source: Source; index: number }) {
    const [showPopover, setShowPopover] = useState(false);

    return (
        <span
            className="relative inline-block ml-0.5 align-super text-xs z-10"
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
        >
            <button
                className={`
                    w-4 h-4 rounded-full flex items-center justify-center 
                    bg-purple-100 text-purple-700 font-bold 
                    hover:bg-purple-200 transition-colors cursor-pointer border border-purple-200
                    text-[9px] shadow-sm
                `}
                aria-label={`Citation ${index}`}
            >
                {index}
            </button>

            {showPopover && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[200px] max-w-xs bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-md">
                            <FileText size={16} className="text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Source {index}</div>
                            <div className="text-sm font-medium text-gray-900 leading-snug mb-2 line-clamp-2">
                                {source.title}
                            </div>
                            {source.url && (
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
                                >
                                    View Source <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </span>
    );
}
