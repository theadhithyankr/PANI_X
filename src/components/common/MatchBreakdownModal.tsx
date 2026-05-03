import { X, CheckCircle2, AlertCircle, MinusCircle, Target, Briefcase, MapPin, Code2, Star } from 'lucide-react';
import { Button } from '../ui/button';

export interface MatchDetail {
    label: string;
    type: 'success' | 'warning' | 'neutral';
    score?: string;
    category?: 'role' | 'skills' | 'experience' | 'location';
}

interface Props {
    open: boolean;
    onClose: () => void;
    score: number;
    candidateName?: string;
    jobTitle?: string;
    details: MatchDetail[];
}

function scoreColor(s: number) {
    return s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-rose-400';
}
function scoreBg(s: number) {
    return s >= 70 ? 'bg-emerald-400' : s >= 40 ? 'bg-amber-400' : 'bg-rose-400';
}

const DOMAIN_CONFIG = {
    role: { label: 'Role Match', Icon: Star, color: 'text-violet-400', bg: 'bg-violet-400/8' },
    skills: { label: 'Skills', Icon: Code2, color: 'text-blue-400', bg: 'bg-blue-400/8' },
    experience: { label: 'Experience', Icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-400/8' },
    location: { label: 'Location', Icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-400/8' },
} as const;

const TYPE_ICON = {
    success: { Icon: CheckCircle2, color: 'text-emerald-400' },
    warning:  { Icon: AlertCircle,  color: 'text-rose-400' },
    neutral:  { Icon: MinusCircle,  color: 'text-amber-400' },
};

export default function MatchBreakdownModal({ open, onClose, score, candidateName, jobTitle, details }: Props) {
    if (!open) return null;

    const byCategory = {
        role: details.filter(d => d.category === 'role'),
        skills: details.filter(d => d.category === 'skills'),
        experience: details.filter(d => d.category === 'experience'),
        location: details.filter(d => d.category === 'location'),
        uncategorized: details.filter(d => !d.category),
    };

    const matchedSkills = byCategory.skills.filter(d => d.type === 'success');
    const missingSkills = byCategory.skills.filter(d => d.type === 'warning');

    const domainScore = (items: MatchDetail[]) =>
        items.reduce((acc, d) => acc + (d.score ? parseInt(d.score.replace(/[^0-9]/g, '') || '0') : 0), 0);

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
                {/* drag handle */}
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

                    {/* Domain sections */}
                    {details.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                What we checked
                            </p>

                            {/* Role */}
                            {byCategory.role.length > 0 && (
                                <DomainSection
                                    domain="role"
                                    totalScore={domainScore(byCategory.role)}
                                    items={byCategory.role}
                                />
                            )}

                            {/* Skills */}
                            {byCategory.skills.length > 0 && (
                                <div className="rounded-xl border border-border/60 overflow-hidden">
                                    <div className={`flex items-center justify-between px-3 py-2 ${DOMAIN_CONFIG.skills.bg} border-b border-border/40`}>
                                        <div className="flex items-center gap-2">
                                            <Code2 className={`h-3.5 w-3.5 ${DOMAIN_CONFIG.skills.color}`} />
                                            <span className="text-xs font-semibold text-foreground">Skills</span>
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-400">+{domainScore(matchedSkills)}%</span>
                                    </div>
                                    <div className="px-3 py-2.5 space-y-2">
                                        {matchedSkills.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1.5">Matched</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {matchedSkills.map((d, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                                                            <CheckCircle2 className="h-3 w-3" /> {d.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {missingSkills.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1.5">Missing</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {missingSkills.map((d, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-400/10 text-rose-400 border border-rose-400/20">
                                                            <AlertCircle className="h-3 w-3" /> {d.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {byCategory.experience.length > 0 && (
                                <DomainSection
                                    domain="experience"
                                    totalScore={domainScore(byCategory.experience)}
                                    items={byCategory.experience}
                                />
                            )}

                            {/* Location */}
                            {byCategory.location.length > 0 && (
                                <DomainSection
                                    domain="location"
                                    totalScore={domainScore(byCategory.location)}
                                    items={byCategory.location}
                                />
                            )}

                            {/* Uncategorized fallback */}
                            {byCategory.uncategorized.map((d, i) => {
                                const { Icon, color } = TYPE_ICON[d.type];
                                return (
                                    <div key={i} className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-sm ${d.type === 'success' ? 'bg-emerald-400/10 border-emerald-400/20' : d.type === 'warning' ? 'bg-rose-400/10 border-rose-400/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                                            <span className="text-foreground">{d.label}</span>
                                        </div>
                                        {d.score && <span className={`text-xs font-semibold ${color}`}>{d.score}</span>}
                                    </div>
                                );
                            })}
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

function DomainSection({ domain, totalScore, items }: {
    domain: keyof typeof DOMAIN_CONFIG;
    totalScore: number;
    items: MatchDetail[];
}) {
    const { label, Icon, color, bg } = DOMAIN_CONFIG[domain];
    return (
        <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className={`flex items-center justify-between px-3 py-2 ${bg} border-b border-border/40`}>
                <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                </div>
                {totalScore > 0 && <span className="text-xs font-semibold text-emerald-400">+{totalScore}%</span>}
            </div>
            <div className="px-3 py-2 space-y-1.5">
                {items.map((d, i) => {
                    const { Icon: ItemIcon, color: itemColor } = TYPE_ICON[d.type];
                    return (
                        <div key={i} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <ItemIcon className={`h-3.5 w-3.5 shrink-0 ${itemColor}`} />
                                <span className="text-sm text-foreground">{d.label}</span>
                            </div>
                            {d.score && <span className={`text-xs font-semibold ${itemColor}`}>{d.score}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
