import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Briefcase, CalendarCheck, Eye, Loader2, Trophy, Check, X } from 'lucide-react';
import { useDashboardStats, useCampaignInvitations } from '../hooks/useSupabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const STAT_ICONS = [
    { icon: Briefcase, colorClass: 'text-violet-400', bgClass: 'bg-violet-400/10' },
    { icon: CalendarCheck, colorClass: 'text-amber-400', bgClass: 'bg-amber-400/10' },
    { icon: Eye, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-400/10' },
];

export default function CandidateDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();
    const { stats, loading } = useDashboardStats();
    const { invitations, getInvitations, respondToInvitation } = useCampaignInvitations();

    useEffect(() => {
        if (user?.id) {
            getInvitations({ candidate_id: user.id, status: 'pending' });
        }
    }, [user?.id]);

    const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

    const handleAccept = async (invitationId: string) => {
        try {
            await respondToInvitation(invitationId, 'accepted');
            toast('Invitation accepted! You have been enrolled in the campaign.', 'success');
            navigate('/campaigns/progress');
        } catch {
            toast('Failed to accept invitation. Please try again.', 'error');
        }
    };

    const handleDecline = async (invitationId: string) => {
        try {
            await respondToInvitation(invitationId, 'declined');
            toast('Invitation declined.', 'success');
            if (user?.id) getInvitations({ candidate_id: user.id, status: 'pending' });
        } catch {
            toast('Failed to decline invitation. Please try again.', 'error');
        }
    };

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

                {/* Campaign Invitations */}
                {pendingInvitations.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold text-foreground">Campaign Invitations</h2>
                        {pendingInvitations.map(inv => (
                            <Card key={inv.id} className="bg-card border-border/60 border-l-4 border-l-amber-400">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                                            <Trophy className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground">
                                                {inv.campaign?.name ?? 'Campaign Invitation'}
                                            </p>
                                            {inv.campaign?.job?.title && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {inv.campaign.job.title}
                                                </p>
                                            )}
                                            {inv.message && (
                                                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                                    {inv.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleAccept(inv.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDecline(inv.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted/40 text-muted-foreground border border-border hover:bg-muted/60 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
