import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, Briefcase, FileText, TrendingUp, BarChart3, Ticket, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

type Period = '7d' | '30d' | '90d';

interface ReportData {
    newUsers: number;
    newJobs: number;
    newApps: number;
    appStatuses: { pending: number; reviewed: number; interview: number; offer: number; rejected: number; };
    jobModStatuses: { pending: number; approved: number; rejected: number; flagged: number; };
    ticketStatuses: { open: number; in_progress: number; resolved: number; closed: number; };
}

function cutoffDate(period: Period): string {
    const d = new Date();
    if (period === '7d') d.setDate(d.getDate() - 7);
    else if (period === '30d') d.setDate(d.getDate() - 30);
    else d.setDate(d.getDate() - 90);
    return d.toISOString();
}

function ProgressBar({ label, value, total, color, colorClass }: {
    label: string; value: number; total: number; color: string; colorClass: string;
}) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-semibold ${colorClass}`}>{value} ({pct.toFixed(1)}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary">
                <div className={`h-2.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function AdminPerformanceReports() {
    const [period, setPeriod] = useState<Period>('30d');
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    async function fetchData() {
        setLoading(true);
        const cutoff = cutoffDate(period);
        try {
            const [usersRes, jobsRes, appsRes, allJobsRes, ticketsRes] = await Promise.all([
                supabase.from('profiles').select('id').gte('created_at', cutoff),
                supabase.from('jobs').select('id').gte('created_at', cutoff),
                supabase.from('applications').select('status').gte('created_at', cutoff),
                supabase.from('jobs').select('moderation_status'),
                supabase.from('support_tickets').select('status'),
            ]);

            const apps = appsRes.data ?? [];
            const allJobs = allJobsRes.data ?? [];
            const tickets = ticketsRes.data ?? [];

            const count = (arr: { status: string }[], val: string) => arr.filter((x) => x.status === val).length;
            const countMod = (val: string) => allJobs.filter((j: any) => j.moderation_status === val).length;

            setData({
                newUsers: usersRes.data?.length ?? 0,
                newJobs: jobsRes.data?.length ?? 0,
                newApps: apps.length,
                appStatuses: {
                    pending: count(apps, 'pending'),
                    reviewed: count(apps, 'reviewed'),
                    interview: count(apps, 'interview'),
                    offer: count(apps, 'offer'),
                    rejected: count(apps, 'rejected'),
                },
                jobModStatuses: {
                    pending: countMod('pending'),
                    approved: countMod('approved'),
                    rejected: countMod('rejected'),
                    flagged: countMod('flagged'),
                },
                ticketStatuses: {
                    open: count(tickets, 'open'),
                    in_progress: count(tickets, 'in_progress'),
                    resolved: count(tickets, 'resolved'),
                    closed: count(tickets, 'closed'),
                },
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const totalAppStatuses = data ? Object.values(data.appStatuses).reduce((a, b) => a + b, 0) : 0;
    const totalJobMod = data ? Object.values(data.jobModStatuses).reduce((a, b) => a + b, 0) : 0;
    const totalTickets = data ? Object.values(data.ticketStatuses).reduce((a, b) => a + b, 0) : 0;

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                <div className="hidden md:flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Performance Reports</h1>
                        <p className="text-muted-foreground mt-1">Time-filtered platform metrics and activity breakdown.</p>
                    </div>
                    <div className="flex gap-2">
                        {(['7d', '30d', '90d'] as const).map((p) => (
                            <Button
                                key={p}
                                variant={period === p ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod(p)}
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Mobile period toggle */}
                <div className="md:hidden flex justify-end gap-2">
                    {(['7d', '30d', '90d'] as const).map((p) => (
                        <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}>
                            {p}
                        </Button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Top Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { label: `New Users (${period})`, value: data?.newUsers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10' },
                                { label: `New Jobs (${period})`, value: data?.newJobs, icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                                { label: `New Applications (${period})`, value: data?.newApps, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                            ].map(({ label, value, icon: Icon, color, bg }) => (
                                <Card key={label} className="bg-card border-border/60">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                                                <p className="text-4xl font-bold text-foreground mt-1">{value ?? 0}</p>
                                            </div>
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${bg}`}>
                                                <Icon className={`h-7 w-7 ${color}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Hiring Funnel */}
                            <Card className="bg-card border-border/60">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        Hiring Funnel
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {data && [
                                        { label: 'Pending', value: data.appStatuses.pending, color: 'bg-orange-400', colorClass: 'text-orange-400' },
                                        { label: 'Reviewed', value: data.appStatuses.reviewed, color: 'bg-blue-400', colorClass: 'text-blue-400' },
                                        { label: 'Interview', value: data.appStatuses.interview, color: 'bg-violet-400', colorClass: 'text-violet-400' },
                                        { label: 'Offer', value: data.appStatuses.offer, color: 'bg-emerald-400', colorClass: 'text-emerald-400' },
                                        { label: 'Rejected', value: data.appStatuses.rejected, color: 'bg-red-400', colorClass: 'text-red-400' },
                                    ].map((item) => (
                                        <ProgressBar key={item.label} {...item} total={totalAppStatuses} />
                                    ))}
                                    {totalAppStatuses === 0 && (
                                        <p className="text-sm text-muted-foreground">No applications in this period.</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Job Moderation Queue */}
                            <Card className="bg-card border-border/60">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        Job Moderation Queue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {data && [
                                        { label: 'Pending', value: data.jobModStatuses.pending, color: 'bg-orange-400', colorClass: 'text-orange-400' },
                                        { label: 'Approved', value: data.jobModStatuses.approved, color: 'bg-emerald-400', colorClass: 'text-emerald-400' },
                                        { label: 'Flagged', value: data.jobModStatuses.flagged, color: 'bg-yellow-400', colorClass: 'text-yellow-400' },
                                        { label: 'Rejected', value: data.jobModStatuses.rejected, color: 'bg-red-400', colorClass: 'text-red-400' },
                                    ].map((item) => (
                                        <ProgressBar key={item.label} {...item} total={totalJobMod} />
                                    ))}
                                    {totalJobMod === 0 && (
                                        <p className="text-sm text-muted-foreground">No jobs found.</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Support Tickets */}
                            <Card className="bg-card border-border/60 md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Ticket className="h-4 w-4 text-muted-foreground" />
                                        Support Tickets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {data && [
                                        { label: 'Open', value: data.ticketStatuses.open, color: 'bg-blue-400', colorClass: 'text-blue-400' },
                                        { label: 'In Progress', value: data.ticketStatuses.in_progress, color: 'bg-amber-400', colorClass: 'text-amber-400' },
                                        { label: 'Resolved', value: data.ticketStatuses.resolved, color: 'bg-emerald-400', colorClass: 'text-emerald-400' },
                                        { label: 'Closed', value: data.ticketStatuses.closed, color: 'bg-secondary', colorClass: 'text-muted-foreground' },
                                    ].map((item) => (
                                        <ProgressBar key={item.label} {...item} total={totalTickets} />
                                    ))}
                                    {totalTickets === 0 && (
                                        <p className="text-sm text-muted-foreground">No support tickets yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
