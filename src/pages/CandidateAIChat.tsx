import DashboardLayout from '../layout/DashboardLayout';
import { useMemo, useEffect } from 'react';
import { useApplications, useDashboardStats, useJobs, useProfile, useCampaigns, useCampaignApplications, useCampaignInvitations } from '../hooks/useSupabase';
import GemmaChatPanel from '../components/GemmaChatPanel';
import { useAuth } from '../contexts/AuthContext';

export default function CandidateAIChat() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { jobs } = useJobs();
  const { applications } = useApplications();
  const { stats } = useDashboardStats();
  const { campaigns, getCampaigns } = useCampaigns();
  const { applications: campaignApps, getApplications: getCampaignApps } = useCampaignApplications();
  const { invitations, getInvitations } = useCampaignInvitations();

  useEffect(() => {
    getCampaigns({ status: 'active' });
    if (user?.id) {
      getCampaignApps({ candidate_id: user.id });
      getInvitations({ candidate_id: user.id });
    }
  }, [user?.id]);

  const contextSummary = useMemo(() => {
    const appliedCampaignIds = new Set(campaignApps.map(a => a.campaign_id));
    const invitedCampaignIds = new Set(invitations.map(i => i.campaign_id));

    const payload = {
      role: 'candidate',
      profile: {
        full_name: profile?.full_name,
        headline: profile?.headline,
        skills: profile?.skills || [],
        experience_years: profile?.experience_years || 0,
        location: profile?.location,
        about: profile?.about,
      },
      applications: applications.slice(0, 20).map((app) => ({
        role: app.role,
        company: app.company,
        status: app.status,
        date: app.date,
      })),
      recommended_jobs: jobs.slice(0, 20).map((job) => ({
        role: job.role,
        company: job.company_name,
        location: job.location,
        type: job.type,
        skills: job.skills || [],
        experience_level: job.experience_level,
      })),
      dashboard_stats: stats,
      campaigns: {
        available: campaigns
          .filter(c => c.visibility === 'public' || invitedCampaignIds.has(c.id))
          .slice(0, 15).map((c) => ({
          name: c.name,
          job_title: c.job?.role,
          status: c.status,
          start_date: c.start_date,
          end_date: c.end_date,
          required_skills: c.required_skills || [],
          min_experience: c.min_experience,
          max_experience: c.max_experience,
          min_matching_score: c.min_matching_score,
          rounds: c.rounds?.map(r => ({ name: r.name, type: r.type })) || [],
          already_applied: appliedCampaignIds.has(c.id),
          invited: invitedCampaignIds.has(c.id),
        })),
        my_applications: campaignApps.slice(0, 10).map((a) => ({
          campaign_name: a.campaign?.name,
          status: a.status,
          applied_at: a.applied_at,
          current_round: a.current_round,
        })),
        invitations: invitations.slice(0, 10).map((inv) => ({
          campaign_name: inv.campaign?.name,
          job_title: inv.campaign?.job?.role,
          status: inv.status,
          sent_at: inv.sent_at,
        })),
      },
    };

    return JSON.stringify(payload, null, 2);
  }, [applications, jobs, profile, stats, campaigns, campaignApps, invitations]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-foreground">AI Chat</h1>
          <p className="text-muted-foreground mt-1">Chat with PANI AI for job search guidance and career help.</p>
        </div>

        <GemmaChatPanel role="candidate" userName={profile?.full_name} contextSummary={contextSummary} />
      </div>
    </DashboardLayout>
  );
}
