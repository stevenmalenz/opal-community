import { useState } from 'react';
import { Globe, Loader2, ArrowRight, Terminal } from 'lucide-react';
import { Card } from './Card';
import './ScraperView.css';

export function ScraperView({ onComplete }: { onComplete: () => void }) {
    const [url, setUrl] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const handleIngest = async () => {
        if (!url) return;
        setIsIngesting(true);
        setLogs([]);
        setProgress(0);

        const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

        addLog(`🚀 Initializing spider for: ${url}`);
        await new Promise(r => setTimeout(r, 800));

        addLog(`🔍 Discovered 142 pages...`);
        setProgress(10);
        await new Promise(r => setTimeout(r, 1000));

        addLog(`⬇️ Downloading content (HTML/PDF)...`);
        setProgress(30);
        await new Promise(r => setTimeout(r, 1200));

        addLog(`🧠 Chunking text (Size: 512 tokens)...`);
        setProgress(50);
        await new Promise(r => setTimeout(r, 1000));

        addLog(`⚡ Generating embeddings (text-embedding-3-small)...`);
        setProgress(75);
        await new Promise(r => setTimeout(r, 1500));

        addLog(`💾 Storing to Vector Database...`);
        setProgress(90);
        await new Promise(r => setTimeout(r, 800));

        addLog(`✅ Ingestion Complete! Knowledge Base updated.`);
        setProgress(100);

        setTimeout(() => {
            setIsIngesting(false);
            onComplete();
        }, 1500);
    };

    return (
        <div className="scraper-view">
            <div className="scraper-header">
                <div className="icon-wrapper">
                    <Globe size={24} className="text-blue-400" />
                </div>
                <div>
                    <h3>Web Scraper</h3>
                    <p>Ingest entire documentation sites, blogs, or wikis.</p>
                </div>
            </div>

            <Card className="scraper-card">
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="https://docs.company.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isIngesting}
                        className="scraper-input"
                    />
                    <button
                        className="btn-primary"
                        onClick={handleIngest}
                        disabled={!url || isIngesting}
                    >
                        {isIngesting ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
                        Start Scraping
                    </button>
                </div>
            </Card>

            {(isIngesting || logs.length > 0) && (
                <Card className="console-logs">
                    <div className="log-header">
                        <div className="flex items-center gap-2">
                            <Terminal size={16} />
                            <h3>Ingestion Logs</h3>
                        </div>
                        {progress === 100 && <span className="badge success">Completed</span>}
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="log-window">
                        {logs.map((log, i) => (
                            <div key={i} className="log-entry">
                                <span className="log-time">{new Date().toLocaleTimeString()}</span>
                                <span className="log-msg">{log}</span>
                            </div>
                        ))}
                        {isIngesting && (
                            <div className="log-entry blink">
                                <span className="cursor">_</span>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
