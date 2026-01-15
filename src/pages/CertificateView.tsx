import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Share2, Download, ArrowLeft, CheckCircle, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function CertificateView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const trackName = searchParams.get('track') || 'Sales Negotiation Mastery';
    const [date] = useState(new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }));

    useEffect(() => {
        // Trigger confetti on load
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleShare = () => {
        const text = `I just became a Certified Master in ${trackName} using FlowLearn! 🚀\n\n#SalesEnablement #Growth #Learning`;



        // For a better share intent that includes text, we often use the feed share or just text if URL isn't enough
        // But the standard share-offsite is safest. 
        // Alternative: Open a generic intent
        window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={20} /> Back to Learning
            </button>

            <div className="max-w-4xl w-full space-y-8 animate-in zoom-in duration-500">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full font-bold text-sm mb-4">
                        <CheckCircle size={16} /> Track Completed
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Congratulations, {user?.user_metadata?.full_name?.split(' ')[0] || 'Learner'}!</h1>
                    <p className="text-xl text-slate-600">You've mastered a new skill.</p>
                </div>

                {/* Certificate Card */}
                <div className="bg-white border-[10px] border-double border-slate-200 p-12 md:p-20 shadow-2xl relative text-center mx-auto max-w-3xl">
                    {/* Decorative Corner */}
                    <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-indigo-900 m-4"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-indigo-900 m-4"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-indigo-900 m-4"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-indigo-900 m-4"></div>

                    <div className="space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-indigo-900 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <Award size={40} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-serif text-slate-900 tracking-widest uppercase">Certificate of Mastery</h2>
                            <p className="text-slate-500 italic">This certifies that</p>
                        </div>

                        <div className="py-4 border-b-2 border-slate-100 max-w-lg mx-auto">
                            <h3 className="text-4xl font-cursive text-indigo-600 font-bold">{user?.user_metadata?.full_name || 'Alex Chen'}</h3>
                        </div>

                        <div className="space-y-2">
                            <p className="text-slate-500 italic">has successfully completed the track</p>
                            <h4 className="text-2xl font-bold text-slate-800">{trackName}</h4>
                        </div>

                        <div className="pt-8 text-slate-400 text-sm font-medium">
                            Issued on {date} • FlowLearn Academy
                        </div>
                    </div>

                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <Award size={400} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button
                        onClick={handleShare}
                        className="w-full md:w-auto px-8 py-4 bg-[#0077b5] text-white rounded-xl font-bold shadow-lg hover:bg-[#006396] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
                    >
                        <Share2 size={20} /> Share on LinkedIn
                    </button>
                    <button className="w-full md:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <Download size={20} /> Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
