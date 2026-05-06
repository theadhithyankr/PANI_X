import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../../components/employer/EmployerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, MoreVertical, Pencil, Trash2, BarChart3, Loader2, Calendar, Users, Briefcase, Filter, Zap, GitBranch } from 'lucide-react';
import { useCampaigns, useCampaignApplications } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import type { Campaign } from '../../hooks/useSupabase';
import CampaignCreationModal from '../../components/employer/CampaignCreationModal';
import PipelineBuilderModal from '../../components/employer/PipelineBuilderModal';

export default function EmployerCampaigns() {
    const { user } = useAuth();
    const { campaigns, loading, getCampaigns, deleteCampaign, updateCampaign } = useCampaigns();
    const { applications: allApps, getApplications } = useCampaignApplications();
    const toast = useToast();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all');
    const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [pipelineOpen, setPipelineOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    // Fetch campaigns and application counts on mount
    useEffect(() => {
        if (user?.id) {
            getCampaigns({ employer_id: user.id });
            // Fetch all applications (RLS scopes to this employer's campaigns)
            getApplications();
        }
    }, [user?.id]);

    // Filter campaigns by status
    const filteredCampaigns = campaigns.filter((campaign) => {
        if (statusFilter === 'all') return true;
        return campaign.status === statusFilter;
    });

    const handleActivate = async (campaign: Campaign) => {
        try {
            await updateCampaign(campaign.id, { status: 'active' });
            toast('Campaign activated! Candidates can now discover and apply.', 'success');
            if (user?.id) getCampaigns({ employer_id: user.id });
        } catch (error: any) {
            toast(error?.message || 'Failed to activate campaign', 'error');
        }
    };

    const handleDelete = async (campaign: Campaign) => {
        setDeleteTarget(campaign);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteCampaign(deleteTarget.id);
            toast('Campaign deleted successfully.', 'success');
            setDeleteTarget(null);
        } catch (error: any) {
            toast('Failed to delete campaign: ' + (error?.message || 'Unknown error'), 'error');
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30';
            case 'draft':
                return 'bg-amber-400/10 text-amber-400 border-amber-400/30';
            case 'completed':
                return 'bg-muted text-muted-foreground border-border';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const end = new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${start} - ${end}`;
    };

    const getApplicantCount = (campaignId: string) => {
        return allApps.filter(a => a.campaign_id === campaignId).length;
    };

    return (
        <EmployerLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-foreground">My Campaigns</h1>
                        <p className="hidden sm:block text-muted-foreground mt-1 text-sm">
                            Manage your hiring campaigns and track candidate progress.
                        </p>
                    </div>
                    <Button className="gap-2 text-sm shrink-0" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Campaign</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span>Filter:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === 'draft' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('draft')}
                        >
                            Draft
                        </Button>
                        <Button
                            variant={statusFilter === 'active' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('active')}
                        >
                            Active
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('completed')}
                        >
                            Completed
                        </Button>
                    </div>
                </div>

                {/* Desktop Table */}
                <Card className="bg-card border-border/60 hidden md:block">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Campaign Name</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Linked Job</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date Range</th>
                                        <th className="text-center px-4 py-3 text-muted-foreground font-medium">Applicants</th>
                                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                                        <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && filteredCampaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                                            </td>
                                        </tr>
                                    ) : filteredCampaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                                {statusFilter === 'all'
                                                    ? 'No campaigns created yet. Create your first campaign to get started!'
                                                    : `No ${statusFilter} campaigns found.`
                                                }
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCampaigns.map((campaign) => (
                                            <tr
                                                key={campaign.id}
                                                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <p className="font-semibold text-foreground">{campaign.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {campaign.rounds?.length || 0} rounds · {campaign.visibility}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-foreground">{campaign.job?.title || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{formatDateRange(campaign.start_date, campaign.end_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full border border-border text-xs text-muted-foreground">
                                                        {getApplicantCount(campaign.id)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`capitalize ${getStatusBadgeClass(campaign.status)}`}
                                                    >
                                                        {campaign.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                                title="Open campaign actions"
                                                                aria-label="Open campaign actions"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" sideOffset={8} className="w-44">
                                                            {campaign.status === 'draft' && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleActivate(campaign)}
                                                                    className="text-emerald-400 focus:text-emerald-400"
                                                                >
                                                                    <Zap className="h-3.5 w-3.5" />
                                                                    Activate
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => { setSelectedCampaign(campaign); setPipelineOpen(true); }}>
                                                                <GitBranch className="h-3.5 w-3.5" />
                                                                Build Pipeline
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/employer/campaigns/${campaign.id}`)}>
                                                                <BarChart3 className="h-3.5 w-3.5" />
                                                                View Dashboard
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(campaign)}
                                                                className="text-rose-400 focus:text-rose-400"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile Card List */}
                <div className="md:hidden flex flex-col gap-3">
                    {loading && filteredCampaigns.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : filteredCampaigns.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground text-sm">
                            {statusFilter === 'all'
                                ? 'No campaigns created yet. Create your first campaign to get started!'
                                : `No ${statusFilter} campaigns found.`
                            }
                        </p>
                    ) : (
                        filteredCampaigns.map((campaign) => (
                            <Card key={campaign.id} className="bg-card border-border/60">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-foreground text-sm">{campaign.name}</p>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize text-xs ${getStatusBadgeClass(campaign.status)}`}
                                                >
                                                    {campaign.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {campaign.job?.title || 'N/A'}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                    title="Open campaign actions"
                                                    aria-label="Open campaign actions"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" sideOffset={8} className="w-44">
                                                {campaign.status === 'draft' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleActivate(campaign)}
                                                        className="text-emerald-400 focus:text-emerald-400"
                                                    >
                                                        <Zap className="h-3.5 w-3.5" />
                                                        Activate
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => { setSelectedCampaign(campaign); setPipelineOpen(true); }}>
                                                    <GitBranch className="h-3.5 w-3.5" />
                                                    Build Pipeline
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/employer/campaigns/${campaign.id}`)}>
                                                    <BarChart3 className="h-3.5 w-3.5" />
                                                    View Dashboard
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(campaign)}
                                                    className="text-rose-400 focus:text-rose-400"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDateRange(campaign.start_date, campaign.end_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                <span>{getApplicantCount(campaign.id)} applicants</span>
                                            </div>
                                            <span>·</span>
                                            <span>{campaign.rounds?.length || 0} rounds</span>
                                            <span>·</span>
                                            <span className="capitalize">{campaign.visibility}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                            <h2 className="text-lg font-semibold text-foreground">Delete Campaign</h2>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete this campaign? This action cannot be undone.
                            </p>
                            {deleteTarget.name && (
                                <p className="mt-3 text-sm font-medium text-foreground">{deleteTarget.name}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border/60 bg-card/50">
                            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Campaign
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CampaignCreationModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={(c) => {
                    setCreateModalOpen(false);
                    setSelectedCampaign(c);
                    setPipelineOpen(true);
                    // Re-fetch in THIS component's hook instance (modal has its own instance)
                    if (user?.id) getCampaigns({ employer_id: user.id });
                }}
            />

            <PipelineBuilderModal
                open={pipelineOpen}
                onClose={() => {
                    setPipelineOpen(false);
                    if (user?.id) getCampaigns({ employer_id: user.id });
                }}
                campaign={selectedCampaign}
            />
        </EmployerLayout>
    );
}
