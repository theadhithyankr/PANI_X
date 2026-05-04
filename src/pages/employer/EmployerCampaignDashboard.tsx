import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import {
    ArrowLeft, Loader2, Users, CheckCircle, XCircle, Clock,
    GitBranch, Search, Trash2, Plus, Mail
} from 'lucide-react';
import {
    useCampaigns,
    useCampaignApplications,
    useCampaignRoundResults,
    useCampaignRounds,
} from '../../hooks/useSupabase';
import type { Campaign, CampaignApplication, CampaignRound } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';
import PipelineBuilderModal from '../../components/employer/PipelineBuilderModal';

function getStatusBadgeClass(status: string) {
    switch (status) {
        case 'active': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30';
        case 'draft': return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
        case 'completed': return 'bg-muted text-muted-foreground border-border';
        case 'in-progress': return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
        case 'pending': return 'bg-muted/40 text-muted-foreground border-border';
        case 'rejected': return 'bg-rose-400/10 text-rose-400 border-rose-400/30';
        default: return 'bg-muted text-muted-foreground border-border';
    }
}

interface CandidateReviewModalProps {
    open: boolean;
    onClose: () => void;
    application: CampaignApplication | null;
    campaign: Campaign | null;
    onSuccess: () => void;
}

function CandidateReviewModal({ open, onClose, application, campaign, onSuccess }: CandidateReviewModalProps) {
    const { createResult } = useCampaignRoundResults();
    const toast = useToast();

    const [score, setScore] = useState<number | ''>('');
    const [resultStatus, setResultStatus] = useState<'passed' | 'failed'>('passed');
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setScore('');
            setResultStatus('passed');
            setFeedback('');
        }
    }, [open]);

    if (!open || !application || !campaign) return null;

    const currentRound = campaign.rounds?.find(r => r.round_number === application.current_round + 1)
        || campaign.rounds?.[application.current_round]
        || campaign.rounds?.[0];

    const handleSubmit = async () => {
        if (!currentRound) {
            toast('No round found for this application', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await createResult(application.id, currentRound.id, {
                score: typeof score === 'number' ? score : 0,
                status: resultStatus,
                feedback,
            });
            toast('Result submitted successfully', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast(error?.message || 'Failed to submit result', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                    <h2 className="text-lg font-semibold text-foreground">Review Candidate</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">{application.candidate?.full_name || 'Candidate'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {currentRound ? `Round: ${currentRound.name}` : 'No active round'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Score (0–100)</Label>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={score}
                            onChange={(e) => setScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))}
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Result</Label>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="result"
                                    value="passed"
                                    checked={resultStatus === 'passed'}
                                    onChange={() => setResultStatus('passed')}
                                    disabled={submitting}
                                    className="accent-primary"
                                />
                                <span className="text-sm text-emerald-400">Pass</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="result"
                                    value="failed"
                                    checked={resultStatus === 'failed'}
                                    onChange={() => setResultStatus('failed')}
                                    disabled={submitting}
                                    className="accent-primary"
                                />
                                <span className="text-sm text-rose-400">Fail</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Feedback</Label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            disabled={submitting}
                            rows={3}
                            placeholder="Optional feedback for the candidate..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/50">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !currentRound} className="gap-2">
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : 'Submit Result'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function EmployerCampaignDashboard() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const { getCampaignById, updateCampaign } = useCampaigns();
    const { applications, getApplications, getApplicationStats } = useCampaignApplications();
    const { rounds, getRounds, deleteRound } = useCampaignRounds();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, inProgress: 0, passed: 0, rejected: 0 });
    const [activeTab, setActiveTab] = useState<'applications' | 'pipeline' | 'invitations'>('applications');

    const [reviewApp, setReviewApp] = useState<CampaignApplication | null>(null);
    const [reviewOpen, setReviewOpen] = useState(false);

    const [pipelineOpen, setPipelineOpen] = useState(false);

    const [roundFilter, setRoundFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [cam, apps, appStats] = await Promise.all([
                getCampaignById(id),
                getApplications({ campaign_id: id }),
                getApplicationStats(id),
            ]);
            setCampaign(cam);
            await getRounds(id);

            const inProgress = apps.filter(a => a.status === 'in-progress').length;
            const passed = apps.filter(a => a.status === 'completed').length;
            const rejected = apps.filter(a => a.status === 'rejected').length;
            setStats({ total: appStats.total, inProgress, passed, rejected });
        } catch (error: any) {
            toast(error?.message || 'Failed to load campaign', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatus = async (newStatus: 'draft' | 'active' | 'completed') => {
        if (!campaign || !id) return;
        setUpdatingStatus(true);
        try {
            await updateCampaign(id, { status: newStatus });
            setCampaign(prev => prev ? { ...prev, status: newStatus } : prev);
            toast(`Campaign status updated to ${newStatus}`, 'success');
        } catch (error: any) {
            toast(error?.message || 'Failed to update status', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteRound = async (roundId: string) => {
        try {
            await deleteRound(roundId);
            if (id) await getRounds(id);
            toast('Round deleted', 'success');
        } catch (error: any) {
            toast(error?.message || 'Failed to delete round', 'error');
        }
    };

    const filteredApplications = applications.filter(app => {
        const nameMatch = (app.candidate?.full_name || '').toLowerCase().includes(search.toLowerCase());
        const roundMatch = roundFilter === 'all' || String(app.current_round) === roundFilter;
        return nameMatch && roundMatch;
    });

    const funnelRounds = campaign?.rounds || [];
    const maxFunnelCount = Math.max(...funnelRounds.map(r => {
        return applications.filter(a => a.current_round >= r.round_number).length;
    }), 1);

    if (loading) {
        return (
            <EmployerLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </EmployerLayout>
        );
    }

    if (!campaign) {
        return (
            <EmployerLayout>
                <div className="text-center py-20 text-muted-foreground">Campaign not found.</div>
            </EmployerLayout>
        );
    }

    const funnelBarColor = (index: number, total: number) => {
        const pos = index / Math.max(total - 1, 1);
        if (pos < 0.33) return 'bg-blue-500';
        if (pos < 0.66) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                <button
                    onClick={() => navigate('/employer/campaigns')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Campaigns
                </button>

                <Card className="bg-card border-border/60">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
                                    <Badge variant="outline" className={`capitalize ${getStatusBadgeClass(campaign.status)}`}>
                                        {campaign.status}
                                    </Badge>
                                    <Badge variant="outline" className="capitalize text-xs border-border text-muted-foreground">
                                        {campaign.visibility}
                                    </Badge>
                                </div>
                                {campaign.job && (
                                    <p className="text-sm text-muted-foreground">{campaign.job.title}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {new Date(campaign.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {' – '}
                                    {new Date(campaign.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPipelineOpen(true)}
                                    className="gap-2"
                                >
                                    <GitBranch className="h-4 w-4" />
                                    Edit Pipeline
                                </Button>
                                <Select
                                    value={campaign.status}
                                    onValueChange={(v) => handleChangeStatus(v as 'draft' | 'active' | 'completed')}
                                    disabled={updatingStatus}
                                >
                                    <SelectTrigger className="w-36 h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Applicants', value: stats.total, icon: Users, color: 'text-blue-400' },
                        { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-400' },
                        { label: 'Passed', value: stats.passed, icon: CheckCircle, color: 'text-emerald-400' },
                        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="bg-card border-border/60">
                            <CardContent className="p-4 flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${color}`} />
                                <div>
                                    <p className="text-xl font-bold text-foreground">{value}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex border-b border-border/60">
                    {(['applications', 'pipeline', 'invitations'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'applications' && (
                    <div className="space-y-4">
                        {funnelRounds.length > 0 && (
                            <Card className="bg-card border-border/60">
                                <CardContent className="p-5 space-y-3">
                                    <p className="text-sm font-semibold text-foreground">Conversion Funnel</p>
                                    <div className="space-y-2">
                                        {funnelRounds.map((round, index) => {
                                            const count = applications.filter(a => a.current_round >= round.round_number).length;
                                            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                            return (
                                                <div key={round.id} className="flex items-center gap-3">
                                                    <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{round.name}</span>
                                                    <div className="flex-1 h-4 bg-muted/40 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${funnelBarColor(index, funnelRounds.length)}`}
                                                            style={{ width: `${stats.total > 0 ? (count / maxFunnelCount) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                                                        {count} ({pct}%)
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by candidate name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={roundFilter} onValueChange={setRoundFilter}>
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="All Rounds" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Rounds</SelectItem>
                                    {campaign.rounds?.map(r => (
                                        <SelectItem key={r.id} value={String(r.round_number)}>
                                            Round {r.round_number}: {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Card className="bg-card border-border/60 hidden md:block">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Candidate</th>
                                                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Match Score</th>
                                                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Current Round</th>
                                                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                                                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplications.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                                                        No applicants found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredApplications.map(app => {
                                                    const currentRoundData = campaign.rounds?.find(
                                                        r => r.round_number === app.current_round + 1
                                                    ) || campaign.rounds?.[0];
                                                    return (
                                                        <tr key={app.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-foreground">{app.candidate?.full_name || 'Unknown'}</p>
                                                                <p className="text-xs text-muted-foreground">{app.candidate?.role || ''}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-sm font-semibold text-foreground">
                                                                    {app.candidate?.match_score ?? '-'}%
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-muted-foreground text-sm">
                                                                {currentRoundData ? currentRoundData.name : `Round ${app.current_round}`}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Badge variant="outline" className={`capitalize text-xs ${getStatusBadgeClass(app.status)}`}>
                                                                    {app.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => { setReviewApp(app); setReviewOpen(true); }}
                                                                    disabled={app.status === 'rejected'}
                                                                >
                                                                    Review
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="md:hidden flex flex-col gap-3">
                            {filteredApplications.length === 0 ? (
                                <p className="text-center py-12 text-muted-foreground text-sm">No applicants found.</p>
                            ) : (
                                filteredApplications.map(app => {
                                    const currentRoundData = campaign.rounds?.find(r => r.round_number === app.current_round + 1);
                                    return (
                                        <Card key={app.id} className="bg-card border-border/60">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground text-sm">{app.candidate?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{currentRoundData?.name || `Round ${app.current_round}`}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className={`capitalize text-xs ${getStatusBadgeClass(app.status)}`}>
                                                                {app.status}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">{app.candidate?.match_score ?? 0}% match</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => { setReviewApp(app); setReviewOpen(true); }}
                                                        disabled={app.status === 'rejected'}
                                                    >
                                                        Review
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pipeline' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{rounds.length} rounds configured</p>
                            <Button onClick={() => setPipelineOpen(true)} className="gap-2" size="sm">
                                <Plus className="h-4 w-4" />
                                Add Rounds
                            </Button>
                        </div>

                        {rounds.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                No rounds configured yet. Add rounds to build the pipeline.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rounds.map((round: CampaignRound) => (
                                    <Card key={round.id} className="bg-card border-border/60">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                                        {round.round_number}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm">{round.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{round.type}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                            <span>{new Date(round.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            {round.min_passing_score !== undefined && (
                                                                <span>Min score: {round.min_passing_score}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteRound(round.id)}
                                                    className="p-1.5 rounded-md hover:bg-rose-400/10 text-muted-foreground hover:text-rose-400 transition-colors"
                                                    title="Delete round"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'invitations' && (
                    <div className="space-y-4">
                        <Card className="bg-card border-border/60">
                            <CardContent className="p-5 space-y-3">
                                <p className="text-sm font-semibold text-foreground">Candidate Invitations</p>
                                <p className="text-sm text-muted-foreground">
                                    Invite candidates to this campaign to expand your talent pool.
                                </p>
                                <Button
                                    onClick={() => navigate(`/employer/campaigns/${id}/invitations`)}
                                    className="gap-2"
                                >
                                    <Mail className="h-4 w-4" />
                                    Manage Invitations
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <CandidateReviewModal
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                application={reviewApp}
                campaign={campaign}
                onSuccess={fetchData}
            />

            <PipelineBuilderModal
                open={pipelineOpen}
                onClose={() => { setPipelineOpen(false); if (id) getRounds(id); }}
                campaign={campaign}
            />
        </EmployerLayout>
    );
}
