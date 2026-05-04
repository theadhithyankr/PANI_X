import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
    X, Sparkles, Loader2, ThumbsUp, ThumbsDown,
    Lightbulb, ChevronRight, ExternalLink, Zap, ShieldCheck, Target, FileText
} from 'lucide-react';
import { analyzeProfileStrengths, type ProfileAnalysis } from '../../utils/ai';
import { extractTextFromUrl } from '../../utils/pdf';

interface AvailableJob {
    id?: string;
    title?: string;
    role?: string;
    skills?: string[];
    experience_level?: string;
    work_mode?: string;
    location?: string;
    company_name?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    resumeUrl: string;
    candidateName: string;
    profile: any;
    viewerRole: 'employer' | 'candidate';
    jobContext?: any;
    availableJobs?: AvailableJob[];
}

const HIRE_COLORS: Record<string, string> = {
    'Strong Hire': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'Hire':        'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'Maybe':       'text-amber-400 bg-amber-400/10 border-amber-400/30',
    'Pass':        'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

export default function ResumeViewerModal({ open, onClose, resumeUrl, candidateName, profile, viewerRole, jobContext, availableJobs }: Props) {
    const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [targetJobTitle, setTargetJobTitle] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        if (!open) {
            setAnalysis(null);
            setShowAnalysis(false);
            setSelectedJobId('');
            setTargetJobTitle('');
        }
    }, [open]);

    const selectedJob = availableJobs?.find(j => j.id === selectedJobId) ?? null;
    const activeJobContext = selectedJob ?? jobContext ?? null;

    const runAnalysis = async () => {
        setAnalyzing(true);
        setShowAnalysis(true);

        try {
            let extractedText = '';
            try {
                if (resumeUrl) extractedText = await extractTextFromUrl(resumeUrl);
            } catch (e) {
                console.warn("Could not extract PDF text, falling back to profile metadata:", e);
            }

            const result = await analyzeProfileStrengths(
                profile, viewerRole, activeJobContext, extractedText,
                !activeJobContext ? targetJobTitle : undefined
            );
            setAnalysis(result);
        } catch {
            setAnalysis(null);
        } finally {
            setAnalyzing(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-violet-400/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground text-sm">{candidateName}'s Resume</h2>
                            <p className="text-xs text-muted-foreground">Inline preview · Click analyze for AI insights</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-xl text-xs"
                            onClick={() => window.open(resumeUrl, '_blank')}
                        >
                            <ExternalLink className="h-3 w-3" /> Open in Tab
                        </Button>
                        {!showAnalysis && (
                            <Button
                                size="sm"
                                className="gap-1.5 rounded-xl text-xs bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border-0"
                                onClick={runAnalysis}
                            >
                                <Sparkles className="h-3 w-3" /> AI Analysis
                            </Button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
                    {/* PDF Viewer / Mobile placeholder */}
                    {isMobile ? (
                        <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 p-8 shrink-0">
                            <FileText className="h-16 w-16 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground text-center">PDF preview isn't available on mobile</p>
                            <Button onClick={() => window.open(resumeUrl, '_blank')} className="gap-2">
                                <ExternalLink className="h-4 w-4" /> Open Resume
                            </Button>
                        </div>
                    ) : (
                        <div className={`flex-1 bg-neutral-900/50 transition-all duration-300 ${showAnalysis ? 'w-[55%]' : 'w-full'}`}>
                            <iframe
                                src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full border-0"
                                title="Resume Preview"
                                style={{ background: '#1a1a2e' }}
                            />
                        </div>
                    )}

                    {/* AI Analysis Sidebar / Mobile full-width panel */}
                    {showAnalysis && (
                        <div className={`${isMobile ? 'w-full border-t' : 'w-[45%] border-l'} border-border/60 flex flex-col bg-card overflow-hidden animate-in ${isMobile ? 'slide-in-from-bottom-5' : 'slide-in-from-right-5'} duration-300`}>
                            {/* Sidebar Header */}
                            <div className="px-4 py-3 border-b border-border/60 bg-gradient-to-r from-violet-500/5 to-blue-500/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-violet-400" />
                                        <h3 className="font-semibold text-sm text-foreground">AI Profile Analysis</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs rounded-lg"
                                            onClick={runAnalysis}
                                            disabled={analyzing}
                                        >
                                            {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                            Re-analyze
                                        </Button>
                                        <button
                                            onClick={() => setShowAnalysis(false)}
                                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                {(viewerRole === 'candidate' || (viewerRole === 'employer' && availableJobs?.length)) && (
                                    <div className="mt-3 flex items-center gap-2 px-1">
                                        {availableJobs?.length ? (
                                            <select
                                                value={selectedJobId}
                                                onChange={e => setSelectedJobId(e.target.value)}
                                                className="flex-1 h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                disabled={analyzing}
                                            >
                                                <option value="">— Select a job to target —</option>
                                                {availableJobs.map((j, i) => (
                                                    <option key={j.id ?? i} value={j.id ?? ''}>
                                                        {j.title || j.role}{j.company_name ? ` · ${j.company_name}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="What job are you looking for? e.g. Senior Frontend Engineer"
                                                value={targetJobTitle}
                                                onChange={e => setTargetJobTitle(e.target.value)}
                                                className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                disabled={analyzing}
                                            />
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={runAnalysis}
                                            disabled={analyzing || (!selectedJobId && !targetJobTitle && !jobContext)}
                                            className="h-8 text-xs rounded-lg whitespace-nowrap"
                                        >
                                            Analyze
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Analysis Content */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="relative">
                                            <div className="h-12 w-12 rounded-full bg-violet-400/10 flex items-center justify-center">
                                                <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
                                            </div>
                                            <Loader2 className="absolute -top-1 -right-1 h-4 w-4 text-violet-400 animate-spin" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Analyzing profile...</p>
                                        <p className="text-xs text-muted-foreground/60">This may take a few seconds</p>
                                    </div>
                                ) : analysis ? (
                                    <>
                                        {/* Summary Card */}
                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-card border border-border shrink-0 shadow-sm relative overflow-hidden">
                                                    {analysis.ats_score !== undefined ? (
                                                        <>
                                                            <div className={`absolute bottom-0 w-full opacity-20 ${analysis.ats_score >= 80 ? 'bg-emerald-500' : analysis.ats_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ height: `${analysis.ats_score}%` }} />
                                                            <span className="text-sm font-bold z-10">{analysis.ats_score}</span>
                                                            <span className="text-[9px] text-muted-foreground uppercase z-10 font-bold tracking-wider -mt-1">ATS</span>
                                                        </>
                                                    ) : (
                                                        <ShieldCheck className="h-5 w-5 text-violet-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                                            <Target className="h-4 w-4 text-violet-400" /> ATS Scan Results
                                                        </p>
                                                        {analysis.hire_recommendation && (
                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${HIRE_COLORS[analysis.hire_recommendation] || 'text-muted-foreground bg-muted/40 border-border'}`}>
                                                                {analysis.hire_recommendation}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.overall_summary}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Strengths */}
                                        {analysis.strengths.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 px-0.5">
                                                    <ThumbsUp className="h-3 w-3 text-emerald-400" /> Strengths
                                                </p>
                                                <div className="flex flex-col gap-1.5">
                                                    {analysis.strengths.map((s, i) => (
                                                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 text-xs">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                            <span className="text-foreground leading-relaxed">{s}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Weaknesses */}
                                        {analysis.weaknesses.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 px-0.5">
                                                    <ThumbsDown className="h-3 w-3 text-rose-400" /> Areas of Concern
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    {analysis.weaknesses.map((w, i) => (
                                                        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-rose-400/20 bg-rose-400/5 text-xs">
                                                            <div className="flex items-start gap-2">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                                                <span className="text-foreground font-medium leading-relaxed">{w.issue}</span>
                                                            </div>
                                                            <div className="flex items-start gap-2 ml-3.5 mt-0.5">
                                                                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                                <span className="text-muted-foreground leading-relaxed italic">{w.suggestion}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {analysis.suggestions.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 px-0.5">
                                                    <Target className="h-3 w-3 text-amber-400" /> {viewerRole === 'employer' ? 'Next Steps' : 'Ideal Roles'}
                                                </p>
                                                <div className="flex flex-col gap-1.5">
                                                    {analysis.suggestions.map((s, i) => (
                                                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-400/20 bg-amber-400/5 text-xs">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                            <span className="text-foreground leading-relaxed">{s}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="h-12 w-12 rounded-full bg-rose-400/10 flex items-center justify-center">
                                            <X className="h-5 w-5 text-rose-400" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Analysis failed. Please try again.</p>
                                        <Button size="sm" variant="outline" onClick={runAnalysis} className="rounded-xl gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5" /> Retry
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
