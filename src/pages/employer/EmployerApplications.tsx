import { useState, useEffect, useMemo } from 'react';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Eye, Search, ShieldCheck, FileText } from 'lucide-react';
import { Application } from '../../hooks/useSupabase';
import ApplicationReviewDialog from '../../components/employer/ApplicationReviewDialog';
import { supabase } from '../../utils/supabase/client';
import { calculateJobMatch } from '../../utils/ai';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';
import { Pagination } from '../../components/ui/pagination';
import { useToast } from '../../contexts/ToastContext';
import { usePageContext } from '../../contexts/PageContext';

interface ExtendedApplication extends Application {
    candidateName?: string;
    matchScore?: number;
    blindHiring?: boolean;
}

const scoreStyle = (score: number) =>
    score >= 70 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
    : score >= 40 ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
    : 'bg-rose-400/10 text-rose-400 border-rose-400/30';

const STATUS_STYLES: Record<string, string> = {
    accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    rejected: 'bg-rose-400/10 text-rose-400 border-rose-400/30',
    interview: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    offer: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
    reviewed: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
    pending: 'bg-muted/40 text-muted-foreground border-border',
};

export default function EmployerApplications() {
    const [applications, setApplications] = useState<ExtendedApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;
    const { setPageContext, clearPageContext } = usePageContext();

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return applications.filter(a =>
            (statusFilter === 'all' || a.status === statusFilter) &&
            ((a.candidateName || '').toLowerCase().includes(q) ||
             (a.role || '').toLowerCase().includes(q))
        );
    }, [applications, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const fetchEmployerApplications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('applications')
            .select(`
                *,
                jobs!inner (*),
                profiles!candidate_id (
                    full_name, email, skills, experience_years,
                    location, headline, role, resume_url, experience, work_experience
                )
            `)
            .eq('jobs.employer_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const mapped: ExtendedApplication[] = data.map((app: any) => {
                const { score } = calculateJobMatch(app.jobs, app.profiles);
                return {
                    id: app.id,
                    job_id: app.job_id,
                    candidate_id: app.candidate_id,
                    status: app.status,
                    date: new Date(app.created_at).toLocaleDateString(),
                    role: app.jobs?.title,
                    company: '',
                    blindHiring: app.jobs?.blind_hiring || false,
                    candidateName: app.jobs?.blind_hiring ? 'Anonymous Candidate' : (app.profiles?.full_name || 'Unknown Candidate'),
                    matchScore: score,
                    cover_letter: app.cover_letter,
                    rejection_feedback: app.rejection_feedback,
                    resume_url: app.jobs?.blind_hiring ? undefined : app.profiles?.resume_url,
                };
            });
            setApplications(mapped);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployerApplications();
        const channel = supabase
            .channel('employer-applications-rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
                fetchEmployerApplications();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        if (!applications.length) return;
        const pending = applications.filter(a => a.status === 'pending').length;
        const list = applications.slice(0, 8).map(a =>
            `- ${a.candidateName || 'Candidate'} for "${a.role}" — Status: ${a.status} | Match: ${a.matchScore ?? '?'}%`
        ).join('\n');
        setPageContext({
            page: 'Applications Review',
            summary: `Reviewing incoming applications. Total: ${applications.length}. Pending review: ${pending}.
Recent applications:
${list}`,
            suggestions: [
                'Which applications should I prioritize?',
                'How do I quickly evaluate candidates?',
                'What makes a strong application stand out?',
            ],
        });
        return () => clearPageContext();
    }, [applications.length]);

    const handleStatusChange = async (id: string, newStatus: string, feedback?: string) => {
        const updates: any = { status: newStatus };
        if (feedback) updates.rejection_feedback = feedback;

        const { data, error } = await supabase
            .from('applications')
            .update(updates)
            .eq('id', id)
            .select('id');

        if (error) throw error;

        // Check if the update actually affected a row (RLS may silently block)
        if (!data || data.length === 0) {
            throw new Error('Status update was blocked. Check database permissions.');
        }

        // Re-fetch to get fresh data
        await fetchEmployerApplications();

        // Update the selectedApp so the dialog reflects the change immediately
        setSelectedApp(prev => prev && prev.id === id ? { ...prev, status: newStatus as any, rejection_feedback: feedback } : prev);
    };

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Applications</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Review and manage incoming candidate applications.</p>
                </div>

                {/* Search + filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by candidate name or role..."
                            className="w-full pl-9 pr-4 h-10 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        title="Filter by status"
                        aria-label="Filter by status"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {/* Desktop Table */}
                <Card className="bg-card border-border/60 hidden md:block">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Candidate</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Applied</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Match</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <tr key={i} className="border-b border-border/50">
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-5 w-12 rounded-full" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                                                <td className="px-4 py-3 flex justify-end"><Skeleton className="h-7 w-7 rounded-md" /></td>
                                            </tr>
                                        ))
                                    ) : applications.length === 0 ? (
                                        <tr><td colSpan={6}><EmptyState icon={FileText} title="No applications yet" description="When candidates apply to your jobs, their applications will appear here." /></td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={6}><EmptyState icon={FileText} title="No matching applications" description="Try adjusting your search or status filter." action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setStatusFilter('all'); } }} /></td></tr>
                                    ) : (
                                        paginated.map((app) => (
                                            <tr key={app.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">{app.candidateName}</span>
                                                        {app.blindHiring && <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md border border-violet-400/30 bg-violet-400/10 text-violet-400"><ShieldCheck className="h-3 w-3" /> Blind</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{app.role}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{app.date}</td>
                                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreStyle(app.matchScore ?? 0)}`}>{app.matchScore}%</span></td>
                                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}>{app.status}</span></td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => { setSelectedApp(app); setDialogOpen(true); }} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {!loading && filtered.length > 0 && <div className="px-4 pb-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
                    </CardContent>
                </Card>

                {/* Mobile Card List */}
                <div className="md:hidden flex flex-col gap-3">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                    ) : applications.length === 0 ? (
                        <EmptyState icon={FileText} title="No applications yet" description="When candidates apply to your jobs, their applications will appear here." />
                    ) : filtered.length === 0 ? (
                        <EmptyState icon={FileText} title="No matching applications" description="Try adjusting your search or status filter." action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setStatusFilter('all'); } }} />
                    ) : (
                        <>
                            {paginated.map((app) => (
                                <Card key={app.id} className="bg-card border-border/60">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-foreground text-sm">{app.candidateName}</span>
                                                    {app.blindHiring && <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md border border-violet-400/30 bg-violet-400/10 text-violet-400"><ShieldCheck className="h-3 w-3" /> Blind</span>}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.role}</p>
                                            </div>
                                            <button onClick={() => { setSelectedApp(app); setDialogOpen(true); }} className="p-2 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}>{app.status}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreStyle(app.matchScore ?? 0)}`}>{app.matchScore}% match</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{app.date}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                        </>
                    )}
                </div>
            </div>

            <ApplicationReviewDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                application={selectedApp}
                onStatusChange={handleStatusChange}
            />
        </EmployerLayout>
    );
}
