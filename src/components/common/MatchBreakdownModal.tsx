import { X, CheckCircle2, AlertCircle, MinusCircle, Target } from 'lucide-react';
import { Button } from '../ui/button';

export interface MatchDetail {
    label: string;
    type: 'success' | 'warning' | 'neutral';
    score?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    score: number;
    candidateName?: string;
    jobTitle?: string;
    details: MatchDetail[];
}

const TYPE_CFG = {
    success: { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    warning:  { Icon: AlertCircle,  color: 'text-rose-400',    bg: 'bg-rose-400/10 border-rose-400/20' },
    neutral:  { Icon: MinusCircle,  color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
};

function scoreColor(s: number) {
    return s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-rose-400';
}
function scoreBg(s: number) {
    return s >= 70 ? 'bg-emerald-400' : s >= 40 ? 'bg-amber-400' : 'bg-rose-400';
}

export default function MatchBreakdownModal({ open, onClose, score, candidateName, jobTitle, details }: Props) {
    if (!open) return null;

    const successes = details.filter(d => d.type === 'success');
    const warnings  = details.filter(d => d.type === 'warning');
    const neutrals  = details.filter(d => d.type === 'neutral');
    const ordered   = [...successes, ...neutrals, ...warnings];

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
                {/* drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-foreground">Match Breakdown</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Score */}
                    <div className="flex flex-col items-center gap-3 py-2">
                        {(candidateName || jobTitle) && (
                            <p className="text-xs text-muted-foreground text-center">
                                {candidateName}{candidateName && jobTitle ? ' · ' : ''}{jobTitle}
                            </p>
                        )}
                        <span className={`text-6xl font-black ${scoreColor(score)}`}>{score}%</span>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${scoreBg(score)} transition-all duration-500`}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Overall compatibility score</p>
                    </div>

                    {/* Details */}
                    {ordered.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                                What we checked
                            </p>
                            <div className="flex flex-col gap-2">
                                {ordered.map((d, i) => {
                                    const { Icon, color, bg } = TYPE_CFG[d.type];
                                    return (
                                        <div key={i} className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-sm ${bg}`}>
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                                                <span className="text-foreground">{d.label}</span>
                                            </div>
                                            {d.score && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded border bg-background/50 ${color} border-current/20`}>
                                                    {d.score}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No detailed breakdown available — complete your profile for better insights.
                        </p>
                    )}
                </div>

                <div className="px-5 pb-5 pt-2">
                    <Button className="w-full rounded-xl" onClick={onClose}>Done</Button>
                </div>
            </div>
        </div>
    );
}
