import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Briefcase, CalendarCheck, Eye, Loader2 } from 'lucide-react';
import { useDashboardStats } from '../hooks/useSupabase';

const STAT_ICONS = [
    { icon: Briefcase, colorClass: 'text-violet-400', bgClass: 'bg-violet-400/10' },
    { icon: CalendarCheck, colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10' },
    { icon: Eye, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10' },
];

export default function CandidateDashboard() {
    const { stats, loading } = useDashboardStats();

    const STATS_CONFIG = [
        { label: 'Applications Sent', value: stats.totalApplications || 0 },
        { label: 'Interviews', value: stats.interviewsScheduled || 0 },
        { label: 'Profile Views', value: stats.profileViews || 0 },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Welcome back! Here's your job search progress.</p>
                </div>

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
            </div>
        </DashboardLayout>
    );
}
