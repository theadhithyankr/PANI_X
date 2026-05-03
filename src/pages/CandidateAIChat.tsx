import DashboardLayout from '../layout/DashboardLayout';
import { useMemo } from 'react';
import { useApplications, useDashboardStats, useJobs, useProfile } from '../hooks/useSupabase';
import GemmaChatPanel from '../components/GemmaChatPanel';

export default function CandidateAIChat() {
  const { profile } = useProfile();
  const { jobs } = useJobs();
  const { applications } = useApplications();
  const { stats } = useDashboardStats();

  const contextSummary = useMemo(() => {
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
    };

    return JSON.stringify(payload, null, 2);
  }, [applications, jobs, profile, stats]);

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
