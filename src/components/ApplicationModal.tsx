import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Sparkles, CheckCircle2, AlertTriangle, BarChart2, FileText, User, Loader2, Lightbulb, BookOpen } from 'lucide-react';
import { generateCoverLetter, analyzeResumeGap } from '../utils/ai';

interface Props {
    open: boolean;
    onClose: () => void;
    job: any;
    profile: any;
    onConfirm: (coverLetter: string) => Promise<void>;
}

const TABS = [
    { label: 'AI Insights', Icon: BarChart2 },
    { label: 'Cover Letter', Icon: FileText },
    { label: 'Preview Profile', Icon: User },
];

export default function ApplicationModal({ open, onClose, job, profile, onConfirm }: Props) {
    const [tab, setTab] = useState(0);
    const [coverLetter, setCoverLetter] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [gapAnalysis, setGapAnalysis] = useState<{ missing_skills: string[]; actions: string[]; resume_tips: string[] } | null>(null);
    const [gapLoading, setGapLoading] = useState(false);

    useEffect(() => {
        if (open && job && profile) {
            setGapAnalysis(null);
            setGapLoading(true);
            analyzeResumeGap(job, profile)
                .then(result => setGapAnalysis(result))
                .finally(() => setGapLoading(false));
        }
    }, [open, job?.id]);

    const details = job?.matchDetails || [];

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        const text = await generateCoverLetter(job, profile);
        setCoverLetter(text);
        setIsGenerating(false);
    };

    const handleSubmit = async () => {
        setIsApplying(true);
        await onConfirm(coverLetter);
        setIsApplying(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-card border border-border/60 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-0 border-b border-border/60">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-foreground">Apply to {job?.role}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">{job?.company_name || 'Tech Corp'} · {job?.location}</p>
                        </div>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {/* Tabs */}
                    <div className="flex overflow-x-auto">
                        {TABS.map(({ label, Icon }, idx) => (
                            <button
                                key={label}
                                onClick={() => setTab(idx)}
                                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === idx ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <Icon className="h-3.5 w-3.5" />{label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[300px] sm:min-h-[360px]">
                    {/* Tab 0: AI Insights */}
                    {tab === 0 && (
                        <div className="flex flex-col gap-5">
                            {/* Score bar */}
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                                <div className="relative inline-flex items-center justify-center w-14 h-14 shrink-0">
                                    <svg width="56" height="56" className="-rotate-90">
                                        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                        <circle cx="28" cy="28" r="22" fill="none" stroke="#34d399" strokeWidth="5"
                                            strokeDasharray={`${((job?.matchScore || 0) / 100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                                            strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute text-xs font-bold text-foreground">{job?.matchScore}%</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Excellent Match!</p>
                                    <p className="text-sm text-muted-foreground">You're in the top 10% of applicants for this role.</p>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-2">Why you matched:</p>
                                <div className="flex flex-wrap gap-2">
                                    {details.filter((d: any) => d.type === 'success').map((d: any, i: number) => (
                                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                            <CheckCircle2 className="h-3 w-3" />{d.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Gaps */}
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-2">Things to note:</p>
                                {details.filter((d: any) => d.type !== 'success').length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {details.filter((d: any) => d.type !== 'success').map((d: any, i: number) => (
                                            <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                                                <AlertTriangle className="h-3 w-3" />{d.label}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No major gaps found.</p>
                                )}
                            </div>

                            {/* AI Gap Analysis */}
                            {gapLoading && (
                                <div className="flex items-center gap-2 p-3 rounded-xl border border-border/60 bg-muted/40 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                    Pani AI is analyzing your resume gap...
                                </div>
                            )}

                            {!gapLoading && gapAnalysis && (
                                <>
                                    {gapAnalysis.missing_skills.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                                                Skills to add to your profile:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {gapAnalysis.missing_skills.map((skill, i) => (
                                                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {gapAnalysis.actions.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                                                How to improve your application:
                                            </p>
                                            <ul className="flex flex-col gap-1.5">
                                                {gapAnalysis.actions.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                        <span className="h-4 w-4 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
                                                        {action}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {gapAnalysis.resume_tips.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                                                Resume tips:
                                            </p>
                                            <ul className="flex flex-col gap-1.5">
                                                {gapAnalysis.resume_tips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex items-start gap-2 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300">
                                <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />
                                <span><strong>Pro Tip:</strong> Candidates with a customized cover letter are 2.8× more likely to get an interview.</span>
                            </div>
                        </div>
                    )}

                    {/* Tab 1: Cover Letter */}
                    {tab === 1 && (
                        <div className="flex flex-col gap-3 h-full">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">Customize your message</p>
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleGenerateAI} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    {isGenerating ? 'Writing...' : 'Generate with AI'}
                                </Button>
                            </div>
                            <textarea
                                rows={8}
                                value={coverLetter}
                                onChange={e => setCoverLetter(e.target.value)}
                                placeholder="Dear Hiring Manager..."
                                className="flex w-full flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground resize-none"
                            />
                        </div>
                    )}

                    {/* Tab 2: Preview */}
                    {tab === 2 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-2xl">
                                    {profile?.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{profile?.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{profile?.headline || 'No headline'}</p>
                                    <p className="text-xs text-muted-foreground">{profile?.location} · {profile?.email}</p>
                                </div>
                            </div>
                            <div className="h-px bg-border/60" />
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-2">Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile?.skills?.map((s: string) => (
                                        <span key={s} className="px-2 py-0.5 text-xs rounded-md border border-border text-muted-foreground">{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground mb-1">Experience</p>
                                <p className="text-sm text-muted-foreground">{profile?.experience_years} Years Total</p>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-400">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                Your resume will be automatically attached to this application.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/60">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isApplying} className="gap-2">
                        {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isApplying ? 'Submitting...' : 'Submit Application'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
