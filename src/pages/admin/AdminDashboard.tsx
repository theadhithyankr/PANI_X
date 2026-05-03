import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Briefcase, FileText, TrendingUp, UserCheck, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface AdminStats {
    totalUsers: number;
    totalCandidates: number;
    totalEmployers: number;
    totalJobs: number;
    totalApplications: number;
    activeJobs: number;
    pendingApplications: number;
}

const STAT_CARDS = [
    { key: 'totalUsers', label: 'Total Users', icon: Users, colorClass: 'text-violet-400', bgClass: 'bg-violet-400/10' },
    { key: 'totalJobs', label: 'Total Job Listings', icon: Briefcase, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10' },
    { key: 'totalApplications', label: 'Total Applications', icon: FileText, colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10' },
    { key: 'activeJobs', label: 'Active Jobs', icon: Activity, colorClass: 'text-blue-400', bgClass: 'bg-blue-400/10' },
    { key: 'totalCandidates', label: 'Candidates', icon: UserCheck, colorClass: 'text-pink-400', bgClass: 'bg-pink-400/10' },
    { key: 'pendingApplications', label: 'Pending Review', icon: AlertTriangle, colorClass: 'text-orange-400', bgClass: 'bg-orange-400/10' },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalCandidates: 0,
        totalEmployers: 0,
        totalJobs: 0,
        totalApplications: 0,
        activeJobs: 0,
        pendingApplications: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [profilesRes, jobsRes, applicationsRes, activeJobsRes, pendingRes] = await Promise.all([
                    supabase.from('profiles').select('role', { count: 'exact' }),
                    supabase.from('jobs').select('id', { count: 'exact' }),
                    supabase.from('applications').select('id', { count: 'exact' }),
                    supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'Active'),
                    supabase.from('applications').select('id', { count: 'exact' }).eq('status', 'pending'),
                ]);

                const profiles = profilesRes.data ?? [];
                const candidates = profiles.filter((p: any) => p.role === 'candidate').length;
                const employers = profiles.filter((p: any) => p.role === 'employer').length;

                setStats({
                    totalUsers: profilesRes.count ?? 0,
                    totalCandidates: candidates,
                    totalEmployers: employers,
                    totalJobs: jobsRes.count ?? 0,
                    totalApplications: applicationsRes.count ?? 0,
                    activeJobs: activeJobsRes.count ?? 0,
                    pendingApplications: pendingRes.count ?? 0,
                });
            } catch (err) {
                console.error('Failed to fetch admin stats:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Platform overview and key metrics.</p>
                </div>

                {/* Stats Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {STAT_CARDS.map(({ key, label, icon: Icon, colorClass, bgClass }) => (
                            <Card key={key} className="bg-card border-border/60">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{label}</p>
                                            <p className="text-3xl sm:text-4xl font-bold text-foreground mt-1">
                                                {stats[key as keyof AdminStats]}
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                <TrendingUp className={`h-3 w-3 ${colorClass}`} />
                                                <span className={`text-xs font-medium ${colorClass}`}>Live</span>
                                            </div>
                                        </div>
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${bgClass}`}>
                                            <Icon className={`h-7 w-7 ${colorClass}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* User Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">User Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Candidates', value: stats.totalCandidates, total: stats.totalUsers, color: 'bg-violet-400' },
                                { label: 'Employers', value: stats.totalEmployers, total: stats.totalUsers, color: 'bg-emerald-400' },
                            ].map(({ label, value, total, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-semibold">{value}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div
                                            className={`h-2 rounded-full ${color} transition-all`}
                                            style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Application Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Total Applications', value: stats.totalApplications, color: 'bg-blue-400' },
                                { label: 'Pending Review', value: stats.pendingApplications, color: 'bg-orange-400' },
                            ].map(({ label, value, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-semibold">{value}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div
                                            className={`h-2 rounded-full ${color} transition-all`}
                                            style={{
                                                width:
                                                    stats.totalApplications > 0
                                                        ? `${(value / stats.totalApplications) * 100}%`
                                                        : '0%',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
