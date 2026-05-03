import EmployerLayout from '../../components/employer/EmployerLayout';
import { useMemo } from 'react';
import { useCandidates, useDashboardStats, useJobs, useProfile } from '../../hooks/useSupabase';
import GemmaChatPanel from '../../components/GemmaChatPanel';

export default function EmployerAIChat() {
  const { profile } = useProfile();
  const { jobs } = useJobs({ activeOnly: false });
  const { candidates } = useCandidates();
  const { stats } = useDashboardStats();

  const contextSummary = useMemo(() => {
    const employerJobs = jobs.filter((job) => job.employer_id === profile?.id);

    const payload = {
      role: 'employer',
      profile: {
        full_name: profile?.full_name,
        company_name: profile?.company_name,
        email: profile?.email,
        website: profile?.website,
      },
      jobs: employerJobs.slice(0, 25).map((job) => ({
        role: job.role,
        location: job.location,
        status: job.status,
        type: job.type,
        applicants_count: job.applicants_count,
        skills: job.skills || [],
        experience_level: job.experience_level,
      })),
      top_candidates: candidates.slice(0, 25).map((candidate) => ({
        full_name: candidate.full_name,
        role: candidate.role,
        skills: candidate.skills || [],
        experience: candidate.experience,
        location: candidate.location,
        match_score: candidate.match_score,
      })),
      dashboard_stats: stats,
    };

    return JSON.stringify(payload, null, 2);
  }, [candidates, jobs, profile, stats]);

  return (
    <EmployerLayout>
      <div className="flex flex-col gap-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-foreground">AI Chat</h1>
          <p className="text-muted-foreground mt-1">Chat with PANI AI for hiring strategy and recruitment support.</p>
        </div>

        <GemmaChatPanel
          role="employer"
          userName={profile?.full_name || profile?.company_name}
          contextSummary={contextSummary}
        />
      </div>
    </EmployerLayout>
  );
}
