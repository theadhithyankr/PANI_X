import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, MapPin, DollarSign, CheckCircle2, Briefcase } from 'lucide-react';
import { useJobs, useApplications, useProfile } from '../hooks/useSupabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateJobMatch } from '../utils/ai';
import ApplicationModal from '../components/ApplicationModal';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { Pagination } from '../components/ui/pagination';
import { usePageContext } from '../contexts/PageContext';

const PAGE_SIZE = 10;

function MatchRing({ score }: { score: number }) {
    const color = score > 90 ? '#34d399' : score > 75 ? '#a78bfa' : '#fbbf24';
    const r = 28;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div className="relative inline-flex items-center justify-center w-16 h-16 shrink-0">
            <svg width="64" height="64" className="-rotate-90">
                <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-xs font-bold text-foreground">{score}%</span>
        </div>
    );
}

function JobCardSkeleton() {
    return (
        <Card className="bg-card border-border/60">
            <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-36" />
                        <div className="flex gap-2 mt-3">
                            <Skeleton className="h-6 w-16 rounded-md" />
                            <Skeleton className="h-6 w-16 rounded-md" />
                        </div>
                    </div>
                    <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function FindJobs() {
    const { jobs, loading } = useJobs({ activeOnly: true });
    const { applyToJob, applications } = useApplications();
    const { user } = useAuth();
    const { profile } = useProfile();
    const { setPageContext, clearPageContext } = usePageContext();

    const toast = useToast();
    const [openApply, setOpenApply] = useState(false);
    const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [scoredJobs, setScoredJobs] = useState<any[]>([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (applications.length > 0) setAppliedJobs(applications.map(a => a.job_id));
    }, [applications]);

    useEffect(() => {
        if (jobs.length > 0) {
            const scored = jobs.map(job => {
                const { score, reason, details } = calculateJobMatch(job, profile);
                return { ...job, matchScore: score, matchReason: reason, matchDetails: details };
            }).sort((a, b) => b.matchScore - a.matchScore);
            setScoredJobs(scored);
            setPage(1);
        }
    }, [jobs, profile]);

    useEffect(() => {
        if (!scoredJobs.length) return;
        const topJobs = scoredJobs.slice(0, 8).map(j =>
            `- "${j.role}" at ${j.company_name} (${j.location || 'Remote'}) — Match: ${j.matchScore}% | Type: ${j.type || 'N/A'}`
        ).join('\n');
        setPageContext({
            page: 'Find Jobs',
            summary: `Browsing the jobs list. Total available: ${scoredJobs.length}.
Top matching jobs for this candidate:
${topJobs}`,
            suggestions: [
                'Which job should I apply to first?',
                'How can I improve my match scores?',
                'What skills should I learn to get better matches?',
            ],
        });
        return () => clearPageContext();
    }, [scoredJobs.length]);

    const handleApplyClick = (job: any) => { setSelectedJob(job); setIsSuccess(false); setOpenApply(true); };
    const handleClose = () => { setOpenApply(false); setTimeout(() => setIsSuccess(false), 200); };

    const confirmApply = async (coverLetter: string) => {
        if (!selectedJob || !user) return;
        try {
            await applyToJob(selectedJob.id, user.id, coverLetter);
            setIsSuccess(true);
            setAppliedJobs(prev => [...prev, selectedJob.id]);
        } catch {
            toast('Failed to apply. Please try again.', 'error');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col gap-8">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Card className="bg-card border-2 border-border/60">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                    <Skeleton className="h-7 w-64" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <Skeleton className="h-32 w-32 rounded-full shrink-0" />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const [topMatch, ...rest] = scoredJobs;
    const totalPages = Math.ceil(rest.length / PAGE_SIZE);
    const otherMatches = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Job Recommendations</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Based on your profile, we found {jobs.length} matches.</p>
                </div>

                {scoredJobs.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No jobs available yet"
                        description="Check back soon — new roles are posted regularly. Make sure your profile is complete to get better matches."
                    />
                ) : (
                    <>
                        {/* Top Match Hero */}
                        {topMatch && (
                            <Card className="bg-card border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        <div className="flex-1">
                                            <span className="px-2.5 py-0.5 text-xs rounded-full font-semibold border bg-emerald-400/10 text-emerald-400 border-emerald-400/30 mb-4 inline-block">
                                                ✨ Top Match
                                            </span>
                                            <h2 className="text-2xl font-bold text-foreground mb-3">{topMatch.role}</h2>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{topMatch.company_name || 'Tech Corp'}</span>
                                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{topMatch.location}</span>
                                                <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{topMatch.salary_range || 'Competitive'}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                                {topMatch.description?.substring(0, 180)}...
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {topMatch.skills?.slice(0, 4).map((skill: string) => (
                                                    <span key={skill} className="px-2 py-0.5 text-xs rounded-md border border-border text-muted-foreground">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-center gap-4 md:min-w-[160px]">
                                            <div className="relative inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 shrink-0">
                                                <svg viewBox="0 0 128 128" className="-rotate-90 w-full h-full">
                                                    <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                                    <circle cx="64" cy="64" r="54" fill="none" stroke="#34d399" strokeWidth="8"
                                                        strokeDasharray={`${(topMatch.matchScore / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                                                        strokeLinecap="round" />
                                                </svg>
                                                <div className="absolute text-center">
                                                    <p className="text-2xl font-bold text-foreground">{topMatch.matchScore}%</p>
                                                    <p className="text-xs text-emerald-400 font-semibold">MATCH</p>
                                                </div>
                                            </div>
                                            {topMatch.matchReason && (
                                                <span className="px-2 py-0.5 text-xs rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-400 text-center max-w-[160px] leading-tight">
                                                    {topMatch.matchReason}
                                                </span>
                                            )}
                                            {appliedJobs.includes(topMatch.id) ? (
                                                <Button variant="outline" className="w-full gap-2 border-emerald-500/40 text-emerald-400" disabled>
                                                    <CheckCircle2 className="h-4 w-4" /> Applied
                                                </Button>
                                            ) : (
                                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApplyClick(topMatch)}>
                                                    Apply Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {rest.length > 0 && (
                            <>
                                <h2 className="text-lg sm:text-xl font-bold text-foreground">Other High Potential Matches</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {otherMatches.map((job) => (
                                        <Card key={job.id} className="bg-card border-border/60 hover:border-primary/30 transition-colors">
                                            <CardContent className="pt-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-foreground">{job.role}</p>
                                                        <p className="text-sm text-muted-foreground mb-3">{job.company_name || 'Hidden Name'}</p>
                                                        <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
                                                            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{job.location} · {job.type}</span>
                                                            <span className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" />{job.salary_range || 'Competitive'}</span>
                                                        </div>
                                                        <div className="h-px bg-border/60 mb-3" />
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {job.skills?.slice(0, 2).map((skill: string) => (
                                                                    <span key={skill} className="px-2 py-0.5 text-xs rounded-md border border-border text-muted-foreground">{skill}</span>
                                                                ))}
                                                                {(job.skills?.length || 0) > 2 && (
                                                                    <span className="px-2 py-0.5 text-xs rounded-md border border-border text-muted-foreground">+{(job.skills?.length || 0) - 2}</span>
                                                                )}
                                                            </div>
                                                            {appliedJobs.includes(job.id) ? (
                                                                <Button size="sm" variant="ghost" className="gap-1 text-emerald-400" disabled>
                                                                    <CheckCircle2 className="h-3 w-3" /> Applied
                                                                </Button>
                                                            ) : (
                                                                <Button size="sm" onClick={() => handleApplyClick(job)}>Easy Apply</Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <MatchRing score={job.matchScore} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                            </>
                        )}
                    </>
                )}
            </div>

            <ApplicationModal
                open={openApply && !isSuccess}
                onClose={handleClose}
                job={selectedJob}
                profile={profile}
                onConfirm={confirmApply}
            />

            {isSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-card border border-border/60 rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl">
                        <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-6">Application Sent!</h2>
                        <Button onClick={handleClose} className="w-full">Browse More Jobs</Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
