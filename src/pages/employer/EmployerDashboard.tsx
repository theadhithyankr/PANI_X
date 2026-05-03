
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, Briefcase, CalendarCheck, TrendingUp, Loader2 } from 'lucide-react';
import { useDashboardStats } from '../../hooks/useSupabase';

const STAT_ICONS = [
    { icon: Users, colorClass: 'text-violet-400', bgClass: 'bg-violet-400/10' },
    { icon: Briefcase, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10' },
    { icon: CalendarCheck, colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10' },
];

export default function EmployerDashboard() {
    const { stats, loading } = useDashboardStats();

    const STATS_CONFIG = [
        { label: 'Total Applicants', value: stats.totalApplicants || 0, trend: '+12%' },
        { label: 'Active Jobs', value: stats.activeJobs || 0, trend: 'Stable' },
        { label: 'Interviews Today', value: stats.interviewsToday || 0, trend: 'Busy' },
    ];

    const pipeline = stats.pipeline;
    const PIPELINE = [
        { label: 'Applied', count: pipeline?.applied ?? stats.totalApplicants ?? 0, colorClass: 'text-blue-400' },
        { label: 'Screening', count: pipeline?.screening ?? 0, colorClass: 'text-amber-400' },
        { label: 'Interview', count: pipeline?.interview ?? 0, colorClass: 'text-violet-400' },
        { label: 'Offer', count: pipeline?.offer ?? 0, colorClass: 'text-emerald-400' },
    ];

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-8">
                {/* Page Header */}
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Employer Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Welcome back. Here's what's happening today.</p>
                </div>

                {/* Stats Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {STATS_CONFIG.map((stat, idx) => {
                            const { icon: Icon, colorClass, bgClass } = STAT_ICONS[idx];
                            return (
                                <Card key={stat.label} className="bg-card border-border/60">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                                <p className="text-4xl font-bold text-foreground mt-1">{stat.value}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <TrendingUp className={`h-3 w-3 ${colorClass}`} />
                                                    <span className={`text-xs font-medium ${colorClass}`}>{stat.trend}</span>
                                                </div>
                                            </div>
                                            <div className={`h-14 w-14 rounded-xl ${bgClass} flex items-center justify-center`}>
                                                <Icon className={`h-6 w-6 ${colorClass}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Recruitment Pipeline */}
                    <Card className="md:col-span-2 bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Recruitment Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {PIPELINE.map((stage) => (
                                    <div
                                        key={stage.label}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/40 text-center"
                                    >
                                        <span className={`text-3xl font-bold ${stage.colorClass}`}>{stage.count}</span>
                                        <span className="text-xs text-muted-foreground mt-1">{stage.label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button className="w-full font-semibold" asChild>
                                <a href="/employer/jobs">Post New Job</a>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/employer/applications">Review Applications</a>
                            </Button>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/employer/interviews">Schedule Interview</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </EmployerLayout>
    );
}
