import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Building2, FileText, Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApplications, useProfile } from '../hooks/useSupabase';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { Pagination } from '../components/ui/pagination';
import MatchBreakdownModal from '../components/common/MatchBreakdownModal';
import { calculateJobMatch } from '../utils/ai';
import { usePageContext } from '../contexts/PageContext';
import type { Application } from '../hooks/useSupabase';

const STATUS_STYLES: Record<string, string> = {
    accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    rejected:  'bg-rose-400/10 text-rose-400 border-rose-400/30',
    interview: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    offer:     'bg-blue-400/10 text-blue-400 border-blue-400/30',
    reviewed:  'bg-purple-400/10 text-purple-400 border-purple-400/30',
    pending:   'bg-muted/40 text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
    accepted: 'Accepted',
    rejected: 'Rejected',
    interview: 'Interview',
    offer: 'Offer',
    reviewed: 'Reviewed',
    pending: 'Pending',
};

const TABS = ['Active', 'Archived'];
const PAGE_SIZE = 10;

function CardSkeleton() {
    return (
        <Card className="rounded-2xl border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
            </CardContent>
        </Card>
    );
}

export default function Applications() {
    const navigate = useNavigate();
    const { applications, loading } = useApplications();
    const { profile } = useProfile();
    const { setPageContext, clearPageContext } = usePageContext();
    const [tab, setTab] = useState(0);
    const [page, setPage] = useState(1);
    const [breakdownApp, setBreakdownApp] = useState<Application | null>(null);

    useEffect(() => {
        if (!applications.length) return;
        const active = applications.filter(a => ['pending', 'reviewed', 'interview', 'offer'].includes(a.status));
        const list = applications.slice(0, 10).map(a =>
            `- "${a.role}" at ${a.company} — Status: ${a.status} (applied ${a.date})`
        ).join('\n');
        setPageContext({
            page: 'My Applications',
            summary: `Viewing applications list. Total: ${applications.length}. Active: ${active.length}.
Recent applications:
${list}`,
            suggestions: [
                'Which of my applications look most promising?',
                'How should I follow up on pending applications?',
                'Why might I be getting rejected?',
            ],
        });
        return () => clearPageContext();
    }, [applications.length]);

    const activeApps   = applications.filter(a => ['pending', 'reviewed', 'interview', 'offer'].includes(a.status));
    const archivedApps = applications.filter(a => ['rejected', 'accepted'].includes(a.status));
    const displayed    = tab === 0 ? activeApps : archivedApps;

    const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
    const paginated  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleTabChange = (idx: number) => { setTab(idx); setPage(1); };

    const getBreakdown = (app: Application) => {
        if (!app.job_data || !profile) return { score: 0, details: [] };
        return calculateJobMatch(app.job_data, profile);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-5">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Applications</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">Track the status of your job applications.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
                    {TABS.map((label, idx) => (
                        <button
                            key={label}
                            onClick={() => handleTabChange(idx)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                tab === idx
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {label} <span className="ml-1 text-xs opacity-70">({idx === 0 ? activeApps.length : archivedApps.length})</span>
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex flex-col gap-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
                    ) : displayed.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title={tab === 0 ? 'No active applications' : 'No archived applications'}
                            description={tab === 0 ? 'Start applying to jobs to track them here.' : 'Accepted and rejected applications will appear here.'}
                            action={tab === 0 ? { label: 'Browse Jobs', onClick: () => navigate('/jobs') } : undefined}
                        />
                    ) : (
                        paginated.map((app) => {
                            const matchData = app.job_data ? getBreakdown(app) : null;
                            return (
                                <Card
                                    key={app.id}
                                    className="rounded-2xl border-border/60 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/applications/${app.id}`)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            {/* Icon */}
                                            <div className="h-10 w-10 rounded-xl bg-violet-400/10 flex items-center justify-center shrink-0">
                                                <Building2 className="h-5 w-5 text-violet-400" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground truncate">{app.role}</p>
                                                <p className="text-xs text-muted-foreground truncate">{app.company} · {app.date}</p>
                                            </div>

                                            {/* Right side */}
                                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                                {matchData && matchData.score > 0 && (
                                                    <button
                                                        onClick={() => setBreakdownApp(app)}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold transition-colors bg-violet-400/10 text-violet-400 border-violet-400/30 hover:bg-violet-400/20"
                                                        title="View match breakdown"
                                                    >
                                                        <Target className="h-3 w-3" />
                                                        {matchData.score}%
                                                    </button>
                                                )}
                                                <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}>
                                                    {STATUS_LABELS[app.status] || app.status}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {!loading && displayed.length > 0 && (
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                )}
            </div>

            {/* Match Breakdown Modal */}
            {breakdownApp && (() => {
                const bd = getBreakdown(breakdownApp);
                return (
                    <MatchBreakdownModal
                        open={true}
                        onClose={() => setBreakdownApp(null)}
                        score={bd.score}
                        jobTitle={breakdownApp.role}
                        candidateName={profile?.full_name}
                        details={bd.details || []}
                    />
                );
            })()}
        </DashboardLayout>
    );
}
