import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import {
    Calendar, Loader2,
    ChevronRight, Trophy, X, CheckCircle2, XCircle, MinusCircle,
} from 'lucide-react';
import {
    useCampaigns,
    useCampaignApplications,
    useCampaignInvitations,
    useProfile,
} from '../hooks/useSupabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Campaign } from '../hooks/useSupabase';
import { checkEligibility } from '../utils/eligibilityChecker';
import { calculateJobMatch } from '../utils/ai';

const FILTER_TABS = ['All', 'Eligible', 'Invited'] as const;
type FilterTab = typeof FILTER_TABS[number];

function formatDateRange(start: string, end: string) {
    const fmt = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
}

function RoundTypeBadge({ type }: { type: string }) {
    return (
        <span className="px-2 py-0.5 text-xs rounded-full bg-violet-400/10 text-violet-400 border border-violet-400/20 font-medium capitalize">
            {type}
        </span>
    );
}

interface CampaignDetailsModalProps {
    open: boolean;
    onClose: () => void;
    campaign: Campaign | null;
    profile: any;
    alreadyApplied: boolean;
    isInvited: boolean;
    onApply: (campaignId: string) => Promise<void>;
}

function CampaignDetailsModal({
    open,
    onClose,
    campaign,
    profile,
    alreadyApplied,
    isInvited,
    onApply,
}: CampaignDetailsModalProps) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    if (!open || !campaign) return null;

    const matchResult = campaign.job && profile
        ? calculateJobMatch(campaign.job, profile)
        : { score: 0, details: [] as { label: string; type: 'success' | 'warning' | 'neutral'; score?: string; category?: string }[] };

    const eligibility = checkEligibility(
        profile || { id: user?.id || '' },
        campaign,
        matchResult.score,
    );

    // Invited candidates can always apply regardless of eligibility
    const canApply = eligibility.eligible || isInvited;

    const rounds = campaign.rounds ?? [];

    // Campaign-specific unmet criteria excluding score (score is shown via matchResult bar)
    const campaignUnmet = eligibility.unmetCriteria.filter(c => c.type !== 'matching_score');

    const handleApply = async () => {
        if (!campaign) return;
        setSubmitting(true);
        try {
            await onApply(campaign.id);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-border/60 sticky top-0 bg-card z-10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">{campaign.name}</h2>
                        {campaign.job?.title && (
                            <p className="text-sm text-muted-foreground mt-0.5">{campaign.job.title}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Date range & visibility */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDateRange(campaign.start_date, campaign.end_date)}
                        </span>
                        {campaign.visibility === 'invite-only' && isInvited && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium">
                                Invited
                            </span>
                        )}
                        <span className="px-2 py-0.5 text-xs rounded-full bg-muted/40 text-muted-foreground border border-border font-medium">
                            {rounds.length} {rounds.length === 1 ? 'Round' : 'Rounds'}
                        </span>
                    </div>

                    {/* Description */}
                    {campaign.job?.description && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-2">About the Role</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {campaign.job.description.length > 200
                                    ? campaign.job.description.slice(0, 200) + '…'
                                    : campaign.job.description}
                            </p>
                        </div>
                    )}

                    {/* Entry Criteria */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Entry Criteria</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {campaign.min_matching_score !== undefined && campaign.min_matching_score > 0 && (
                                <div className="bg-muted/20 rounded-xl p-3 border border-border/60">
                                    <p className="text-xs text-muted-foreground">Min Match Score</p>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">{campaign.min_matching_score}%</p>
                                </div>
                            )}
                            {(campaign.min_experience !== undefined || campaign.max_experience !== undefined) && (
                                <div className="bg-muted/20 rounded-xl p-3 border border-border/60">
                                    <p className="text-xs text-muted-foreground">Experience</p>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">
                                        {campaign.min_experience ?? 0}–{campaign.max_experience ?? '∞'} years
                                    </p>
                                </div>
                            )}
                            {campaign.required_skills && campaign.required_skills.length > 0 && (
                                <div className="bg-muted/20 rounded-xl p-3 border border-border/60 sm:col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1.5">Required Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(campaign.required_skills as any[]).map((s, i) => {
                                            const skillName = s.name || s.skill || '';
                                            return (
                                                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-violet-400/10 text-violet-400 border border-violet-400/20 font-medium">
                                                    {skillName} · {s.proficiency}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {campaign.education_requirements && campaign.education_requirements.length > 0 && (
                                <div className="bg-muted/20 rounded-xl p-3 border border-border/60 sm:col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1.5">Education</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(campaign.education_requirements as { level: string; field?: string }[]).map((e, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20 font-medium">
                                                {e.field ? `${e.level} in ${e.field}` : e.level}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pipeline */}
                    {rounds.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Hiring Pipeline</h3>
                            <div className="flex flex-col gap-2">
                                {rounds
                                    .slice()
                                    .sort((a, b) => a.round_number - b.round_number)
                                    .map(round => (
                                        <div
                                            key={round.id}
                                            className="flex items-center gap-3 bg-muted/20 rounded-xl p-3 border border-border/60"
                                        >
                                            <div className="h-7 w-7 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                                                {round.round_number}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">{round.name}</p>
                                                {round.scheduled_date && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {new Date(round.scheduled_date).toLocaleDateString('en-GB', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                            <RoundTypeBadge type={round.type} />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Match Score */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-foreground">Your Match Score</h3>
                            <span className={`text-lg font-bold ${
                                matchResult.score >= (campaign.min_matching_score || 0)
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                            }`}>
                                {matchResult.score}%
                            </span>
                        </div>
                        <div className="w-full bg-muted/40 rounded-full h-2 mb-1">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    matchResult.score >= (campaign.min_matching_score || 0)
                                        ? 'bg-emerald-400'
                                        : 'bg-rose-400'
                                }`}
                                style={{ width: `${Math.min(matchResult.score, 100)}%` }}
                            />
                        </div>
                        {campaign.min_matching_score !== undefined && campaign.min_matching_score > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Minimum required: {campaign.min_matching_score}%
                                {matchResult.score >= campaign.min_matching_score
                                    ? ' — you qualify'
                                    : ` — you need ${campaign.min_matching_score - matchResult.score}% more`}
                            </p>
                        )}
                    </div>

                    {/* Match Breakdown */}
                    {matchResult.details.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">What You Have / Missing</h3>
                            <div className="flex flex-col gap-1.5">
                                {matchResult.details.map((d, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-2 text-sm ${
                                            d.type === 'success'
                                                ? 'text-emerald-400'
                                                : d.type === 'warning'
                                                ? 'text-rose-400'
                                                : 'text-amber-400'
                                        }`}
                                    >
                                        {d.type === 'success' ? (
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                        ) : d.type === 'warning' ? (
                                            <XCircle className="h-4 w-4 shrink-0" />
                                        ) : (
                                            <MinusCircle className="h-4 w-4 shrink-0" />
                                        )}
                                        <span className="flex-1">{d.label}</span>
                                        {d.score && (
                                            <span className="text-xs opacity-60 font-medium">{d.score}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Campaign-specific unmet criteria (experience range, education, required skills) */}
                    {campaignUnmet.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Campaign Requirements Not Met</h3>
                            <div className="flex flex-col gap-1.5">
                                {campaignUnmet.map((c, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-rose-400">
                                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>{c.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All criteria met */}
                    {eligibility.eligible && matchResult.details.length === 0 && campaignUnmet.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>You meet all eligibility criteria</span>
                        </div>
                    )}

                    {/* Invited override notice */}
                    {isInvited && !eligibility.eligible && (
                        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-sm text-amber-400">
                            You were personally invited by the employer — you can apply even if you don't fully meet the listed criteria.
                        </div>
                    )}

                    {/* Invited note (eligible) */}
                    {campaign.visibility === 'invite-only' && isInvited && eligibility.eligible && (
                        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-sm text-amber-400">
                            You have been personally invited to this campaign by the employer.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border/60 sticky bottom-0 bg-card">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Close
                    </button>
                    {alreadyApplied ? (
                        <button
                            disabled
                            className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-400/10 text-blue-400 border border-blue-400/20 cursor-not-allowed"
                        >
                            Already Applied
                        </button>
                    ) : !canApply ? (
                        <button
                            disabled
                            className="px-5 py-2 text-sm font-semibold rounded-xl bg-muted/40 text-muted-foreground border border-border cursor-not-allowed"
                        >
                            Not Eligible
                        </button>
                    ) : (
                        <button
                            onClick={handleApply}
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isInvited && !eligibility.eligible ? 'Apply (Invited)' : 'Apply Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CandidateCampaigns() {
    const { user } = useAuth();
    const toast = useToast();
    const { profile } = useProfile();
    const { campaigns, loading: loadingCampaigns, getCampaigns } = useCampaigns();
    const { applications, loading: loadingApps, getApplications, createApplication } = useCampaignApplications();
    const { invitations, getInvitations } = useCampaignInvitations();

    const [filterTab, setFilterTab] = useState<FilterTab>('All');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    useEffect(() => {
        getCampaigns({ status: 'active', visibility: 'public' });
        if (user?.id) {
            getInvitations({ candidate_id: user.id });
            getApplications({ candidate_id: user.id });
        }
    }, [user?.id]);

    const invitedCampaignIds = new Set(
        invitations
            .filter(inv => inv.status === 'pending' || inv.status === 'accepted')
            .map(inv => inv.campaign_id)
    );

    const inviteOnlyCampaigns = invitations
        .filter(inv => inv.campaign_id && inv.campaign?.visibility === 'invite-only')
        .map(inv => inv.campaign)
        .filter(Boolean) as Campaign[];

    const allCampaigns = [
        ...campaigns,
        ...inviteOnlyCampaigns.filter(ic => !campaigns.find(c => c.id === ic.id)),
    ];

    const appliedCampaignIds = new Set(applications.map(a => a.campaign_id));

    const getEligibility = (campaign: Campaign) => {
        const matchScore = campaign.job && profile
            ? calculateJobMatch(campaign.job, profile).score
            : 0;
        return checkEligibility(profile || { id: user?.id || '' }, campaign, matchScore);
    };

    const filteredCampaigns = allCampaigns.filter(c => {
        if (filterTab === 'Eligible') return getEligibility(c).eligible || invitedCampaignIds.has(c.id);
        if (filterTab === 'Invited') return invitedCampaignIds.has(c.id);
        return true;
    });

    const loading = loadingCampaigns || loadingApps;

    const handleApply = async (campaignId: string) => {
        if (!user?.id) return;
        await createApplication(campaignId, user.id);
        await getApplications({ candidate_id: user.id });
        toast('Application submitted successfully!', 'success');
        setSelectedCampaign(null);
    };

    const selectedIsInvited = selectedCampaign ? invitedCampaignIds.has(selectedCampaign.id) : false;
    const selectedAlreadyApplied = selectedCampaign ? appliedCampaignIds.has(selectedCampaign.id) : false;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-5">
                <div className="hidden md:block">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Hiring Campaigns</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Discover active hiring campaigns and apply to ones that match your profile.
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterTab(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                filterTab === tab
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <Trophy className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium">No campaigns found</p>
                        <p className="text-sm text-muted-foreground/70">
                            {filterTab === 'Invited'
                                ? 'You have no campaign invitations.'
                                : filterTab === 'Eligible'
                                ? 'No active campaigns match your eligibility.'
                                : 'There are no active hiring campaigns right now.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCampaigns.map(campaign => {
                            const eligibility = getEligibility(campaign);
                            const matchScore = campaign.job && profile
                                ? calculateJobMatch(campaign.job, profile).score
                                : 0;
                            const applied = appliedCampaignIds.has(campaign.id);
                            const invited = invitedCampaignIds.has(campaign.id);
                            const rounds = campaign.rounds ?? [];

                            return (
                                <Card
                                    key={campaign.id}
                                    className="bg-card border-border/60 hover:shadow-md transition-shadow flex flex-col"
                                >
                                    <CardContent className="p-5 flex flex-col gap-3 flex-1">
                                        {/* Campaign name & job title */}
                                        <div>
                                            <p className="font-bold text-foreground text-base leading-snug">{campaign.name}</p>
                                            {campaign.job?.title && (
                                                <p className="text-sm text-muted-foreground mt-0.5">{campaign.job.title}</p>
                                            )}
                                        </div>

                                        {/* Match score bar */}
                                        {campaign.job && profile && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-muted/40 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all ${
                                                            eligibility.eligible || invited ? 'bg-emerald-400' : 'bg-rose-400/70'
                                                        }`}
                                                        style={{ width: `${Math.min(matchScore, 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-semibold tabular-nums ${
                                                    eligibility.eligible || invited ? 'text-emerald-400' : 'text-muted-foreground'
                                                }`}>
                                                    {matchScore}%
                                                </span>
                                            </div>
                                        )}

                                        {/* Date range */}
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            {formatDateRange(campaign.start_date, campaign.end_date)}
                                        </div>

                                        {/* Badges row */}
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted/40 text-muted-foreground border border-border font-medium">
                                                {rounds.length} {rounds.length === 1 ? 'Round' : 'Rounds'}
                                            </span>

                                            {invited && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium">
                                                    Invited
                                                </span>
                                            )}

                                            {eligibility.eligible ? (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">
                                                    Eligible
                                                </span>
                                            ) : !invited ? (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20 font-medium">
                                                    Not Eligible
                                                </span>
                                            ) : null}

                                            {applied && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20 font-medium">
                                                    Applied
                                                </span>
                                            )}
                                        </div>

                                        {/* View Details button */}
                                        <button
                                            onClick={() => setSelectedCampaign(campaign)}
                                            className="mt-auto flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                                        >
                                            View Details
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <CampaignDetailsModal
                open={selectedCampaign !== null}
                onClose={() => setSelectedCampaign(null)}
                campaign={selectedCampaign}
                profile={profile}
                alreadyApplied={selectedAlreadyApplied}
                isInvited={selectedIsInvited}
                onApply={handleApply}
            />
        </DashboardLayout>
    );
}
