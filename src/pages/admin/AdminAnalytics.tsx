import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart3, Users, Briefcase, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface AnalyticsData {
    totalUsers: number;
    totalCandidates: number;
    totalEmployers: number;
    totalJobs: number;
    activeJobs: number;
    closedJobs: number;
    totalApplications: number;
    pendingApplications: number;
    reviewedApplications: number;
    interviewApplications: number;
    offerApplications: number;
    rejectedApplications: number;
}

export default function AdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [profilesRes, jobsRes, appsRes] = await Promise.all([
                    supabase.from('profiles').select('role'),
                    supabase.from('jobs').select('status'),
                    supabase.from('applications').select('status'),
                ]);

                const profiles = profilesRes.data ?? [];
                const jobs = jobsRes.data ?? [];
                const apps = appsRes.data ?? [];

                const count = (arr: any[], key: string, val: string) =>
                    arr.filter((x) => x[key] === val).length;

                setData({
                    totalUsers: profiles.length,
                    totalCandidates: count(profiles, 'role', 'candidate'),
                    totalEmployers: count(profiles, 'role', 'employer'),
                    totalJobs: jobs.length,
                    activeJobs: count(jobs, 'status', 'Active'),
                    closedJobs: count(jobs, 'status', 'Closed'),
                    totalApplications: apps.length,
                    pendingApplications: count(apps, 'status', 'pending'),
                    reviewedApplications: count(apps, 'status', 'reviewed'),
                    interviewApplications: count(apps, 'status', 'interview'),
                    offerApplications: count(apps, 'status', 'offer'),
                    rejectedApplications: count(apps, 'status', 'rejected'),
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    const appStatuses = data
        ? [
              { label: 'Pending', value: data.pendingApplications, color: 'bg-orange-400', colorClass: 'text-orange-400' },
              { label: 'Reviewed', value: data.reviewedApplications, color: 'bg-blue-400', colorClass: 'text-blue-400' },
              { label: 'Interview', value: data.interviewApplications, color: 'bg-violet-400', colorClass: 'text-violet-400' },
              { label: 'Offer', value: data.offerApplications, color: 'bg-emerald-400', colorClass: 'text-emerald-400' },
              { label: 'Rejected', value: data.rejectedApplications, color: 'bg-red-400', colorClass: 'text-red-400' },
          ]
        : [];

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
                    <p className="text-muted-foreground mt-1">Performance reports and platform-wide insights.</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        { label: 'Total Users', value: data?.totalUsers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10' },
                        { label: 'Total Jobs', value: data?.totalJobs, icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { label: 'Total Applications', value: data?.totalApplications, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
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
                    {/* User Composition */}
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                User Composition
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Candidates', value: data?.totalCandidates ?? 0, color: 'bg-violet-400' },
                                { label: 'Employers', value: data?.totalEmployers ?? 0, color: 'bg-emerald-400' },
                            ].map(({ label, value, color }) => {
                                const pct = (data?.totalUsers ?? 0) > 0 ? (value / data!.totalUsers) * 100 : 0;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-semibold">
                                                {value} ({pct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-secondary">
                                            <div
                                                className={`h-2.5 rounded-full ${color} transition-all`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Job Status */}
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                Job Status Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Active', value: data?.activeJobs ?? 0, color: 'bg-emerald-400' },
                                { label: 'Closed', value: data?.closedJobs ?? 0, color: 'bg-red-400' },
                            ].map(({ label, value, color }) => {
                                const pct = (data?.totalJobs ?? 0) > 0 ? (value / data!.totalJobs) * 100 : 0;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-semibold">
                                                {value} ({pct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-secondary">
                                            <div
                                                className={`h-2.5 rounded-full ${color} transition-all`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Application Pipeline */}
                    <Card className="bg-card border-border/60 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                Application Pipeline Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appStatuses.map(({ label, value, color, colorClass }) => {
                                const pct = (data?.totalApplications ?? 0) > 0
                                    ? (value / data!.totalApplications) * 100
                                    : 0;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className={`font-semibold ${colorClass}`}>
                                                {value} ({pct.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full rounded-full bg-secondary">
                                            <div
                                                className={`h-2.5 rounded-full ${color} transition-all`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
