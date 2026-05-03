import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { calculateJobMatch } from '../utils/ai';

export interface Job {
    id: string;
    role: string;
    type: string;
    location: string;
    description: string;
    posted_at: string;
    applicants_count: number;
    status: 'Active' | 'Closed';
    experience_level?: string;
    skills?: string[];
    salary_range?: string;
    work_mode?: string;
    openings?: number;
    title?: string; // mapping fallback
    employer_id?: string;
    company_name?: string;
    logo_url?: string;
    blind_hiring?: boolean;
}

export interface Candidate {
    id: string;
    full_name: string;
    role: string;
    headline?: string;
    match_score: number;
    match_details?: { label: string; type: 'success' | 'warning' | 'neutral' }[];
    best_job_title?: string;
    hired_job_title?: string;
    skills: string[];
    location: string;
    experience: number;
    resume_url?: string;
    avatar_url?: string;
    cover_url?: string;
    email?: string;
    bio?: string;
    work_experience?: any[];
    education_history?: any[];
    application_status?: string;
}

export interface Application {
    id: string;
    job_id: string;
    candidate_id: string;
    status: 'pending' | 'reviewed' | 'interview' | 'offer' | 'rejected' | 'accepted';
    date: string;
    role: string;
    company: string;
    logo?: string;
    cover_letter?: string;
    rejection_feedback?: string;
    resume_url?: string;
    job_data?: {
        title: string;
        skills?: string[];
        experience_level?: string;
        location?: string;
        work_mode?: string;
    };
}

export interface Interview {
    id: string;
    name: string;
    role: string;
    time: string;
    type: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    start_time: string;
    end_time: string;
    candidate_id?: string;
    employer_id?: string;
    candidate_email?: string;
}

export interface Experience {
    id: string; // unique id for UI key
    title: string;
    company: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    is_current?: boolean;
}

export interface Education {
    id: string;
    school: string;
    degree: string;
    field?: string;
    start_year?: string;
    end_year?: string;
}

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'candidate' | 'employer';
    // Candidate
    headline?: string;
    location?: string;
    phone?: string;
    about?: string;
    resume_url?: string;
    resume_text?: string;
    skills?: string[];
    experience_years?: number;
    experience?: Experience[];
    education?: Education[];

    // Candidate-only toggles
    open_to_work?: boolean;

    // Media
    avatar_url?: string;
    cover_url?: string;

    // Social links
    github?: string;
    linkedin?: string;

    // Employer
    company_name?: string;
    website?: string;
    logo_url?: string;

    created_at: string;
}

export interface InboxItem {
    id: string;
    type: 'interview' | 'message' | 'test';
    company: string;
    title: string;
    date: string;
    status: string;
    action: string;
    icon: any;
    color: string;
    senderId?: string; // ID of the user to chat with (Employer or Candidate)
    start_time?: string;
    end_time?: string;
}

export interface DashboardStats {
    totalApplications?: number; // Candidate
    interviewsScheduled?: number; // Candidate
    profileViews?: number; // Candidate
    activeJobs?: number; // Employer
    totalApplicants?: number; // Employer
    interviewsToday?: number; // Employer
    pipeline?: { applied: number; screening: number; interview: number; offer: number }; // Employer
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    sender_name?: string; // For UI convenience
}

export function useJobs(options?: { activeOnly?: boolean }) {
    const activeOnly = options?.activeOnly ?? false;
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        setLoading(true);
        let query = supabase
            .from('jobs')
            .select(`
                *,
                profiles!jobs_employer_id_fkey (
                    company_name,
                    logo_url
                )
            `)
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching jobs:', error);
        } else {
            const mappedJobs: Job[] = data.map((job: any) => ({
                id: job.id,
                role: job.title,
                type: job.type || 'Full Time',
                location: job.location,
                description: job.description,
                posted_at: new Date(job.created_at).toLocaleDateString(),
                applicants_count: job.applicants || 0,
                status: job.is_active ? 'Active' : 'Closed',
                experience_level: job.experience_level,
                skills: job.skills,
                salary_range: job.salary_range,
                work_mode: job.work_mode,
                openings: job.openings,
                title: job.title,
                employer_id: job.employer_id,
                company_name: job.profiles?.company_name || 'Tech Corp',
                logo_url: job.profiles?.logo_url
            }));
            setJobs(mappedJobs);
        }
        setLoading(false);
    };

    const createJob = async (job: any) => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { error } = await supabase.from('jobs').insert({
            employer_id: userData.user.id,
            title: job.title,
            description: job.description,
            location: job.location,
            type: job.type,
            experience_level: job.experience_level,
            skills: job.skills,
            salary_range: job.salary_range,
            work_mode: job.work_mode,
            openings: job.openings,
            status: 'Active',
            is_active: true,
            applicants: 0
        });

        if (error) throw error;
        fetchJobs();
    };

    const updateJob = async (id: string, updates: Partial<Job>) => {
        const { error } = await supabase
            .from('jobs')
            .update({
                title: updates.title,
                description: updates.description,
                location: updates.location,
                type: updates.type,
                experience_level: updates.experience_level,
                skills: updates.skills,
                salary_range: updates.salary_range,
                work_mode: updates.work_mode,
                openings: updates.openings,
                is_active: updates.status === 'Active'
            })
            .eq('id', id);

        if (error) throw error;
        fetchJobs();
    };

    const deleteJob = async (id: string) => {
        // Try hard delete first
        const { data, error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id)
            .select('id');

        if (error) {
            // If hard delete fails (e.g. RLS policy missing), fall back to soft delete
            const { error: softError } = await supabase
                .from('jobs')
                .update({ is_active: false })
                .eq('id', id);
            if (softError) throw softError;
        } else if (!data || data.length === 0) {
            // Hard delete returned no rows (RLS silently blocked) — soft delete instead
            const { error: softError } = await supabase
                .from('jobs')
                .update({ is_active: false })
                .eq('id', id);
            if (softError) throw softError;
        }
        fetchJobs();
    };

    useEffect(() => {
        fetchJobs();
        const channel = supabase
            .channel('realtime-jobs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
                fetchJobs();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return { jobs, loading, createJob, updateJob, deleteJob, fetchJobs };
}

export function useCandidates() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCandidates = async () => {
        setLoading(true);

        // Fetch employer's own jobs to calculate real match scores
        const { data: { user } } = await supabase.auth.getUser();
        const { data: jobsData } = user
            ? await supabase.from('jobs').select('*').eq('employer_id', user.id).eq('is_active', true)
            : { data: [] };

        const { data: appsData } = user
            ? await supabase.from('applications').select('candidate_id, status, jobs!inner(employer_id, title)').eq('jobs.employer_id', user.id)
            : { data: [] };

        const appStatusMap = new Map<string, string>();
        const hiredJobMap = new Map<string, string>();
        if (appsData) {
            const statusPriority: Record<string, number> = {
                'pending': 1, 'reviewed': 2, 'interview': 3, 'offer': 4, 'accepted': 5, 'rejected': 0
            };
            appsData.forEach((app: any) => {
                const currentStatus = appStatusMap.get(app.candidate_id);
                if (!currentStatus || (statusPriority[app.status] || 0) > (statusPriority[currentStatus] || 0)) {
                    appStatusMap.set(app.candidate_id, app.status);
                }
                if (app.status === 'accepted' && app.jobs?.title) {
                    hiredJobMap.set(app.candidate_id, app.jobs.title);
                }
            });
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'candidate')
            .or('open_to_work.is.null,open_to_work.eq.true');

        if (error) {
            console.error('Error fetching candidates:', error);
        } else {
            const mappedCandidates: Candidate[] = data.map((p: any) => {
                let bestScore = 0;
                let bestDetails: { label: string; type: 'success' | 'warning' | 'neutral' }[] = [];
                let bestJobTitle: string | undefined;
                if (jobsData && jobsData.length > 0) {
                    const results = jobsData.map((job: any) => ({ job, ...calculateJobMatch(job, p) }));
                    const best = results.reduce((a: any, b: any) => b.score > a.score ? b : a, results[0]);
                    bestScore = Math.round(best.score);
                    bestDetails = best.details || [];
                    bestJobTitle = best.job?.title;
                }
                return {
                    id: p.id,
                    full_name: p.full_name || 'Unknown',
                    role: p.headline || p.title || 'Software Engineer',
                    headline: p.headline || p.title,
                    match_score: bestScore,
                    match_details: bestDetails,
                    best_job_title: bestJobTitle,
                    skills: p.skills || [],
                    location: p.location || 'Remote',
                    experience: p.experience_years || 0,
                    resume_url: p.resume_url,
                    avatar_url: p.avatar_url,
                    cover_url: p.cover_url,
                    email: p.email,
                    bio: p.bio || p.summary,
                    work_experience: p.work_experience || [],
                    education_history: p.education || p.education_history || [],
                    application_status: appStatusMap.get(p.id),
                    hired_job_title: hiredJobMap.get(p.id),
                };
            })
            // Sort by best match descending
            .sort((a: Candidate, b: Candidate) => b.match_score - a.match_score);
            setCandidates(mappedCandidates);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCandidates();
        const channel = supabase
            .channel('realtime-candidates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchCandidates();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return { candidates, loading, fetchCandidates };
}

export function useApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        setLoading(true);
        // Fetch applications for the current user (candidate)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('applications')
            .select(`
                *,
                jobs (
                    title,
                    skills,
                    experience_level,
                    location,
                    work_mode,
                    employer_id,
                    profiles (
                        company_name
                    )
                )
            `)
            .eq('candidate_id', user.id);

        if (error) {
            console.error('Error fetching applications:', error);
        } else {
            const mappedApps: Application[] = data.map((app: any) => ({
                id: app.id,
                job_id: app.job_id,
                candidate_id: app.candidate_id,
                status: app.status || 'pending',
                date: new Date(app.created_at).toLocaleDateString(),
                role: app.jobs?.title || 'Unknown Role',
                company: app.jobs?.profiles?.company_name || 'Unknown Company',
                cover_letter: app.cover_letter,
                rejection_feedback: app.rejection_feedback,
                job_data: app.jobs ? {
                    title: app.jobs.title,
                    skills: app.jobs.skills,
                    experience_level: app.jobs.experience_level,
                    location: app.jobs.location,
                    work_mode: app.jobs.work_mode,
                } : undefined,
            }));
            setApplications(mappedApps);
        }
        setLoading(false);
    };

    const applyToJob = async (jobId: string, candidateId: string, coverLetter?: string) => {
        const { error } = await supabase.from('applications').insert({
            job_id: jobId,
            candidate_id: candidateId,
            status: 'pending',
            cover_letter: coverLetter
        });
        if (error) throw error;
        fetchApplications();
    };

    const updateApplicationStatus = async (id: string, status: string, feedback?: string) => {
        const updates: any = { status };
        if (feedback) updates.rejection_feedback = feedback;

        const { error } = await supabase
            .from('applications')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        fetchApplications();
    };

    useEffect(() => {
        fetchApplications();
        const channel = supabase
            .channel('realtime-applications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
                fetchApplications();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return { applications, loading, fetchApplications, applyToJob, updateApplicationStatus };
}

export function useInterviews() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInterviews = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch interviews where user is employer OR candidate
        const { data, error } = await supabase
            .from('interviews')
            .select(`
                *,
                profiles!interviews_candidate_id_fkey (full_name, email),
                applications (
                    jobs (title)
                )
            `)
            .or(`employer_id.eq.${user.id},candidate_id.eq.${user.id}`)
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching interviews:', error);
        } else {
            const mappedInterviews: Interview[] = data.map((inv: any) => ({
                id: inv.id,
                name: inv.profiles?.full_name || 'Candidate', // Name of candidate
                role: inv.applications?.jobs?.title || 'Role',
                time: new Date(inv.start_time).toLocaleString(),
                type: inv.type,
                status: inv.status,
                start_time: inv.start_time,
                end_time: inv.end_time,
                candidate_id: inv.candidate_id,
                employer_id: inv.employer_id,
                candidate_email: inv.profiles?.email
            }));
            setInterviews(mappedInterviews);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInterviews();
        const channel = supabase
            .channel('realtime-interviews')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, () => {
                fetchInterviews();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const scheduleInterview = async (applicationId: string, employerId: string, candidateId: string, startTime: string, endTime: string, type: string = 'video') => {
        const { error } = await supabase.from('interviews').insert({
            application_id: applicationId,
            employer_id: employerId,
            candidate_id: candidateId,
            start_time: startTime,
            end_time: endTime,
            type: type,
            status: 'scheduled'
        });

        if (error) throw error;

        // Also update application status to 'interview'
        await supabase
            .from('applications')
            .update({ status: 'interview' })
            .eq('id', applicationId);

        fetchInterviews();
    };

    const updateInterview = async (id: string, updates: any) => {
        const { error } = await supabase.from('interviews').update(updates).eq('id', id);
        if (error) throw error;
        fetchInterviews();
    };

    const deleteInterview = async (id: string) => {
        const { error } = await supabase.from('interviews').delete().eq('id', id);
        if (error) throw error;
        fetchInterviews();
    };

    return { interviews, loading, fetchInterviews, scheduleInterview, updateInterview, deleteInterview };
}

export function useInbox() {
    const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInbox = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Interviews (as 'interview' type)
        const { data: interviews } = await supabase
            .from('interviews')
            .select(`
                *,
                profiles!interviews_employer_id_fkey (company_name),
                applications (jobs (title))
            `)
            .eq('candidate_id', user.id)
            .eq('status', 'scheduled');

        // 2. Fetch Application Updates (as 'message' type) - e.g. status changed from pending
        const { data: applications } = await supabase
            .from('applications')
            .select(`
                *,
                jobs (title, employer_id, profiles (company_name))
            `)
            .eq('candidate_id', user.id)
            .neq('status', 'pending'); // Only show if status has changed

        // 3. Fetch Direct Messages (Unread or recent)
        const { data: directMessages } = await supabase
            .from('messages')
            .select(`
                *,
                profiles!messages_sender_id_fkey (full_name, company_name)
            `)
            .eq('receiver_id', user.id)
            .order('created_at', { ascending: false });

        const items: InboxItem[] = [];

        if (interviews) {
            interviews.forEach((inv: any) => {
                items.push({
                    id: `inv-${inv.id}`,
                    type: 'interview',
                    company: inv.profiles?.company_name || 'Unknown',
                    title: `Interview for ${inv.applications?.jobs?.title}`,
                    date: new Date(inv.start_time).toLocaleString(),
                    status: 'Scheduled',
                    action: 'Join Meeting',
                    icon: null, // Component will handle
                    color: 'primary',
                    senderId: inv.employer_id,
                    start_time: inv.start_time,
                    end_time: inv.end_time
                });
            });
        }

        if (applications) {
            applications.forEach((app: any) => {
                items.push({
                    id: `app-${app.id}`,
                    type: 'message',
                    company: app.jobs?.profiles?.company_name || 'Unknown',
                    title: `Application Status: ${app.status.toUpperCase()}`,
                    date: new Date(app.created_at).toLocaleDateString(), // Ideally updated_at but created_at is fine for now
                    status: 'Unread', // Check if we have read/unread logic later
                    action: 'View Details',
                    icon: null,
                    color: 'info',
                    senderId: app.jobs?.employer_id
                });
            });
        }

        if (directMessages) {
            // Deduplicate by sender to show "threads" or just show all. 
            // Simple: Show all unread, or latest from unique senders.
            // Let's show all for now to be safe and visible.
            directMessages.forEach((msg: any) => {
                items.push({
                    id: `msg-${msg.id}`,
                    type: 'message',
                    company: msg.profiles?.company_name || msg.profiles?.full_name || 'Unknown',
                    title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
                    date: new Date(msg.created_at).toLocaleDateString(),
                    status: msg.is_read ? 'Read' : 'Unread',
                    action: 'Message', // This triggers the chat action in Inbox.tsx
                    icon: null,
                    color: 'success',
                    senderId: msg.sender_id
                });
            });
        }

        setInboxItems(items);
        setLoading(false);
    };

    useEffect(() => {
        fetchInbox();
        // Listen to all relevant tables for inbox updates
        const channel = supabase
            .channel('realtime-inbox')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, () => {
                fetchInbox();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
                fetchInbox();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                fetchInbox();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return { inboxItems, loading, fetchInbox };
}

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({});
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Determine role via Profile call or assuming separate components handle logic, 
        // asking database for both sets of stats is fine, most will be 0/null if not applicable.
        // Actually better to check role first.
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        const newStats: DashboardStats = {};

        if (profile?.role === 'candidate') {
            const { count: appCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('candidate_id', user.id);

            const { count: invCount } = await supabase
                .from('interviews')
                .select('*', { count: 'exact', head: true })
                .eq('candidate_id', user.id);

            // Mock profile views for now
            newStats.totalApplications = appCount || 0;
            newStats.interviewsScheduled = invCount || 0;
            newStats.profileViews = 14;
        } else {
            // Employer
            const { count: jobCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .eq('employer_id', user.id)
                .eq('is_active', true);

            // Access applicants slightly indirectly via jobs, or direct join query
            // Simplest: Get all my jobs, then count applications for them
            // Supabase simpler query: join applications with jobs filter
            const { count: applicantCount } = await supabase
                .from('applications')
                .select('id, jobs!inner(employer_id)', { count: 'exact', head: true })
                .eq('jobs.employer_id', user.id);

            const { count: invCount } = await supabase
                .from('interviews')
                .select('*', { count: 'exact', head: true })
                .eq('employer_id', user.id); // Valid for today filter would be better but simple count for now

            // Fetch application counts grouped by status for the pipeline
            const { data: statusRows } = await supabase
                .from('applications')
                .select('status, jobs!inner(employer_id)')
                .eq('jobs.employer_id', user.id);

            const counts = (statusRows || []).reduce((acc: Record<string, number>, row: any) => {
                acc[row.status] = (acc[row.status] || 0) + 1;
                return acc;
            }, {});

            newStats.activeJobs = jobCount || 0;
            newStats.totalApplicants = applicantCount || 0;
            newStats.interviewsToday = invCount || 0;
            newStats.pipeline = {
                applied: (counts['pending'] || 0) + (counts['reviewed'] || 0) + (counts['interview'] || 0) + (counts['offer'] || 0) + (counts['accepted'] || 0) + (counts['rejected'] || 0),
                screening: counts['reviewed'] || 0,
                interview: counts['interview'] || 0,
                offer: (counts['offer'] || 0) + (counts['accepted'] || 0),
            };
        }

        setStats(newStats);
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
        // Refresh stats when applications, jobs, or interviews change
        const channel = supabase
            .channel('realtime-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
                fetchStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
                fetchStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, () => {
                fetchStats();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    return { stats, loading, fetchStats };
}

// Module-level cache — shared across all useProfile() instances in the same session.
// Prevents the sidebar from flashing fallback content on every mount.
let _profileCache: Profile | null = null;

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(_profileCache);
    const [loading, setLoading] = useState(_profileCache === null);

    const fetchProfile = async () => {
        if (_profileCache === null) setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
        } else {
            _profileCache = data;
            setProfile(data);
        }
        setLoading(false);
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;
        await fetchProfile();
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return { profile, loading, updateProfile, fetchProfile };
}

export function useMessages() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Fetch and map messages
    const loadMessages = async (uid: string, otherId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${uid},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${uid})`)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data.map((msg: any) => ({
                id: msg.id,
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                content: msg.content,
                created_at: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                is_read: msg.is_read
            })));
        }
        setLoading(false);
    };

    const fetchMessages = async (otherId: string) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);
        await loadMessages(user.id, otherId);

        // Subscribe to real-time new messages
        const channel = supabase
            .channel(`messages:${[user.id, otherId].sort().join('-')}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                loadMessages(user.id, otherId);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    };

    const sendMessage = async (receiverId: string, content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content
        });
        if (error) throw error;
        if (currentUserId) await loadMessages(currentUserId, receiverId);
    };

    return { messages, loading, fetchMessages, sendMessage };
}
