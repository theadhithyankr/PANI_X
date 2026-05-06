import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Search, Loader2, CheckCircle, XCircle, Flag, Eye } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { insertAuditLog } from '../../utils/auditLog';

interface ModerationJob {
    id: string;
    title?: string;
    role?: string;
    company_name?: string;
    location: string;
    type: string;
    moderation_status: string;
    created_at: string;
    description?: string;
    profiles: { full_name: string; email: string; } | null;
}

type ModFilter = 'all' | 'pending' | 'flagged';

const moderationBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="default" className="capitalize">{status}</Badge>;
        case 'rejected': return <Badge variant="destructive" className="capitalize">{status}</Badge>;
        case 'flagged':  return <Badge className="bg-orange-400/10 text-orange-400 border-orange-400/30 capitalize">{status}</Badge>;
        default:         return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
};

export default function AdminContentModeration() {
    const [jobs, setJobs] = useState<ModerationJob[]>([]);
    const [filtered, setFiltered] = useState<ModerationJob[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ModFilter>('all');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ModerationJob | null>(null);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        const { data, error } = await supabase
            .from('jobs')
            .select('id, role, title, company_name, location, type, moderation_status, created_at, description, profiles!jobs_employer_id_fkey(full_name, email)')
            .in('moderation_status', ['pending', 'flagged'])
            .order('created_at', { ascending: false });
        if (data) setJobs(data as unknown as ModerationJob[]);
        if (error) console.error(error);
        setLoading(false);
    }

    useEffect(() => {
        let result = jobs;
        if (filter !== 'all') result = result.filter((j) => j.moderation_status === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (j) =>
                    (j.role || j.title || '')?.toLowerCase().includes(q) ||
                    j.company_name?.toLowerCase().includes(q) ||
                    j.location?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [jobs, search, filter]);

    const pendingCount = jobs.filter((j) => j.moderation_status === 'pending').length;
    const flaggedCount = jobs.filter((j) => j.moderation_status === 'flagged').length;

    const handleModerate = async (job: ModerationJob, newStatus: 'approved' | 'rejected' | 'flagged') => {
        const { error } = await supabase.from('jobs').update({ moderation_status: newStatus }).eq('id', job.id);
        if (!error) {
            setJobs((prev) => prev.filter((j) => {
                if (j.id !== job.id) return true;
                return newStatus === 'flagged';
            }).map((j) => j.id === job.id ? { ...j, moderation_status: newStatus } : j));
            if (selected?.id === job.id) setSelected(null);
            await insertAuditLog(user!.id, `moderate_job_${newStatus}`, 'job', job.id, {
                role: job.role || job.title,
                company: job.company_name,
            });
            toast(`Job ${newStatus}`, 'success');
        } else {
            toast('Failed to moderate job', 'error');
        }
    };

    const jobTitle = (j: ModerationJob) => j.role || j.title || 'Untitled';

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Content Moderation</h1>
                        <p className="text-muted-foreground mt-1">Review and take action on pending and flagged job listings.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {pendingCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/30 px-3 py-1 text-xs font-semibold">
                                {pendingCount} pending
                            </span>
                        )}
                        {flaggedCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-400/10 text-red-400 border border-red-400/30 px-3 py-1 text-xs font-semibold">
                                {flaggedCount} flagged
                            </span>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by role, company, or location..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'pending', 'flagged'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(f)}
                                className="capitalize"
                            >
                                {f}
                            </Button>
                        ))}
                    </div>
                </div>

                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {filtered.length} Item{filtered.length !== 1 ? 's' : ''} for Review
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                {filter === 'all' ? 'No items require moderation.' : `No ${filter} items.`}
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Job Title</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Employer</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Location</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Submitted</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((job) => (
                                                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{jobTitle(job)}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-foreground">{job.company_name || '—'}</p>
                                                        <p className="text-xs text-muted-foreground">{job.profiles?.email || '—'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.location}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">{moderationBadge(job.moderation_status)}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSelected(job)} title="View details">
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleModerate(job, 'approved')} title="Approve">
                                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleModerate(job, 'flagged')} title="Flag">
                                                                <Flag className="h-4 w-4 text-orange-400" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleModerate(job, 'rejected')} title="Reject">
                                                                <XCircle className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden flex flex-col divide-y divide-border/50">
                                    {filtered.map((job) => (
                                        <div key={job.id} className="px-4 py-4 flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm">{jobTitle(job)}</p>
                                                    <p className="text-xs text-muted-foreground">{job.company_name || '—'}</p>
                                                </div>
                                                {moderationBadge(job.moderation_status)}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{job.location} · {new Date(job.created_at).toLocaleDateString()}</p>
                                            <div className="flex gap-2 flex-wrap mt-1">
                                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setSelected(job)}>
                                                    <Eye className="h-3.5 w-3.5" />View
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-emerald-500" onClick={() => handleModerate(job, 'approved')}>
                                                    <CheckCircle className="h-3.5 w-3.5" />Approve
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-orange-400" onClick={() => handleModerate(job, 'flagged')}>
                                                    <Flag className="h-3.5 w-3.5" />Flag
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-destructive" onClick={() => handleModerate(job, 'rejected')}>
                                                    <XCircle className="h-3.5 w-3.5" />Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Job Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Job Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-foreground text-base">{jobTitle(selected)}</p>
                                    <p className="text-sm text-muted-foreground">{selected.company_name || '—'}</p>
                                </div>
                                {moderationBadge(selected.moderation_status)}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Location</p>
                                    <p className="mt-0.5">{selected.location}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Type</p>
                                    <p className="mt-0.5">{selected.type}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Employer</p>
                                    <p className="mt-0.5">{selected.profiles?.full_name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{selected.profiles?.email || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Submitted</p>
                                    <p className="mt-0.5">{new Date(selected.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {selected.description && (
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Description</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{selected.description}</p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-2 border-t border-border">
                                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleModerate(selected, 'approved')}>
                                    <CheckCircle className="h-4 w-4" />Approve
                                </Button>
                                <Button variant="outline" size="sm" className="gap-1.5 text-orange-400 border-orange-400/30 hover:bg-orange-400/10" onClick={() => handleModerate(selected, 'flagged')}>
                                    <Flag className="h-4 w-4" />Flag
                                </Button>
                                <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => handleModerate(selected, 'rejected')}>
                                    <XCircle className="h-4 w-4" />Reject
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
