import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useToast } from '../../contexts/ToastContext';

interface JobRecord {
    id: string;
    role: string;
    company_name?: string;
    location: string;
    type: string;
    status: string;
    posted_at: string;
    applicants_count: number;
}

export default function AdminJobs() {
    const [jobs, setJobs] = useState<JobRecord[]>([]);
    const [filtered, setFiltered] = useState<JobRecord[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Closed'>('all');
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        const { data, error } = await supabase
            .from('jobs')
            .select('id, role, company_name, location, type, status, posted_at, applicants_count')
            .order('posted_at', { ascending: false });
        if (data) setJobs(data);
        if (error) console.error(error);
        setLoading(false);
    }

    useEffect(() => {
        let result = jobs;
        if (statusFilter !== 'all') result = result.filter((j) => j.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (j) =>
                    j.role?.toLowerCase().includes(q) ||
                    j.company_name?.toLowerCase().includes(q) ||
                    j.location?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [jobs, search, statusFilter]);

    const handleToggleStatus = async (job: JobRecord) => {
        const newStatus = job.status === 'Active' ? 'Closed' : 'Active';
        const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', job.id);
        if (!error) {
            setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
            toast(`Job marked as ${newStatus}`, 'success');
        } else {
            toast('Failed to update job status', 'error');
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
                        {(['all', 'Active', 'Closed'] as const).map((s) => (
                            <Button
                                key={s}
                                variant={statusFilter === s ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(s)}
                            >
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
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Role</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Company</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Location</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Type</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Applicants</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Posted</th>
                                                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((job) => (
                                                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{job.role}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.company_name || '—'}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.location}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.type}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{job.applicants_count ?? 0}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>{job.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(job)} className="gap-1.5">
                                                            {job.status === 'Active' ? (
                                                                <><XCircle className="h-4 w-4 text-destructive" /><span className="text-destructive">Close</span></>
                                                            ) : (
                                                                <><CheckCircle className="h-4 w-4 text-emerald-400" /><span className="text-emerald-400">Activate</span></>
                                                            )}
                                                        </Button>
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
                                                    <p className="font-semibold text-foreground text-sm">{job.role}</p>
                                                    <p className="text-xs text-muted-foreground">{job.company_name || '—'}</p>
                                                </div>
                                                <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>{job.status}</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span>{job.location}</span>
                                                <span>{job.type}</span>
                                                <span>{job.applicants_count ?? 0} applicants</span>
                                                <span>{job.posted_at ? new Date(job.posted_at).toLocaleDateString() : '—'}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(job)} className="gap-1.5 self-start h-8 px-3 text-xs">
                                                {job.status === 'Active' ? (
                                                    <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Close</span></>
                                                ) : (
                                                    <><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Activate</span></>
                                                )}
                                            </Button>
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
