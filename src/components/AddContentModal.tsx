
import { X, Globe, FileText, Database, HardDrive, Loader2, CheckCircle, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { FirecrawlService } from '../lib/firecrawl';
import { suggestResources, type ResourceSuggestion } from '../lib/ai/coach';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './AddContentModal.css';

interface AddContentModalProps {
    onClose: () => void;
    onConnect?: (type: string) => void;
    editItem?: any;
}

type Tab = 'integrations' | 'scrape' | 'crawl' | 'map' | 'text' | 'file' | 'discovery';

export function AddContentModal({ onClose, onConnect, editItem }: AddContentModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>(editItem ? 'text' : 'integrations');
    const [url, setUrl] = useState(editItem?.title || '');
    const [textContent, setTextContent] = useState(editItem?.raw_content || '');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const firecrawl = new FirecrawlService();
    const { user } = useAuth();

    // Discovery State
    const [topic, setTopic] = useState('');
    const [suggestions, setSuggestions] = useState<ResourceSuggestion[]>([]);
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

    const [pollStatus, setPollStatus] = useState<any>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    const handleSuggest = async () => {
        if (!topic) return;
        setIsLoading(true);
        setError(null);
        try {
            const results = await suggestResources(topic);
            setSuggestions(results);
        } catch (e: any) {
            setError(e.message || "Failed to get suggestions");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSelectedSuggestions = async () => {
        setIsLoading(true);
        // Process selected suggestions
        // We will queue them for "Scraping" basically. 
        // For simplicity in this step, we'll just add them as separate "Web Page" items to be scraped in background or just add to DB with "pending" status if we supported that.
        // Actually Firecrawl scrape is relatively fast. Let's do them parallel.

        try {
            // Get Org ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (!profile?.org_id) throw new Error('Organization not found');

            const toProcess = suggestions.filter(s => selectedSuggestions.has(s.url));
            let successCount = 0;

            for (const item of toProcess) {
                // Trigger scrape for each
                try {
                    const res = await firecrawl.scrape(item.url);
                    if (res.success) {
                        await supabase.from('content').insert({
                            org_id: profile.org_id,
                            title: item.title,
                            url: item.url,
                            content_type: 'webpage',
                            raw_content: res.data.markdown,
                            metadata: {
                                source: 'ai_discovery',
                                topic: topic,
                                reason: item.reason,
                                ...res.data.metadata
                            }
                        });
                        successCount++;
                    }
                } catch (e) {
                    console.error(`Failed to scrape ${item.url}`, e);
                }
            }

            alert(`Successfully added ${successCount} resources!`);
            if (onConnect) onConnect('discovery');
            onClose();

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: Tab) => {
        setIsLoading(true);
        setError(null);
        setPollStatus(null);
        setResult(null);

        try {
            // Get Org ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user?.id)
                .single();

            if (!profile?.org_id) throw new Error('Organization not found');

            if (action === 'text') {
                if (!url || !textContent) return;

                if (editItem) {
                    const { error: updateError } = await supabase
                        .from('content')
                        .update({
                            title: url,
                            raw_content: textContent,
                        })
                        .eq('id', editItem.id);

                    if (updateError) throw updateError;
                    alert('Content updated successfully!');
                } else {
                    const { error: saveError } = await supabase.from('content').insert({
                        org_id: profile.org_id,
                        title: url,
                        url: null,
                        content_type: 'notion',
                        raw_content: textContent,
                        metadata: {
                            source: 'manual_entry',
                            file_type: 'text'
                        }
                    });

                    if (saveError) throw saveError;
                    alert('Content saved successfully!');
                }

                if (onConnect) onConnect('text');
                onClose();
                return;
            }

            if (action === 'file') {
                if (!url || !result) return;
                const { error: saveError } = await supabase.from('content').insert({
                    org_id: profile.org_id,
                    title: url,
                    url: null,
                    content_type: 'pdf',
                    raw_content: result,
                    metadata: {
                        source: 'file_upload',
                        file_type: 'file'
                    }
                });

                if (saveError) throw saveError;
                alert('Content saved successfully!');
                onClose();
                return;
            }

            // Firecrawl actions (Multi-URL Support)
            if (!url) return;

            // Split by comma or newline and filter empty strings
            const urls = url.split(/[\n,]+/).map((u: string) => u.trim()).filter((u: string) => u.length > 0);

            if (urls.length === 0) {
                setError("Please enter at least one valid URL");
                setIsLoading(false);
                return;
            }

            // Process URLs
            let successCount = 0;
            let failureCount = 0;
            const results: any[] = []; // Store results for preview if it's a single scrape

            for (let i = 0; i < urls.length; i++) {
                const currentUrl = urls[i];
                // Simple protocol check, prepend https:// if missing
                const processedUrl = currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`;

                try {
                    if (action === 'crawl') {
                        // For crawl, we launch the job and wait/poll
                        // Note: If user enters 10 URLs, this loop will launch 10 crawl jobs sequentially.
                        // We might want to alert them if they do too many.

                        // Update status to show which one we are working on
                        setPollStatus({ status: 'starting', total: urls.length, completed: i, processingUrl: processedUrl });

                        const res = await firecrawl.crawl(processedUrl, { limit: 200 });
                        if (res.success && res.data?.id) {
                            const jobId = res.data.id;

                            // Poll until complete
                            let crawlDone = false;
                            while (!crawlDone) {
                                await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                                const statusRes = await firecrawl.checkCrawlStatus(jobId);
                                if (statusRes.success && statusRes.data) {
                                    const status = statusRes.data;
                                    setPollStatus({
                                        ...status,
                                        processingUrl: processedUrl,
                                        multiProgress: `${i + 1}/${urls.length}`
                                    });

                                    if (status.status === 'completed') {
                                        crawlDone = true;
                                        const pages = status.data || [];
                                        for (const page of pages) {
                                            if (page.markdown) {
                                                await supabase.from('content').insert({
                                                    org_id: profile.org_id,
                                                    title: page.metadata?.title || page.metadata?.sourceURL || processedUrl,
                                                    url: page.metadata?.sourceURL || processedUrl,
                                                    content_type: 'webpage',
                                                    raw_content: page.markdown,
                                                    metadata: {
                                                        source: 'firecrawl_crawl',
                                                        credits_used: status.creditsUsed,
                                                        ...page.metadata
                                                    }
                                                });
                                            }
                                        }
                                        successCount++;
                                    } else if (status.status === 'failed') {
                                        crawlDone = true;
                                        failureCount++;
                                        console.error(`Crawl failed for ${processedUrl}`);
                                    }
                                } else {
                                    // Status check failed?
                                    console.warn(`Status check failed for ${jobId}`);
                                }
                            }
                        } else {
                            failureCount++;
                            console.error(`Failed to start crawl for ${processedUrl}: ${res.error}`);
                        }

                    } else if (action === 'scrape' || action === 'map') {
                        // Scrape/Map
                        setPollStatus({ status: 'scraping', total: urls.length, completed: i, processingUrl: processedUrl });

                        let res: any;
                        if (action === 'scrape') res = await firecrawl.scrape(processedUrl);
                        else if (action === 'map') res = await firecrawl.map(processedUrl);

                        if (res?.success) {
                            successCount++;
                            results.push(res.data); // Store for preview

                            await supabase.from('content').insert({
                                org_id: profile.org_id,
                                title: action === 'map' ? `Site Map: ${processedUrl}` : (res.data.metadata?.title || processedUrl),
                                url: processedUrl,
                                content_type: 'webpage',
                                raw_content: action === 'map' ? JSON.stringify(res.data.links) : res.data.markdown,
                                metadata: {
                                    source: 'firecrawl',
                                    scrape_type: action,
                                    ...res.data.metadata
                                }
                            });
                        } else {
                            failureCount++;
                            console.error(`Operation ${action} failed for ${processedUrl}: ${res?.error}`);
                        }
                    }
                } catch (e) {
                    console.error(`Error processing ${processedUrl}`, e);
                    failureCount++;
                }
            }

            // Final Reporting
            if (urls.length === 1 && results.length > 0) {
                setResult(results[0]); // Show preview for single item
            }

            if (successCount > 0) {
                alert(`Successfully processed ${successCount} URLs.${failureCount > 0 ? ` (${failureCount} failed)` : ''}`);
                if (onConnect) onConnect(action);
                if (urls.length > 1) onClose(); // Close if bulk, otherwise stay to show preview
            } else if (failureCount > 0) {
                setError(`Failed to process ${failureCount} URLs. Check console for details.`);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setPollStatus(null);
        }
    };

    const renderResult = () => {
        if (pollStatus) {
            return (
                <div className="result-preview" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <h4 className="flex items-center gap-2 font-semibold">
                        <Loader2 size={16} className="spin text-blue-500" />
                        {pollStatus.status === 'starting' ? 'Initializing...' : 'Processing...'}
                    </h4>

                    {pollStatus.processingUrl && (
                        <p className="text-xs text-slate-500 font-mono mt-1 mb-2 truncate">
                            Target: {pollStatus.processingUrl}
                        </p>
                    )}

                    {pollStatus.multiProgress && (
                        <div className="text-xs font-bold text-slate-700 mb-2">
                            Batch Progress: {pollStatus.multiProgress}
                        </div>
                    )}

                    <div className="space-y-2 text-sm text-slate-600">
                        <p>Status: <span className="font-medium capitalize">{pollStatus.status}</span></p>
                        {pollStatus.total > 0 && (
                            <>
                                <p>Pages: {pollStatus.completed} / {pollStatus.total}</p>
                                <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((pollStatus.completed / (pollStatus.total || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            Please keep this window open while we process your content.
                        </p>
                    </div>
                </div>
            );
        }

        if (!result) return null;

        if (activeTab === 'scrape') {
            return (
                <div className="result-preview">
                    <h4><CheckCircle size={16} className="text-green-500" /> Scrape Successful</h4>
                    <div className="code-block">
                        {result.markdown.substring(0, 500)}...
                    </div>
                </div>
            );
        }
        if (activeTab === 'map') {
            return (
                <div className="result-preview">
                    <h4><CheckCircle size={16} className="text-green-500" /> Found {result.links.length} Pages</h4>
                    <div className="link-list">
                        {result.links.slice(0, 10).map((link: string, i: number) => (
                            <div key={i} className="link-item">{link}</div>
                        ))}
                        {result.links.length > 10 && <div className="more-links">...and {result.links.length - 10} more</div>}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{editItem ? 'Edit Content' : 'Add Content'}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'integrations' && (
                        <div className="integration-grid">
                            <button className="integration-card" onClick={() => setActiveTab('discovery')}>
                                <div className="integration-icon bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
                                    <Sparkles size={24} />
                                </div>
                                <div className="integration-info">
                                    <h4 className="text-indigo-700 font-bold">AI Discovery</h4>
                                    <p>Auto-find resources</p>
                                </div>
                            </button>
                            <button className="integration-card" onClick={() => setActiveTab('text')}>
                                <div className="integration-icon"><FileText size={24} /></div>
                                <div className="integration-info"><h4>Paste Text</h4><p>Manual entry</p></div>
                            </button>
                            <button className="integration-card" onClick={() => setActiveTab('file')}>
                                <div className="integration-icon"><HardDrive size={24} /></div>
                                <div className="integration-info"><h4>Upload File</h4><p>PDF, CSV, MD</p></div>
                            </button>
                            <button className="integration-card" onClick={() => setActiveTab('scrape')}>
                                <div className="integration-icon"><Globe size={24} /></div>
                                <div className="integration-info"><h4>Web Scraper</h4><p>Ingest single pages</p></div>
                            </button>
                            <button className="integration-card" onClick={() => setActiveTab('crawl')}>
                                <div className="integration-icon"><Database size={24} /></div>
                                <div className="integration-info"><h4>Site Crawler</h4><p>Ingest entire domain</p></div>
                            </button>
                        </div>
                    )}

                    {activeTab === 'discovery' && (
                        <>
                            <button className="back-btn" onClick={() => setActiveTab('integrations')}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="input-group-vertical">
                                <label className="text-sm font-bold text-slate-700">What do you want to create a course about?</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. Firecrawl, React Patterns, Advanced SQL"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="title-input flex-1"
                                    />
                                    <button
                                        className="btn-primary"
                                        onClick={handleSuggest}
                                        disabled={isLoading || !topic}
                                    >
                                        {isLoading ? <Loader2 className="spin" /> : 'Suggest Sources'}
                                    </button>
                                </div>

                                {suggestions.length > 0 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
                                        <h4 className="text-sm font-bold text-slate-800 mb-2">Suggested Resources</h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {suggestions.map((s, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1"
                                                        checked={selectedSuggestions.has(s.url)}
                                                        onChange={(e) => {
                                                            const newSet = new Set(selectedSuggestions);
                                                            if (e.target.checked) newSet.add(s.url);
                                                            else newSet.delete(s.url);
                                                            setSelectedSuggestions(newSet);
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-slate-800 text-sm">{s.title}</h5>
                                                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mb-1">
                                                            {s.url}
                                                        </a>
                                                        <p className="text-xs text-slate-500">{s.reason}</p>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{s.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-sm text-slate-500">{selectedSuggestions.size} selected</span>
                                            <button
                                                className="btn-primary"
                                                onClick={handleAddSelectedSuggestions}
                                                disabled={selectedSuggestions.size === 0 || isLoading}
                                            >
                                                {isLoading ? <Loader2 className="spin" /> : `Import Selected (${selectedSuggestions.size})`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab !== 'integrations' && activeTab !== 'discovery' && (
                        <div className="firecrawl-panel">
                            {activeTab === 'text' ? (
                                <>
                                    <button className="back-btn" onClick={() => setActiveTab('integrations')}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <div className="input-group-vertical">
                                        <input
                                            type="text"
                                            placeholder="Title (e.g. Q3 Product Update)"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="title-input"
                                        />
                                        <textarea
                                            placeholder="Paste your content here..."
                                            className="text-area-input"
                                            rows={10}
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                        />
                                        <button
                                            className="btn-primary full-width"
                                            onClick={() => handleAction('text')}
                                            disabled={isLoading || !url || !textContent}
                                        >
                                            {isLoading ? <Loader2 className="spin" /> : 'Save Text'}
                                        </button>
                                    </div>
                                </>
                            ) : activeTab === 'file' ? (
                                <>
                                    <button className="back-btn" onClick={() => setActiveTab('integrations')}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <div className="input-group-vertical">
                                        <div className="file-upload-area">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                accept=".pdf,.csv,.md,.txt"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setUrl(file.name);
                                                        const reader = new FileReader();
                                                        reader.onload = (e) => setResult(e.target?.result);
                                                        reader.readAsText(file);
                                                    }
                                                }}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="file-upload" className="file-upload-label">
                                                <HardDrive size={32} />
                                                <span>Click to upload PDF, CSV, or Text</span>
                                                <span className="file-name">{url || 'No file selected'}</span>
                                            </label>
                                        </div>
                                        <button
                                            className="btn-primary full-width"
                                            onClick={() => handleAction('file')}
                                            disabled={isLoading || !url || !result}
                                        >
                                            {isLoading ? <Loader2 className="spin" /> : 'Upload File'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button className="back-btn" onClick={() => setActiveTab('integrations')}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <div className="input-group">
                                        <textarea
                                            placeholder="https://example.com&#10;https://another-site.com"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="url-input"
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '0.5rem',
                                                padding: '0.75rem',
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleAction(activeTab as any)}
                                            disabled={isLoading || !url}
                                        >
                                            {isLoading ? <Loader2 className="spin" /> : 'Run'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {error && (
                                <div className="error-message">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {renderResult()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
