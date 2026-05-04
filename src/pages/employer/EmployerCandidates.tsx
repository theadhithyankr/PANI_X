import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Bookmark, SlidersHorizontal, Search, Users, MessageSquare, Target, Briefcase, ChevronDown } from 'lucide-react';
import { useCandidates, useJobs } from '../../hooks/useSupabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateJobMatch } from '../../utils/ai';
import ChatInterface from '../../components/ChatInterface';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';
import { Pagination } from '../../components/ui/pagination';
import MatchBreakdownModal from '../../components/common/MatchBreakdownModal';
import type { Candidate } from '../../hooks/useSupabase';

const STATUS_STYLES: Record<string, string> = {
    accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    rejected: 'bg-rose-400/10 text-rose-400 border-rose-400/30',
    interview: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    offer: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
    reviewed: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
    pending: 'bg-muted/40 text-muted-foreground border-border',
};

export default function EmployerCandidates() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { candidates, loading } = useCandidates();
    const { jobs } = useJobs();
    const toast = useToast();

    const [chatCandidate, setChatCandidate] = useState<Candidate | null>(null);
    const [breakdown, setBreakdown] = useState<{ candidate: Candidate; score: number; details: any[] } | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('saved_candidates') || '[]')); }
        catch { return new Set(); }
    });
    const [search, setSearch] = useState('');
    const [minMatch, setMinMatch] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [showSavedOnly, setShowSavedOnly] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 12;

    // Only show this employer's jobs
    const employerJobs = useMemo(
        () => jobs.filter(j => j.employer_id === user?.id),
        [jobs, user?.id]
    );

    const selectedJob = employerJobs.find(j => j.id === selectedJobId) ?? null;

    // Compute live match scores for every candidate against the selected job
    const jobScores = useMemo(() => {
        const map = new Map<string, { score: number; details: any[] }>();
        if (!selectedJob) return map;
        for (const c of candidates) {
            const result = calculateJobMatch(selectedJob, c);
            map.set(c.id, { score: result.score, details: result.details });
        }
        return map;
    }, [selectedJob, candidates]);

    const getScore = (c: Candidate) => jobScores.get(c.id)?.score ?? c.match_score;

    const toggleSave = (id: string, name: string) => {
        setSavedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); toast(`Removed ${name} from saved`, 'info'); }
            else { next.add(id); toast(`Saved ${name}`, 'success'); }
            localStorage.setItem('saved_candidates', JSON.stringify([...next]));
            return next;
        });
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return candidates
            .filter(c =>
                (c.full_name.toLowerCase().includes(q) ||
                 (c.role || '').toLowerCase().includes(q) ||
                 (c.skills || []).some((s: string) => s.toLowerCase().includes(q))) &&
                getScore(c) >= minMatch &&
                (!showSavedOnly || savedIds.has(c.id))
            )
            .sort((a, b) => getScore(b) - getScore(a));
    }, [candidates, search, minMatch, showSavedOnly, savedIds, jobScores]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const scoreStyle = (score: number) =>
        score >= 70 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
        : score >= 40 ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
        : 'bg-rose-400/10 text-rose-400 border-rose-400/30';

    const openBreakdown = (candidate: Candidate) => {
        if (selectedJob) {
            const result = calculateJobMatch(selectedJob, candidate);
            setBreakdown({ candidate, score: result.score, details: result.details });
        } else {
            setBreakdown({
                candidate,
                score: candidate.match_score,
                details: candidate.match_details || [],
            });
        }
    };

    if (loading) {
        return (
            <EmployerLayout>
                <div className="flex flex-col gap-6">
                    <div>
                        <Skeleton className="h-8 w-40 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="rounded-2xl border-border/60">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                                    </div>
                                    <Skeleton className="h-3 w-40" />
                                    <div className="flex gap-1.5">
                                        {[1,2,3].map(j => <Skeleton key={j} className="h-6 w-16 rounded-full" />)}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Skeleton className="h-9 flex-1 rounded-xl" />
                                        <Skeleton className="h-9 w-9 rounded-xl" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </EmployerLayout>
        );
    }

    return (
        <>
        <EmployerLayout>
            <div className="flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="hidden md:block">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Candidates</h1>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            {selectedJob
                                ? `Scoring against "${selectedJob.title || selectedJob.role}"`
                                : 'Top talent matched for your open roles.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showSavedOnly ? 'default' : 'outline'}
                            className="gap-2 rounded-xl"
                            onClick={() => { setShowSavedOnly(s => !s); setPage(1); }}
                        >
                            <Bookmark className={`h-4 w-4 ${showSavedOnly ? 'fill-current' : ''}`} />
                            <span className="hidden sm:inline">Saved</span>
                            {savedIds.size > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${showSavedOnly ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                    {savedIds.size}
                                </span>
                            )}
                        </Button>
                        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setShowFilters(f => !f)}>
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline">Filters</span>
                        </Button>
                    </div>
                </div>

                {/* Job selector */}
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                        value={selectedJobId}
                        onChange={e => { setSelectedJobId(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-8 h-11 rounded-xl border border-input bg-background text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                        <option value="">Score for: All Jobs (best match)</option>
                        {employerJobs.map(job => (
                            <option key={job.id} value={job.id}>
                                {job.title || job.role}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name, role, or skill..."
                            className="w-full pl-9 pr-4 h-11 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    {showFilters && (
                        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-muted/20">
                            <span className="text-sm text-muted-foreground shrink-0">Min Match:</span>
                            <input
                                type="range" min={0} max={100} step={5}
                                value={minMatch}
                                onChange={e => { setMinMatch(Number(e.target.value)); setPage(1); }}
                                aria-label="Minimum match score"
                                className="flex-1 accent-primary"
                            />
                            <span className="text-sm font-semibold text-foreground w-10 text-right">{minMatch}%</span>
                            {minMatch > 0 && (
                                <button onClick={() => setMinMatch(0)} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
                            )}
                        </div>
                    )}
                    {(search || minMatch > 0 || selectedJobId) && (
                        <p className="text-xs text-muted-foreground">
                            {filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found
                            {selectedJob ? ` · sorted by match for "${selectedJob.title || selectedJob.role}"` : ''}
                        </p>
                    )}
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title={candidates.length === 0 ? 'No candidates yet' : 'No candidates match your search'}
                        description={candidates.length === 0
                            ? 'Candidates who sign up on Pani will appear here with AI match scores.'
                            : 'Try adjusting your search or lowering the minimum match score.'}
                        action={minMatch > 0 ? { label: 'Reset Filters', onClick: () => { setMinMatch(0); setSearch(''); } } : undefined}
                    />
                ) : (
                    <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginated.map((candidate) => {
                            const score = getScore(candidate);
                            return (
                                <Card key={candidate.id} className="bg-card border-border/60 rounded-2xl flex flex-col hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 flex flex-col flex-1">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-12 w-12 rounded-2xl overflow-hidden shrink-0">
                                                {candidate.avatar_url ? (
                                                    <img src={candidate.avatar_url} alt={candidate.full_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-lg">
                                                        {candidate.full_name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-foreground truncate">{candidate.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{candidate.role}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreStyle(score)}`}>
                                                    {score}%
                                                </span>
                                                {candidate.application_status && (
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[candidate.application_status] || STATUS_STYLES.pending}`}>
                                                        {candidate.application_status === 'accepted' ? 'Hired' : candidate.application_status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="mb-3 space-y-1.5">
                                            <p className="text-xs text-muted-foreground">
                                                {candidate.experience} yrs · {candidate.location}
                                            </p>
                                            {selectedJob ? (
                                                <div className="flex items-center gap-1.5 text-[11px] bg-violet-400/10 text-violet-400 px-2 py-1 rounded-md w-fit border border-violet-400/20">
                                                    <Target className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">Scored for <span className="font-medium">{selectedJob.title || selectedJob.role}</span></span>
                                                </div>
                                            ) : candidate.application_status === 'accepted' && candidate.hired_job_title ? (
                                                <div className="flex items-center gap-1.5 text-[11px] bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded-md w-fit border border-emerald-400/20">
                                                    <Target className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">Hired for <span className="font-medium">{candidate.hired_job_title}</span></span>
                                                </div>
                                            ) : candidate.best_job_title ? (
                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 bg-muted/40 px-2 py-1 rounded-md w-fit border border-border/40">
                                                    <Target className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">Matched for <span className="font-medium text-foreground/80">{candidate.best_job_title}</span></span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {candidate.skills?.slice(0, 3).map((skill: string) => (
                                                <span key={skill} className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills?.length > 3 && (
                                                <span className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground">
                                                    +{candidate.skills.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto flex gap-2">
                                            <Button
                                                className="flex-1 rounded-xl h-9 text-sm"
                                                size="sm"
                                                onClick={() => navigate(`/employer/candidates/${candidate.id}`, { state: candidate })}
                                            >
                                                View Profile
                                            </Button>
                                            <Button
                                                variant="outline" size="sm" className="rounded-xl px-2.5 h-9"
                                                title="Match breakdown"
                                                onClick={() => openBreakdown(candidate)}
                                            >
                                                <Target className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline" size="sm" className="rounded-xl px-2.5 h-9"
                                                title="Message candidate"
                                                onClick={() => setChatCandidate(candidate)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline" size="sm" className="rounded-xl px-2.5 h-9"
                                                title={savedIds.has(candidate.id) ? 'Unsave' : 'Save'}
                                                onClick={() => toggleSave(candidate.id, candidate.full_name)}
                                            >
                                                <Bookmark className={`h-4 w-4 ${savedIds.has(candidate.id) ? 'fill-current text-primary' : ''}`} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    />
                    </>
                )}
            </div>
        </EmployerLayout>

        {/* Match Breakdown Modal */}
        {breakdown && (
            <MatchBreakdownModal
                open={!!breakdown}
                onClose={() => setBreakdown(null)}
                score={breakdown.score}
                candidateName={breakdown.candidate.full_name}
                jobTitle={selectedJob?.title || selectedJob?.role || breakdown.candidate.best_job_title}
                details={breakdown.details}
            />
        )}

        {/* Chat Modal */}
        {chatCandidate && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                <div className="bg-card border border-border/60 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
                    <ChatInterface otherUserId={chatCandidate.id} otherUserName={chatCandidate.full_name} />
                    <div className="flex justify-end px-4 py-3 border-t border-border/60">
                        <Button variant="ghost" size="sm" onClick={() => setChatCandidate(null)}>Close</Button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
