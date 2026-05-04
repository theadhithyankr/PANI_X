import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Loader2, Search, Send, RotateCcw } from 'lucide-react';
import { useCampaigns, useCampaignInvitations } from '../../hooks/useSupabase';
import type { Campaign, CampaignInvitation } from '../../hooks/useSupabase';
import type { Candidate } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';

function getInvitationStatusClass(status: string) {
    switch (status) {
        case 'accepted': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30';
        case 'declined': return 'bg-rose-400/10 text-rose-400 border-rose-400/30';
        case 'pending': return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
        default: return 'bg-muted text-muted-foreground border-border';
    }
}

export default function EmployerCampaignInvitations() {
    const { id: campaignId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const { getCampaignById } = useCampaigns();
    const { invitations, loading, getInvitations, createInvitation, searchCandidates } = useCampaignInvitations();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [skillsInput, setSkillsInput] = useState('');
    const [minExperience, setMinExperience] = useState<number | ''>('');
    const [locationInput, setLocationInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Candidate[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
    const [customMessage, setCustomMessage] = useState('');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (!campaignId) return;
        Promise.all([
            getCampaignById(campaignId).then(setCampaign),
            getInvitations({ campaign_id: campaignId }),
        ]).finally(() => setPageLoading(false));
    }, [campaignId]);

    const handleSearch = async () => {
        if (!skillsInput.trim() && !locationInput.trim() && minExperience === '') {
            toast('Please enter at least one search criterion', 'error');
            return;
        }
        setSearching(true);
        setHasSearched(true);
        try {
            const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
            const results = await searchCandidates({
                skills: skills.length > 0 ? skills : undefined,
                min_experience: minExperience !== '' ? Number(minExperience) : undefined,
                location: locationInput.trim() || undefined,
            });
            const filtered = searchQuery.trim()
                ? results.filter(c => (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                : results;
            setSearchResults(filtered);
        } catch (error: any) {
            toast(error?.message || 'Search failed', 'error');
        } finally {
            setSearching(false);
        }
    };

    const toggleSelectCandidate = (candidateId: string) => {
        setSelectedCandidates(prev => {
            const next = new Set(prev);
            if (next.has(candidateId)) {
                next.delete(candidateId);
            } else {
                next.add(candidateId);
            }
            return next;
        });
    };

    const handleInviteSelected = async () => {
        if (!campaignId || selectedCandidates.size === 0) return;
        setInviting(true);
        let successCount = 0;
        let failCount = 0;

        for (const candidateId of Array.from(selectedCandidates)) {
            try {
                await createInvitation(campaignId, candidateId, customMessage.trim() || undefined);
                successCount++;
            } catch {
                failCount++;
            }
        }

        if (successCount > 0) {
            toast(`${successCount} invitation${successCount > 1 ? 's' : ''} sent successfully`, 'success');
        }
        if (failCount > 0) {
            toast(`${failCount} invitation${failCount > 1 ? 's' : ''} failed (already invited?)`, 'error');
        }

        setSelectedCandidates(new Set());
        setCustomMessage('');
        if (campaignId) await getInvitations({ campaign_id: campaignId });
        setInviting(false);
    };

    const handleResend = async (invitation: CampaignInvitation) => {
        if (!campaignId) return;
        try {
            await createInvitation(campaignId, invitation.candidate_id, invitation.message);
            toast('Invitation resent', 'success');
            await getInvitations({ campaign_id: campaignId });
        } catch (error: any) {
            toast(error?.message || 'Failed to resend invitation', 'error');
        }
    };

    const invitationStats = {
        sent: invitations.length,
        accepted: invitations.filter(i => i.status === 'accepted').length,
        declined: invitations.filter(i => i.status === 'declined').length,
        pending: invitations.filter(i => i.status === 'pending').length,
    };

    if (pageLoading) {
        return (
            <EmployerLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </EmployerLayout>
        );
    }

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                <button
                    onClick={() => navigate(`/employer/campaigns/${campaignId}`)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </button>

                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-foreground">
                        {campaign ? `Invitations — ${campaign.name}` : 'Campaign Invitations'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Search and invite candidates to participate in this campaign.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Sent', value: invitationStats.sent, color: 'text-foreground' },
                        { label: 'Accepted', value: invitationStats.accepted, color: 'text-emerald-400' },
                        { label: 'Pending', value: invitationStats.pending, color: 'text-amber-400' },
                        { label: 'Declined', value: invitationStats.declined, color: 'text-rose-400' },
                    ].map(({ label, value, color }) => (
                        <Card key={label} className="bg-card border-border/60">
                            <CardContent className="p-4">
                                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="bg-card border-border/60">
                    <CardContent className="p-5 space-y-4">
                        <p className="text-sm font-semibold text-foreground">Search Candidates</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Name</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                        disabled={searching}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Skills (comma-separated)</Label>
                                <Input
                                    placeholder="e.g. React, Python"
                                    value={skillsInput}
                                    onChange={(e) => setSkillsInput(e.target.value)}
                                    disabled={searching}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Location</Label>
                                <Input
                                    placeholder="e.g. New York"
                                    value={locationInput}
                                    onChange={(e) => setLocationInput(e.target.value)}
                                    disabled={searching}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Min Experience (years)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={minExperience}
                                    onChange={(e) => setMinExperience(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={searching}
                                />
                            </div>
                        </div>

                        <Button onClick={handleSearch} disabled={searching} className="gap-2">
                            {searching ? (
                                <><Loader2 className="h-4 w-4 animate-spin" />Searching...</>
                            ) : (
                                <><Search className="h-4 w-4" />Search Candidates</>
                            )}
                        </Button>

                        {hasSearched && searchResults.length === 0 && !searching && (
                            <p className="text-sm text-muted-foreground text-center py-4">No candidates found matching your criteria.</p>
                        )}

                        {searchResults.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">{searchResults.length} candidate{searchResults.length !== 1 ? 's' : ''} found</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {searchResults.map(candidate => {
                                        const alreadyInvited = invitations.some(i => i.candidate_id === candidate.id);
                                        const isSelected = selectedCandidates.has(candidate.id);
                                        return (
                                            <div
                                                key={candidate.id}
                                                onClick={() => !alreadyInvited && toggleSelectCandidate(candidate.id)}
                                                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                                                    alreadyInvited
                                                        ? 'border-border/40 bg-muted/10 opacity-60 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border/60 bg-muted/20 hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground text-sm truncate">{candidate.full_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{candidate.headline || candidate.role}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        {candidate.match_score > 0 && (
                                                            <span className="text-xs font-semibold text-primary">{candidate.match_score}%</span>
                                                        )}
                                                        {alreadyInvited && (
                                                            <span className="text-xs text-muted-foreground">Invited</span>
                                                        )}
                                                        {!alreadyInvited && (
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectCandidate(candidate.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="accent-primary"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                {candidate.skills && candidate.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {candidate.skills.slice(0, 3).map((skill: string) => (
                                                            <span key={skill} className="px-2 py-0.5 rounded-md bg-muted/40 text-xs text-muted-foreground">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {candidate.skills.length > 3 && (
                                                            <span className="text-xs text-muted-foreground">+{candidate.skills.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedCandidates.size > 0 && (
                                    <div className="space-y-3 pt-2 border-t border-border/60">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Custom Message (optional)</Label>
                                            <textarea
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                rows={3}
                                                placeholder="Write a personal message to include with the invitation..."
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                            />
                                        </div>
                                        <Button onClick={handleInviteSelected} disabled={inviting} className="gap-2">
                                            {inviting ? (
                                                <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                                            ) : (
                                                <><Send className="h-4 w-4" />Invite Selected ({selectedCandidates.size})</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Sent Invitations</p>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No invitations sent yet.
                        </div>
                    ) : (
                        <>
                            <Card className="bg-card border-border/60 hidden md:block">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border bg-muted/30">
                                                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Candidate</th>
                                                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                                                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Sent</th>
                                                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Responded</th>
                                                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invitations.map(inv => (
                                                    <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-foreground">{inv.candidate?.full_name || 'Unknown'}</p>
                                                            <p className="text-xs text-muted-foreground">{inv.candidate?.role || ''}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={`capitalize text-xs ${getInvitationStatusClass(inv.status)}`}>
                                                                {inv.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground text-sm">
                                                            {new Date(inv.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground text-sm">
                                                            {inv.responded_at
                                                                ? new Date(inv.responded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                : '—'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {(inv.status === 'pending' || inv.status === 'declined') && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleResend(inv)}
                                                                    className="gap-1.5 text-xs"
                                                                >
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                    Resend
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="md:hidden flex flex-col gap-3">
                                {invitations.map(inv => (
                                    <Card key={inv.id} className="bg-card border-border/60">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground text-sm">{inv.candidate?.full_name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="outline" className={`capitalize text-xs ${getInvitationStatusClass(inv.status)}`}>
                                                            {inv.status}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(inv.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(inv.status === 'pending' || inv.status === 'declined') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleResend(inv)}
                                                        className="gap-1.5 text-xs"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Resend
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
}
