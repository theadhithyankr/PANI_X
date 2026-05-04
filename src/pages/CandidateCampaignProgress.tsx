import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import {
    Loader2, Trophy, Lock, X, Calendar,
} from 'lucide-react';
import { useCampaignApplications } from '../hooks/useSupabase';
import { useAuth } from '../contexts/AuthContext';
import type { CampaignApplication, CampaignRound, CampaignRoundResult } from '../hooks/useSupabase';

const STATUS_TABS = ['All', 'In Progress', 'Completed', 'Rejected'] as const;
type StatusTab = typeof STATUS_TABS[number];

const APP_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-muted/40 text-muted-foreground border-border',
    'in-progress': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    completed: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    rejected: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
};

const APP_STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected',
};

interface ProgressTrackerModalProps {
    open: boolean;
    onClose: () => void;
    application: CampaignApplication | null;
}

function ProgressTrackerModal({ open, onClose, application }: ProgressTrackerModalProps) {
    if (!open || !application) return null;

    const rounds: CampaignRound[] = application.campaign?.rounds ?? [];
    const results: CampaignRoundResult[] = application.round_results ?? [];
    const currentRound = application.current_round ?? 1;

    const sortedRounds = rounds.slice().sort((a, b) => a.round_number - b.round_number);

    const getResult = (roundId: string) =>
        results.find(r => r.round_id === roundId) ?? null;

    type RoundState = 'passed' | 'failed' | 'pending' | 'upcoming' | 'locked';

    const getRoundState = (round: CampaignRound): RoundState => {
        const result = getResult(round.id);
        if (result) {
            if (result.status === 'passed') return 'passed';
            if (result.status === 'failed') return 'failed';
            return 'pending';
        }
        if (round.round_number === currentRound) return 'upcoming';
        if (round.round_number > currentRound) return 'locked';
        return 'upcoming';
    };

    const stateConfig: Record<RoundState, { border: string; dot: string; label: string }> = {
        passed: { border: 'border-l-emerald-400', dot: 'bg-emerald-400', label: 'Passed' },
        failed: { border: 'border-l-rose-400', dot: 'bg-rose-400', label: 'Failed' },
        pending: { border: 'border-l-amber-400', dot: 'bg-amber-400', label: 'Awaiting Review' },
        upcoming: { border: 'border-l-blue-400', dot: 'bg-blue-400', label: 'Current Round' },
        locked: { border: 'border-l-muted-foreground/30', dot: 'bg-muted-foreground/30', label: 'Locked' },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border/60 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border/60 sticky top-0 bg-card z-10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {application.campaign?.name ?? 'Campaign Progress'}
                        </h2>
                        {application.campaign?.job?.title && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {application.campaign.job.title}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    {sortedRounds.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No rounds configured for this campaign.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {sortedRounds.map(round => {
                                const state = getRoundState(round);
                                const config = stateConfig[state];
                                const result = getResult(round.id);

                                return (
                                    <div
                                        key={round.id}
                                        className={`border-l-4 ${config.border} pl-4 py-1`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Dot indicator */}
                                            <div className={`h-3 w-3 rounded-full shrink-0 mt-1 ${config.dot}`} />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        Round {round.round_number}: {round.name}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${
                                                        state === 'passed' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                                                        state === 'failed' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                                                        state === 'pending' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                                        state === 'upcoming' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                                                        'bg-muted/40 text-muted-foreground border-border'
                                                    }`}>
                                                        {config.label}
                                                    </span>
                                                </div>

                                                {/* Round type & date */}
                                                <div className="flex flex-wrap gap-3 mt-1">
                                                    <span className="text-xs text-muted-foreground capitalize">{round.type}</span>
                                                    {round.scheduled_date && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(round.scheduled_date).toLocaleDateString('en-GB', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Result details */}
                                                {result && (
                                                    <div className="mt-2 flex flex-col gap-1">
                                                        {result.score !== undefined && result.score !== null && (
                                                            <p className="text-xs text-foreground font-medium">
                                                                Score: {result.score}/100
                                                            </p>
                                                        )}
                                                        {result.feedback && (
                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                {result.feedback}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Locked note */}
                                                {state === 'locked' && (
                                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground/70">
                                                        <Lock className="h-3 w-3" />
                                                        Complete previous rounds to unlock
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-6 border-t border-border/60">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CandidateCampaignProgress() {
    const { user } = useAuth();
    const { applications, loading, getApplications } = useCampaignApplications();
    const [statusTab, setStatusTab] = useState<StatusTab>('All');
    const [selectedApplication, setSelectedApplication] = useState<CampaignApplication | null>(null);

    useEffect(() => {
        if (user?.id) {
            getApplications({ candidate_id: user.id });
        }
    }, [user?.id]);

    const filteredApplications = applications.filter(app => {
        if (statusTab === 'All') return true;
        if (statusTab === 'In Progress') return app.status === 'in-progress' || app.status === 'pending';
        if (statusTab === 'Completed') return app.status === 'completed';
        if (statusTab === 'Rejected') return app.status === 'rejected';
        return true;
    });

    const getTabCount = (tab: StatusTab) => {
        if (tab === 'All') return applications.length;
        if (tab === 'In Progress') return applications.filter(a => a.status === 'in-progress' || a.status === 'pending').length;
        if (tab === 'Completed') return applications.filter(a => a.status === 'completed').length;
        if (tab === 'Rejected') return applications.filter(a => a.status === 'rejected').length;
        return 0;
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-5">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Campaign Applications</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Track your progress in active hiring campaigns.
                    </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit flex-wrap">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusTab(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                statusTab === tab
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab}
                            <span className="ml-1 text-xs opacity-70">({getTabCount(tab)})</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <Trophy className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">No applications found</p>
                        <p className="text-sm text-muted-foreground/70">
                            {statusTab === 'All'
                                ? 'You have not applied to any campaigns yet.'
                                : `No ${statusTab.toLowerCase()} applications.`}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredApplications.map(app => {
                            const rounds = app.campaign?.rounds ?? [];
                            const totalRounds = rounds.length;
                            const currentRound = app.current_round ?? 1;

                            return (
                                <Card
                                    key={app.id}
                                    className="bg-card border-border/60 hover:shadow-md transition-shadow"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            {/* Icon */}
                                            <div className="h-10 w-10 rounded-xl bg-violet-400/10 flex items-center justify-center shrink-0">
                                                <Trophy className="h-5 w-5 text-violet-400" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground truncate">
                                                    {app.campaign?.name ?? 'Campaign'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {app.campaign?.job?.title ?? ''}
                                                    {totalRounds > 0 && (
                                                        <span className="ml-2 opacity-70">
                                                            · Round {Math.min(currentRound, totalRounds)} of {totalRounds}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Right side */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${
                                                    APP_STATUS_STYLES[app.status] ?? APP_STATUS_STYLES.pending
                                                }`}>
                                                    {APP_STATUS_LABELS[app.status] ?? app.status}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedApplication(app)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                                                >
                                                    View Progress
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <ProgressTrackerModal
                open={selectedApplication !== null}
                onClose={() => setSelectedApplication(null)}
                application={selectedApplication}
            />
        </DashboardLayout>
    );
}
