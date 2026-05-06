import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Search, Loader2, CheckCircle, XCircle, Flag, MoreVertical } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { insertAuditLog } from '../../utils/auditLog';

interface JobRecord {
    id: string;
    title: string;
    company_name?: string;
    location: string;
    type: string;
    is_active: boolean;
    created_at: string;
    applicants: number;
    moderation_status: string;
}

type ModerationFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'flagged';

export default function AdminJobs() {
    const [jobs, setJobs] = useState<JobRecord[]>([]);
    const [filtered, setFiltered] = useState<JobRecord[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Closed'>('all');
    const [modFilter, setModFilter] = useState<ModerationFilter>('all');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        const { data, error } = await supabase
            .from('jobs')
            .select('id, title, location, type, is_active, created_at, applicants, moderation_status, profiles(company_name)')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('AdminJobs fetch error:', error);
            setLoading(false);
            return;
        }
        if (data) {
            setJobs(data.map((j: any) => ({
                id: j.id,
                title: j.title,
                company_name: j.profiles?.company_name ?? undefined,
                location: j.location,
                type: j.type,
                is_active: j.is_active,
                created_at: j.created_at,
                applicants: j.applicants ?? 0,
                moderation_status: j.moderation_status ?? 'pending',
            })));
        }
        setLoading(false);
    }

    useEffect(() => {
        let result = jobs;
        if (statusFilter !== 'all') result = result.filter((j) => (j.is_active ? 'Active' : 'Closed') === statusFilter);
        if (modFilter !== 'all') result = result.filter((j) => j.moderation_status === modFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (j) =>
                    j.title?.toLowerCase().includes(q) ||
                    j.company_name?.toLowerCase().includes(q) ||
                    j.location?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [jobs, search, statusFilter, modFilter]);

    const handleToggleStatus = async (job: JobRecord) => {
        const newActive = !job.is_active;
        const { error } = await supabase.from('jobs').update({ is_active: newActive }).eq('id', job.id);
        if (!error) {
            setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_active: newActive } : j)));
            await insertAuditLog(user!.id, `set_job_${newActive ? 'active' : 'closed'}`, 'job', job.id, { title: job.title });
            toast(`Job marked as ${newActive ? 'Active' : 'Closed'}`, 'success');
        } else {
            toast('Failed to update job status', 'error');
        }
    };

    const handleModerate = async (job: JobRecord, modStatus: string) => {
        const { error } = await supabase.from('jobs').update({ moderation_status: modStatus }).eq('id', job.id);
        if (!error) {
            setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, moderation_status: modStatus } : j)));
            await insertAuditLog(user!.id, `moderate_job_${modStatus}`, 'job', job.id, { title: job.title });
            toast(`Job ${modStatus}`, 'success');
        } else {
            toast('Failed to moderate job', 'error');
        }
    };

    const moderationBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge variant="default" className="capitalize">{status}</Badge>;
            case 'rejected': return <Badge variant="destructive" className="capitalize">{status}</Badge>;
            case 'flagged':  return <Badge className="bg-orange-400/10 text-orange-400 border-orange-400/30 capitalize">{status}</Badge>;
            default:         return <Badge variant="outline" className="capitalize">{status}</Badge>;
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Job Listing Moderation</h1>
                    <p className="text-muted-foreground mt-1">Review and moderate all job postings on the platform.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, company, or location..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'Active', 'Closed'] as const).map((s) => (
                                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-muted-foreground mr-1">Moderation:</span>
                        {(['all', 'pending', 'approved', 'rejected', 'flagged'] as const).map((s) => (
                            <Button key={s} variant={modFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setModFilter(s)} className="capitalize">
                                {s}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <Card className="bg-card border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {filtered.length} Job{filtered.length !== 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">No jobs found.</div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Title</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Company</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Location</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Moderation</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Posted</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((job) => (
                                                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{job.title}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.company_name || '—'}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.location}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={job.is_active ? 'default' : 'secondary'}>
                                                            {job.is_active ? 'Active' : 'Closed'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">{moderationBadge(job.moderation_status)}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(job)} className="gap-2">
                                                                    {job.is_active ? (
                                                                        <><XCircle className="h-4 w-4 text-destructive" />Close Job</>
                                                                    ) : (
                                                                        <><CheckCircle className="h-4 w-4 text-emerald-500" />Activate Job</>
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleModerate(job, 'approved')} className="gap-2">
                                                                    <CheckCircle className="h-4 w-4 text-emerald-500" />Approve
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleModerate(job, 'flagged')} className="gap-2">
                                                                    <Flag className="h-4 w-4 text-orange-400" />Flag
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleModerate(job, 'rejected')} className="gap-2 text-destructive focus:text-destructive">
                                                                    <XCircle className="h-4 w-4" />Reject
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground text-sm truncate">{job.title}</p>
                                                    <p className="text-xs text-muted-foreground">{job.company_name || '—'}</p>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                                    <Badge variant={job.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                                        {job.is_active ? 'Active' : 'Closed'}
                                                    </Badge>
                                                    {moderationBadge(job.moderation_status)}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span>{job.location}</span>
                                                <span>{job.type}</span>
                                                <span>{job.applicants ?? 0} applicants</span>
                                                <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap mt-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(job)} className="gap-1 h-8 px-2 text-xs">
                                                    {job.is_active ? (
                                                        <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Close</span></>
                                                    ) : (
                                                        <><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Activate</span></>
                                                    )}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleModerate(job, 'approved')} className="gap-1 h-8 px-2 text-xs text-emerald-500">
                                                    <CheckCircle className="h-3.5 w-3.5" />Approve
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleModerate(job, 'flagged')} className="gap-1 h-8 px-2 text-xs text-orange-400">
                                                    <Flag className="h-3.5 w-3.5" />Flag
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleModerate(job, 'rejected')} className="gap-1 h-8 px-2 text-xs text-destructive">
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
        </AdminLayout>
    );
}
