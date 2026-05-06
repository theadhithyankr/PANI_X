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
    role: 'candidate' | 'employer' | 'admin';
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
    isRead: boolean;
    action: string;
    icon: any;
    color: string;
    senderId?: string;
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
                    // Only trust experience_years when actual work history entries exist
                    experience: (Array.isArray(p.experience) && p.experience.length > 0) || (Array.isArray(p.work_experience) && p.work_experience.length > 0)
                        ? (p.experience_years || 0)
                        : 0,
                    resume_url: p.resume_url,
                    avatar_url: p.avatar_url,
                    cover_url: p.cover_url,
                    email: p.email,
                    bio: p.about || p.bio || p.summary,
                    work_experience: p.experience || p.work_experience || [],
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
    const [unreadCount, setUnreadCount] = useState(0);
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
            .eq('status', 'scheduled')
            .neq('candidate_dismissed', true);

        // 2. Fetch Application Updates (as 'message' type) - e.g. status changed from pending
        const { data: applications } = await supabase
            .from('applications')
            .select(`
                *,
                jobs (title, employer_id, profiles (company_name))
            `)
            .eq('candidate_id', user.id)
            .neq('status', 'pending')
            .neq('candidate_dismissed', true);

        // 3. Fetch Direct Messages (Unread or recent)
        const { data: directMessages } = await supabase
            .from('messages')
            .select(`
                *,
                profiles!messages_sender_id_fkey (full_name, company_name)
            `)
            .eq('receiver_id', user.id)
            .neq('candidate_dismissed', true)
            .order('created_at', { ascending: false });

        const items: InboxItem[] = [];
        let unread = 0;

        if (interviews) {
            interviews.forEach((inv: any) => {
                const isRead = inv.is_viewed ?? false;
                items.push({
                    id: `inv-${inv.id}`,
                    type: 'interview',
                    company: inv.profiles?.company_name || 'Unknown',
                    title: `Interview for ${inv.applications?.jobs?.title}`,
                    date: new Date(inv.start_time).toLocaleString(),
                    status: 'Scheduled',
                    isRead,
                    action: 'Join Meeting',
                    icon: null,
                    color: 'primary',
                    senderId: inv.employer_id,
                    start_time: inv.start_time,
                    end_time: inv.end_time
                });
                if (!isRead) unread++;
            });
        }

        if (applications) {
            applications.forEach((app: any) => {
                const isRead = app.is_viewed ?? false;
                items.push({
                    id: `app-${app.id}`,
                    type: 'message',
                    company: app.jobs?.profiles?.company_name || 'Unknown',
                    title: `Application Status: ${app.status.toUpperCase()}`,
                    date: new Date(app.created_at).toLocaleDateString(),
                    status: isRead ? 'Read' : 'Unread',
                    isRead,
                    action: 'View Details',
                    icon: null,
                    color: 'info',
                    senderId: app.jobs?.employer_id
                });
                if (!isRead) unread++;
            });
        }

        if (directMessages) {
            directMessages.forEach((msg: any) => {
                const isRead = msg.is_read ?? false;
                items.push({
                    id: `msg-${msg.id}`,
                    type: 'message',
                    company: msg.profiles?.company_name || msg.profiles?.full_name || 'Unknown',
                    title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
                    date: new Date(msg.created_at).toLocaleDateString(),
                    status: isRead ? 'Read' : 'Unread',
                    isRead,
                    action: 'Message',
                    icon: null,
                    color: 'success',
                    senderId: msg.sender_id
                });
                if (!isRead) unread++;
            });
        }

        setInboxItems(items);
        setUnreadCount(unread);
        setLoading(false);
    };

    const markApplicationAsViewed = async (applicationId: string) => {
        const { error } = await supabase
            .from('applications')
            .update({ is_viewed: true })
            .eq('id', applicationId);

        if (error) console.error('Error marking application as viewed:', error);
        else fetchInbox();
    };

    const markDirectMessagesAsRead = async (senderId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', senderId)
            .eq('is_read', false);
        fetchInbox();
    };

    const toggleItemRead = async (item: InboxItem, read: boolean) => {
        if (item.id.startsWith('inv-')) {
            await supabase.from('interviews').update({ is_viewed: read }).eq('id', item.id.replace('inv-', ''));
        } else if (item.id.startsWith('msg-')) {
            await supabase.from('messages').update({ is_read: read }).eq('id', item.id.replace('msg-', ''));
        } else if (item.id.startsWith('app-')) {
            await supabase.from('applications').update({ is_viewed: read }).eq('id', item.id.replace('app-', ''));
        }
        fetchInbox();
    };

    const deleteItem = async (item: InboxItem) => {
        if (item.id.startsWith('inv-')) {
            await supabase.from('interviews').update({ candidate_dismissed: true }).eq('id', item.id.replace('inv-', ''));
        } else if (item.id.startsWith('msg-')) {
            await supabase.from('messages').update({ candidate_dismissed: true }).eq('id', item.id.replace('msg-', ''));
        } else if (item.id.startsWith('app-')) {
            await supabase.from('applications').update({ candidate_dismissed: true }).eq('id', item.id.replace('app-', ''));
        }
        fetchInbox();
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

    return { inboxItems, unreadCount, loading, fetchInbox, markApplicationAsViewed, markDirectMessagesAsRead, toggleItemRead, deleteItem };
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

            const { data: profileData } = await supabase
                .from('profiles')
                .select('profile_views')
                .eq('id', user.id)
                .single();

            newStats.totalApplications = appCount || 0;
            newStats.interviewsScheduled = invCount || 0;
            newStats.profileViews = profileData?.profile_views || 0;
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

        // Mark all messages from the other user as read
        await markMessagesAsRead(user.id, otherId);

        // Subscribe to real-time new messages
        const channel = supabase
            .channel(`messages:${[user.id, otherId].sort().join('-')}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
                loadMessages(user.id, otherId);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    };

    const markMessagesAsRead = async (userId: string, senderId: string) => {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', userId)
            .eq('sender_id', senderId)
            .eq('is_read', false);

        if (error) console.error('Error marking messages as read:', error);
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

    return { messages, loading, fetchMessages, sendMessage, markMessagesAsRead };
}

export interface Campaign {
    id: string;
    employer_id: string;
    job_id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'completed';
    visibility: 'public' | 'invite-only';
    min_matching_score?: number;
    required_skills?: any[];
    min_experience?: number;
    max_experience?: number;
    education_requirements?: any[];
    created_at: string;
    updated_at: string;
    // Joined data
    job?: Job;
    rounds?: CampaignRound[];
}

export interface CampaignRound {
    id: string;
    campaign_id: string;
    round_number: number;
    name: string;
    type: 'aptitude test' | 'technical assessment' | 'HR interview' | 'technical interview' | 'group discussion';
    scheduled_date: string;
    min_passing_score?: number;
    created_at: string;
}

export interface CampaignFilters {
    status?: 'draft' | 'active' | 'completed';
    visibility?: 'public' | 'invite-only';
    employer_id?: string;
}

export function useCampaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * Fetch campaigns with optional filters
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4
     */
    const getCampaigns = async (filters?: CampaignFilters) => {
        setLoading(true);

        let query = supabase
            .from('hiring_campaigns')
            .select(`
                *,
                jobs (
                    id,
                    title,
                    description,
                    location,
                    type,
                    experience_level,
                    skills,
                    salary_range,
                    work_mode,
                    openings,
                    is_active,
                    created_at
                ),
                campaign_rounds (
                    id,
                    campaign_id,
                    round_number,
                    name,
                    type,
                    scheduled_date,
                    min_passing_score,
                    created_at
                )
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.visibility) {
            query = query.eq('visibility', filters.visibility);
        }
        if (filters?.employer_id) {
            query = query.eq('employer_id', filters.employer_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching campaigns:', error);
            setLoading(false);
            throw error;
        }

        const mappedCampaigns: Campaign[] = data.map((campaign: any) => ({
            id: campaign.id,
            employer_id: campaign.employer_id,
            job_id: campaign.job_id,
            name: campaign.name,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
            status: campaign.status,
            visibility: campaign.visibility,
            min_matching_score: campaign.min_matching_score,
            required_skills: campaign.required_skills,
            min_experience: campaign.min_experience,
            max_experience: campaign.max_experience,
            education_requirements: campaign.education_requirements,
            created_at: campaign.created_at,
            updated_at: campaign.updated_at,
            job: campaign.jobs ? {
                id: campaign.jobs.id,
                role: campaign.jobs.title,
                title: campaign.jobs.title,
                type: campaign.jobs.type || 'Full Time',
                location: campaign.jobs.location,
                description: campaign.jobs.description,
                posted_at: new Date(campaign.jobs.created_at).toLocaleDateString(),
                applicants_count: 0,
                status: campaign.jobs.is_active ? 'Active' : 'Closed',
                experience_level: campaign.jobs.experience_level,
                skills: campaign.jobs.skills,
                salary_range: campaign.jobs.salary_range,
                work_mode: campaign.jobs.work_mode,
                openings: campaign.jobs.openings,
            } : undefined,
            rounds: campaign.campaign_rounds ? campaign.campaign_rounds
                .sort((a: any, b: any) => a.round_number - b.round_number)
                .map((round: any) => ({
                    id: round.id,
                    campaign_id: round.campaign_id,
                    round_number: round.round_number,
                    name: round.name,
                    type: round.type,
                    scheduled_date: round.scheduled_date,
                    min_passing_score: round.min_passing_score,
                    created_at: round.created_at,
                })) : [],
        }));

        setCampaigns(mappedCampaigns);
        setLoading(false);
        return mappedCampaigns;
    };

    /**
     * Fetch single campaign by ID with rounds
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4
     */
    const getCampaignById = async (id: string): Promise<Campaign | null> => {
        const { data, error } = await supabase
            .from('hiring_campaigns')
            .select(`
                *,
                jobs (
                    id,
                    title,
                    description,
                    location,
                    type,
                    experience_level,
                    skills,
                    salary_range,
                    work_mode,
                    openings,
                    is_active,
                    created_at
                ),
                campaign_rounds (
                    id,
                    campaign_id,
                    round_number,
                    name,
                    type,
                    scheduled_date,
                    min_passing_score,
                    created_at
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching campaign:', error);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            employer_id: data.employer_id,
            job_id: data.job_id,
            name: data.name,
            start_date: data.start_date,
            end_date: data.end_date,
            status: data.status,
            visibility: data.visibility,
            min_matching_score: data.min_matching_score,
            required_skills: data.required_skills,
            min_experience: data.min_experience,
            max_experience: data.max_experience,
            education_requirements: data.education_requirements,
            created_at: data.created_at,
            updated_at: data.updated_at,
            job: data.jobs ? {
                id: data.jobs.id,
                role: data.jobs.title,
                title: data.jobs.title,
                type: data.jobs.type || 'Full Time',
                location: data.jobs.location,
                description: data.jobs.description,
                posted_at: new Date(data.jobs.created_at).toLocaleDateString(),
                applicants_count: 0,
                status: data.jobs.is_active ? 'Active' : 'Closed',
                experience_level: data.jobs.experience_level,
                skills: data.jobs.skills,
                salary_range: data.jobs.salary_range,
                work_mode: data.jobs.work_mode,
                openings: data.jobs.openings,
            } : undefined,
            rounds: data.campaign_rounds ? data.campaign_rounds
                .sort((a: any, b: any) => a.round_number - b.round_number)
                .map((round: any) => ({
                    id: round.id,
                    campaign_id: round.campaign_id,
                    round_number: round.round_number,
                    name: round.name,
                    type: round.type,
                    scheduled_date: round.scheduled_date,
                    min_passing_score: round.min_passing_score,
                    created_at: round.created_at,
                })) : [],
        };
    };

    /**
     * Create new campaign with validation
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.8
     */
    const createCampaign = async (data: {
        job_id: string;
        name: string;
        start_date: string;
        end_date: string;
        visibility?: 'public' | 'invite-only';
        min_matching_score?: number;
        required_skills?: any[];
        min_experience?: number;
        max_experience?: number;
        education_requirements?: any[];
    }) => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('User not authenticated');

        // Validate date range (Requirement 1.2)
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }

        // Validate min_matching_score range (Requirement 1.4)
        if (data.min_matching_score !== undefined &&
            (data.min_matching_score < 0 || data.min_matching_score > 100)) {
            throw new Error('Minimum matching score must be between 0 and 100');
        }

        const { data: campaign, error } = await supabase
            .from('hiring_campaigns')
            .insert({
                employer_id: userData.user.id,
                job_id: data.job_id,
                name: data.name,
                start_date: data.start_date,
                end_date: data.end_date,
                status: 'draft', // Requirement 1.4: initial status is draft
                visibility: data.visibility || 'public', // Requirement 1.8
                min_matching_score: data.min_matching_score || 0,
                required_skills: data.required_skills || [],
                min_experience: data.min_experience || 0,
                max_experience: data.max_experience,
                education_requirements: data.education_requirements || [],
            })
            .select()
            .single();

        if (error) throw error;

        await getCampaigns({ employer_id: userData.user.id });
        return campaign;
    };

    /**
     * Update campaign with status-based restrictions
     * Validates: Requirements 1.8, 1.9
     */
    const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
        // Fetch current campaign to check status
        const { data: currentCampaign, error: fetchError } = await supabase
            .from('hiring_campaigns')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Requirement 1.9: Prevent modification of critical fields when active or completed
        if (currentCampaign.status === 'active' || currentCampaign.status === 'completed') {
            // Remove restricted fields from updates
            const { start_date, end_date, ...allowedUpdates } = updates;

            if (start_date || end_date) {
                throw new Error('Cannot modify start date, end date, or pipeline structure when campaign is active or completed');
            }

            const { error } = await supabase
                .from('hiring_campaigns')
                .update(allowedUpdates)
                .eq('id', id);

            if (error) throw error;
        } else {
            // Draft status: allow all updates (Requirement 1.8)
            // Validate date range if dates are being updated
            if (updates.start_date && updates.end_date) {
                const startDate = new Date(updates.start_date);
                const endDate = new Date(updates.end_date);
                if (endDate <= startDate) {
                    throw new Error('End date must be after start date');
                }
            }

            const { error } = await supabase
                .from('hiring_campaigns')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
            await getCampaigns({ employer_id: userData.user.id });
        }
    };

    /**
     * Soft delete campaign
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4
     */
    const deleteCampaign = async (id: string) => {
        // Soft delete by setting status to completed
        const { error } = await supabase
            .from('hiring_campaigns')
            .update({ status: 'completed' })
            .eq('id', id);

        if (error) throw error;

        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
            await getCampaigns({ employer_id: userData.user.id });
        }
    };

    useEffect(() => {
        // Initial fetch
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                getCampaigns({ employer_id: data.user.id });
            }
        });

        // Real-time subscription for campaign updates
        const channel = supabase
            .channel('realtime-campaigns')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'hiring_campaigns' }, () => {
                supabase.auth.getUser().then(({ data }) => {
                    if (data.user) {
                        getCampaigns({ employer_id: data.user.id });
                    }
                });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_rounds' }, () => {
                supabase.auth.getUser().then(({ data }) => {
                    if (data.user) {
                        getCampaigns({ employer_id: data.user.id });
                    }
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return {
        campaigns,
        loading,
        getCampaigns,
        getCampaignById,
        createCampaign,
        updateCampaign,
        deleteCampaign
    };
}

/**
 * Hook for managing campaign rounds (pipeline stages)
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
export function useCampaignRounds() {
    const [rounds, setRounds] = useState<CampaignRound[]>([]);
    const [loading, setLoading] = useState(false);

    /**
     * Fetch all rounds for a campaign
     * Validates: Requirements 3.2
     */
    const getRounds = async (campaignId: string): Promise<CampaignRound[]> => {
        setLoading(true);

        const { data, error } = await supabase
            .from('campaign_rounds')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('round_number', { ascending: true });

        if (error) {
            console.error('Error fetching rounds:', error);
            setLoading(false);
            throw error;
        }

        const mappedRounds: CampaignRound[] = data.map((round: any) => ({
            id: round.id,
            campaign_id: round.campaign_id,
            round_number: round.round_number,
            name: round.name,
            type: round.type,
            scheduled_date: round.scheduled_date,
            min_passing_score: round.min_passing_score,
            created_at: round.created_at,
        }));

        setRounds(mappedRounds);
        setLoading(false);
        return mappedRounds;
    };

    /**
     * Create a new round with date validation
     * Validates: Requirements 3.2, 3.6, 3.7
     */
    const createRound = async (campaignId: string, data: {
        name: string;
        type: 'aptitude test' | 'technical assessment' | 'HR interview' | 'technical interview' | 'group discussion';
        scheduled_date: string;
        min_passing_score?: number;
    }) => {
        // Fetch campaign to validate dates
        const { data: campaign, error: campaignError } = await supabase
            .from('hiring_campaigns')
            .select('start_date, end_date, status')
            .eq('id', campaignId)
            .single();

        if (campaignError) throw campaignError;

        // Requirement 3.7: Round dates must fall within campaign dates
        const roundDate = new Date(data.scheduled_date);
        const campaignStart = new Date(campaign.start_date);
        const campaignEnd = new Date(campaign.end_date);

        if (roundDate < campaignStart || roundDate > campaignEnd) {
            throw new Error('Round date must be between campaign start date and end date');
        }

        // Fetch existing rounds to determine round_number and validate sequential dates
        const { data: existingRounds, error: roundsError } = await supabase
            .from('campaign_rounds')
            .select('round_number, scheduled_date')
            .eq('campaign_id', campaignId)
            .order('round_number', { ascending: true });

        if (roundsError) throw roundsError;

        // Calculate next round number
        const nextRoundNumber = existingRounds.length > 0
            ? Math.max(...existingRounds.map((r: any) => r.round_number)) + 1
            : 1;

        // Requirement 3.6: Validate sequential dates
        if (existingRounds.length > 0) {
            const lastRound = existingRounds[existingRounds.length - 1];
            const lastRoundDate = new Date(lastRound.scheduled_date);
            if (roundDate <= lastRoundDate) {
                throw new Error('Round dates must be sequential. New round date must be after the last round date.');
            }
        }

        // Validate min_passing_score range
        if (data.min_passing_score !== undefined &&
            (data.min_passing_score < 0 || data.min_passing_score > 100)) {
            throw new Error('Minimum passing score must be between 0 and 100');
        }

        const { data: newRound, error } = await supabase
            .from('campaign_rounds')
            .insert({
                campaign_id: campaignId,
                round_number: nextRoundNumber,
                name: data.name,
                type: data.type,
                scheduled_date: data.scheduled_date,
                min_passing_score: data.min_passing_score || 0,
            })
            .select()
            .single();

        if (error) throw error;

        await getRounds(campaignId);
        return newRound;
    };

    /**
     * Update round details
     * Validates: Requirements 3.4, 3.6, 3.7
     */
    const updateRound = async (id: string, updates: Partial<CampaignRound>) => {
        // Fetch the round to get campaign_id
        const { data: round, error: fetchError } = await supabase
            .from('campaign_rounds')
            .select('campaign_id, round_number')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // If updating scheduled_date, validate it
        if (updates.scheduled_date) {
            // Fetch campaign dates
            const { data: campaign, error: campaignError } = await supabase
                .from('hiring_campaigns')
                .select('start_date, end_date')
                .eq('id', round.campaign_id)
                .single();

            if (campaignError) throw campaignError;

            // Requirement 3.7: Round dates must fall within campaign dates
            const newDate = new Date(updates.scheduled_date);
            const campaignStart = new Date(campaign.start_date);
            const campaignEnd = new Date(campaign.end_date);

            if (newDate < campaignStart || newDate > campaignEnd) {
                throw new Error('Round date must be between campaign start date and end date');
            }

            // Requirement 3.6: Validate sequential dates
            const { data: allRounds, error: roundsError } = await supabase
                .from('campaign_rounds')
                .select('id, round_number, scheduled_date')
                .eq('campaign_id', round.campaign_id)
                .order('round_number', { ascending: true });

            if (roundsError) throw roundsError;

            // Check if new date maintains sequential order
            const currentRoundIndex = allRounds.findIndex((r: any) => r.id === id);

            // Check previous round
            if (currentRoundIndex > 0) {
                const prevRoundDate = new Date(allRounds[currentRoundIndex - 1].scheduled_date);
                if (newDate <= prevRoundDate) {
                    throw new Error('Round date must be after the previous round date');
                }
            }

            // Check next round
            if (currentRoundIndex < allRounds.length - 1) {
                const nextRoundDate = new Date(allRounds[currentRoundIndex + 1].scheduled_date);
                if (newDate >= nextRoundDate) {
                    throw new Error('Round date must be before the next round date');
                }
            }
        }

        // Validate min_passing_score if being updated
        if (updates.min_passing_score !== undefined &&
            (updates.min_passing_score < 0 || updates.min_passing_score > 100)) {
            throw new Error('Minimum passing score must be between 0 and 100');
        }

        const { error } = await supabase
            .from('campaign_rounds')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        await getRounds(round.campaign_id);
    };

    /**
     * Delete a round from the pipeline
     * Validates: Requirements 3.3
     */
    const deleteRound = async (id: string) => {
        // Fetch the round to get campaign_id for refresh
        const { data: round, error: fetchError } = await supabase
            .from('campaign_rounds')
            .select('campaign_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const { error } = await supabase
            .from('campaign_rounds')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await getRounds(round.campaign_id);
    };

    /**
     * Reorder rounds by updating round_number for sequential ordering
     * Validates: Requirements 3.5, 3.6
     */
    const reorderRounds = async (campaignId: string, roundIds: string[]) => {
        // Fetch all rounds with their scheduled dates
        const { data: rounds, error: fetchError } = await supabase
            .from('campaign_rounds')
            .select('id, scheduled_date')
            .eq('campaign_id', campaignId);

        if (fetchError) throw fetchError;

        // Create a map of round IDs to scheduled dates
        const dateMap = new Map(rounds.map((r: any) => [r.id, new Date(r.scheduled_date)]));

        // Validate that the new order maintains sequential dates (Requirement 3.6)
        for (let i = 0; i < roundIds.length - 1; i++) {
            const currentDate = dateMap.get(roundIds[i]);
            const nextDate = dateMap.get(roundIds[i + 1]);

            if (!currentDate || !nextDate) {
                throw new Error('Invalid round ID in reorder list');
            }

            if (currentDate >= nextDate) {
                throw new Error('Cannot reorder: rounds must maintain sequential dates. Round dates must be in ascending order.');
            }
        }

        // Update round_number for each round in the new order
        const updates = roundIds.map((roundId, index) => ({
            id: roundId,
            round_number: index + 1,
        }));

        // Execute updates sequentially to avoid conflicts
        for (const update of updates) {
            const { error } = await supabase
                .from('campaign_rounds')
                .update({ round_number: update.round_number })
                .eq('id', update.id);

            if (error) throw error;
        }

        await getRounds(campaignId);
    };

    return {
        rounds,
        loading,
        getRounds,
        createRound,
        updateRound,
        deleteRound,
        reorderRounds,
    };
}

export interface CampaignApplication {
    id: string;
    campaign_id: string;
    candidate_id: string;
    job_id: string;
    status: 'pending' | 'in-progress' | 'completed' | 'rejected';
    current_round: number;
    applied_at: string;
    updated_at: string;
    // Joined data
    campaign?: Campaign;
    candidate?: Candidate;
    round_results?: CampaignRoundResult[];
}

export interface CampaignRoundResult {
    id: string;
    application_id: string;
    round_id: string;
    score?: number;
    status: 'passed' | 'failed' | 'pending';
    feedback?: string;
    completed_at: string;
}

export interface ApplicationFilters {
    campaign_id?: string;
    candidate_id?: string;
    status?: 'pending' | 'in-progress' | 'completed' | 'rejected';
    current_round?: number;
}

export interface ApplicationStats {
    total: number;
    by_round: { round_number: number; count: number }[];
    by_status: { status: string; count: number }[];
}

/**
 * Hook for managing campaign applications
 * Validates: Requirements 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function useCampaignApplications() {
    const [applications, setApplications] = useState<CampaignApplication[]>([]);
    const [loading, setLoading] = useState(false);

    /**
     * Fetch applications with optional filters
     * Validates: Requirements 5.4, 6.1, 6.2
     */
    const getApplications = async (filters?: ApplicationFilters): Promise<CampaignApplication[]> => {
        setLoading(true);

        let query = supabase
            .from('campaign_applications')
            .select(`
                *,
                hiring_campaigns (
                    id,
                    name,
                    start_date,
                    end_date,
                    status,
                    visibility
                ),
                profiles!campaign_applications_candidate_id_fkey (
                    id,
                    full_name,
                    email,
                    headline,
                    skills,
                    location,
                    experience_years,
                    avatar_url
                )
            `)
            .order('applied_at', { ascending: false });

        // Apply filters (Requirement 6.2)
        if (filters?.campaign_id) {
            query = query.eq('campaign_id', filters.campaign_id);
        }
        if (filters?.candidate_id) {
            query = query.eq('candidate_id', filters.candidate_id);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.current_round !== undefined) {
            query = query.eq('current_round', filters.current_round);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching applications:', error);
            setLoading(false);
            throw error;
        }

        const mappedApplications: CampaignApplication[] = data.map((app: any) => ({
            id: app.id,
            campaign_id: app.campaign_id,
            candidate_id: app.candidate_id,
            job_id: app.job_id,
            status: app.status,
            current_round: app.current_round,
            applied_at: app.applied_at,
            updated_at: app.updated_at,
            campaign: app.hiring_campaigns ? {
                id: app.hiring_campaigns.id,
                employer_id: '',
                job_id: '',
                name: app.hiring_campaigns.name,
                start_date: app.hiring_campaigns.start_date,
                end_date: app.hiring_campaigns.end_date,
                status: app.hiring_campaigns.status,
                visibility: app.hiring_campaigns.visibility,
                created_at: '',
                updated_at: '',
            } : undefined,
            candidate: app.profiles ? {
                id: app.profiles.id,
                full_name: app.profiles.full_name,
                role: app.profiles.headline || 'Candidate',
                headline: app.profiles.headline,
                match_score: 0,
                skills: app.profiles.skills || [],
                location: app.profiles.location || 'Remote',
                experience: app.profiles.experience_years || 0,
                email: app.profiles.email,
                avatar_url: app.profiles.avatar_url,
            } : undefined,
        }));

        setApplications(mappedApplications);
        setLoading(false);
        return mappedApplications;
    };

    /**
     * Fetch single application by ID with round results
     * Validates: Requirements 5.6, 5.11
     */
    const getApplicationById = async (id: string): Promise<CampaignApplication | null> => {
        const { data, error } = await supabase
            .from('campaign_applications')
            .select(`
                *,
                hiring_campaigns (
                    id,
                    name,
                    start_date,
                    end_date,
                    status,
                    visibility
                ),
                profiles!campaign_applications_candidate_id_fkey (
                    id,
                    full_name,
                    email,
                    headline,
                    skills,
                    location,
                    experience_years,
                    avatar_url
                ),
                campaign_round_results (
                    id,
                    application_id,
                    round_id,
                    score,
                    status,
                    feedback,
                    completed_at
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching application:', error);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            campaign_id: data.campaign_id,
            candidate_id: data.candidate_id,
            job_id: data.job_id,
            status: data.status,
            current_round: data.current_round,
            applied_at: data.applied_at,
            updated_at: data.updated_at,
            campaign: data.hiring_campaigns ? {
                id: data.hiring_campaigns.id,
                employer_id: '',
                job_id: '',
                name: data.hiring_campaigns.name,
                start_date: data.hiring_campaigns.start_date,
                end_date: data.hiring_campaigns.end_date,
                status: data.hiring_campaigns.status,
                visibility: data.hiring_campaigns.visibility,
                created_at: '',
                updated_at: '',
            } : undefined,
            candidate: data.profiles ? {
                id: data.profiles.id,
                full_name: data.profiles.full_name,
                role: data.profiles.headline || 'Candidate',
                headline: data.profiles.headline,
                match_score: 0,
                skills: data.profiles.skills || [],
                location: data.profiles.location || 'Remote',
                experience: data.profiles.experience_years || 0,
                email: data.profiles.email,
                avatar_url: data.profiles.avatar_url,
            } : undefined,
            round_results: data.campaign_round_results ? data.campaign_round_results.map((result: any) => ({
                id: result.id,
                application_id: result.application_id,
                round_id: result.round_id,
                score: result.score,
                status: result.status,
                feedback: result.feedback,
                completed_at: result.completed_at,
            })) : [],
        };
    };

    /**
     * Create application with eligibility check
     * Validates: Requirements 4.5, 4.6, 4.8, 5.4, 5.5, 5.6
     */
    const createApplication = async (campaignId: string, candidateId: string): Promise<CampaignApplication> => {
        // Fetch campaign with eligibility criteria
        const { data: campaign, error: campaignError } = await supabase
            .from('hiring_campaigns')
            .select('*, jobs(*)')
            .eq('id', campaignId)
            .single();

        if (campaignError) throw campaignError;

        // Fetch candidate profile for eligibility check
        const { data: candidate, error: candidateError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (candidateError) throw candidateError;

        // Requirement 4.5: Calculate eligibility
        const eligibilityIssues: string[] = [];

        // Check minimum matching score (Requirement 4.1, 4.8)
        if (campaign.min_matching_score && campaign.jobs) {
            const matchResult = calculateJobMatch(campaign.jobs, candidate);
            if (matchResult.score < campaign.min_matching_score) {
                eligibilityIssues.push(`Matching score ${Math.round(matchResult.score)}% is below minimum ${campaign.min_matching_score}%`);
            }
        }

        // Check experience requirements (Requirement 4.3)
        const candidateExperience = candidate.experience_years || 0;
        if (campaign.min_experience && candidateExperience < campaign.min_experience) {
            eligibilityIssues.push(`Experience ${candidateExperience} years is below minimum ${campaign.min_experience} years`);
        }
        if (campaign.max_experience && candidateExperience > campaign.max_experience) {
            eligibilityIssues.push(`Experience ${candidateExperience} years exceeds maximum ${campaign.max_experience} years`);
        }

        // Requirement 4.8: Reject if eligibility criteria not met
        if (eligibilityIssues.length > 0) {
            throw new Error(`Eligibility check failed: ${eligibilityIssues.join(', ')}`);
        }

        // Check for duplicate application (Requirement 5.5)
        const { data: existingApp } = await supabase
            .from('campaign_applications')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('candidate_id', candidateId)
            .single();

        if (existingApp) {
            throw new Error('You have already applied to this campaign');
        }

        // Create application (Requirement 5.6)
        const { data: newApplication, error } = await supabase
            .from('campaign_applications')
            .insert({
                campaign_id: campaignId,
                candidate_id: candidateId,
                job_id: campaign.job_id,
                status: 'pending',
                current_round: 0,
            })
            .select()
            .single();

        if (error) throw error;

        await getApplications({ campaign_id: campaignId });
        return newApplication;
    };

    /**
     * Update application status
     * Validates: Requirements 5.9, 5.10, 6.7, 6.8, 6.9
     */
    const updateApplicationStatus = async (
        id: string,
        status: 'pending' | 'in-progress' | 'completed' | 'rejected'
    ) => {
        const { error } = await supabase
            .from('campaign_applications')
            .update({ status })
            .eq('id', id);

        if (error) throw error;

        // Refresh applications
        const { data: app } = await supabase
            .from('campaign_applications')
            .select('campaign_id')
            .eq('id', id)
            .single();

        if (app) {
            await getApplications({ campaign_id: app.campaign_id });
        }
    };

    /**
     * Advance candidate to next round
     * Validates: Requirements 5.8, 5.9, 6.8, 9.1, 9.2
     */
    const advanceToNextRound = async (applicationId: string) => {
        // Fetch current application
        const { data: application, error: fetchError } = await supabase
            .from('campaign_applications')
            .select('current_round, campaign_id')
            .eq('id', applicationId)
            .single();

        if (fetchError) throw fetchError;

        // Requirement 5.8, 9.1: Increment current_round to unlock next round
        const nextRound = application.current_round + 1;

        const { error } = await supabase
            .from('campaign_applications')
            .update({
                current_round: nextRound,
                status: 'in-progress',
            })
            .eq('id', applicationId);

        if (error) throw error;

        await getApplications({ campaign_id: application.campaign_id });
    };

    /**
     * Get application statistics for funnel visualization
     * Validates: Requirements 6.3, 6.4
     */
    const getApplicationStats = async (campaignId: string): Promise<ApplicationStats> => {
        // Fetch all applications for the campaign
        const { data: applications, error } = await supabase
            .from('campaign_applications')
            .select('current_round, status')
            .eq('campaign_id', campaignId);

        if (error) throw error;

        // Count by round (Requirement 6.3, 6.4)
        const roundCounts = new Map<number, number>();
        const statusCounts = new Map<string, number>();

        applications.forEach((app: any) => {
            // Count by round
            const round = app.current_round;
            roundCounts.set(round, (roundCounts.get(round) || 0) + 1);

            // Count by status
            statusCounts.set(app.status, (statusCounts.get(app.status) || 0) + 1);
        });

        return {
            total: applications.length,
            by_round: Array.from(roundCounts.entries())
                .map(([round_number, count]) => ({ round_number, count }))
                .sort((a, b) => a.round_number - b.round_number),
            by_status: Array.from(statusCounts.entries())
                .map(([status, count]) => ({ status, count })),
        };
    };

    return {
        applications,
        loading,
        getApplications,
        getApplicationById,
        createApplication,
        updateApplicationStatus,
        advanceToNextRound,
        getApplicationStats,
    };
}

/**
 * Hook for managing campaign round results
 * Validates: Requirements 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 6.6, 6.7, 6.8, 6.9
 */
export function useCampaignRoundResults() {
    const [results, setResults] = useState<CampaignRoundResult[]>([]);
    const [loading, setLoading] = useState(false);

    /**
     * Fetch all round results for an application
     * Validates: Requirements 5.11, 6.6
     */
    const getResults = async (applicationId: string): Promise<CampaignRoundResult[]> => {
        setLoading(true);

        const { data, error } = await supabase
            .from('campaign_round_results')
            .select('*')
            .eq('application_id', applicationId)
            .order('completed_at', { ascending: true });

        if (error) {
            console.error('Error fetching round results:', error);
            setLoading(false);
            throw error;
        }

        const mappedResults: CampaignRoundResult[] = data.map((result: any) => ({
            id: result.id,
            application_id: result.application_id,
            round_id: result.round_id,
            score: result.score,
            status: result.status,
            feedback: result.feedback,
            completed_at: result.completed_at,
        }));

        setResults(mappedResults);
        setLoading(false);
        return mappedResults;
    };

    /**
     * Create a round result and automatically advance candidate if passed
     * Validates: Requirements 5.7, 5.8, 5.9, 5.10, 6.7, 6.8
     */
    const createResult = async (
        applicationId: string,
        roundId: string,
        data: {
            score?: number;
            status: 'passed' | 'failed' | 'pending';
            feedback?: string;
        }
    ): Promise<CampaignRoundResult> => {
        // Validate score range if provided
        if (data.score !== undefined && (data.score < 0 || data.score > 100)) {
            throw new Error('Score must be between 0 and 100');
        }

        // Create the round result (Requirement 5.7, 6.7)
        const { data: newResult, error } = await supabase
            .from('campaign_round_results')
            .insert({
                application_id: applicationId,
                round_id: roundId,
                score: data.score,
                status: data.status,
                feedback: data.feedback,
            })
            .select()
            .single();

        if (error) throw error;

        // Requirement 5.8, 6.8: Automatically advance candidate when result status is "passed"
        if (data.status === 'passed') {
            // Fetch current application to get current_round
            const { data: application, error: appError } = await supabase
                .from('campaign_applications')
                .select('current_round, campaign_id')
                .eq('id', applicationId)
                .single();

            if (appError) throw appError;

            // Advance to next round
            const nextRound = application.current_round + 1;

            const { error: updateError } = await supabase
                .from('campaign_applications')
                .update({
                    current_round: nextRound,
                    status: 'in-progress',
                })
                .eq('id', applicationId);

            if (updateError) throw updateError;
        }

        // Requirement 5.9, 6.9: Lock subsequent rounds when result status is "failed"
        if (data.status === 'failed') {
            // Update application status to rejected to lock subsequent rounds
            const { error: updateError } = await supabase
                .from('campaign_applications')
                .update({
                    status: 'rejected',
                })
                .eq('id', applicationId);

            if (updateError) throw updateError;
        }

        await getResults(applicationId);
        return newResult;
    };

    /**
     * Update result details
     * Validates: Requirements 5.10, 5.12, 6.7
     */
    const updateResult = async (
        id: string,
        data: {
            score?: number;
            status?: 'passed' | 'failed' | 'pending';
            feedback?: string;
        }
    ) => {
        // Validate score range if provided
        if (data.score !== undefined && (data.score < 0 || data.score > 100)) {
            throw new Error('Score must be between 0 and 100');
        }

        // Fetch the current result to get application_id and current status
        const { data: currentResult, error: fetchError } = await supabase
            .from('campaign_round_results')
            .select('application_id, status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Update the result
        const { error } = await supabase
            .from('campaign_round_results')
            .update(data)
            .eq('id', id);

        if (error) throw error;

        // Handle status changes
        if (data.status && data.status !== currentResult.status) {
            // Requirement 5.8, 6.8: Automatically advance candidate when result status changes to "passed"
            if (data.status === 'passed') {
                const { data: application, error: appError } = await supabase
                    .from('campaign_applications')
                    .select('current_round, campaign_id')
                    .eq('id', currentResult.application_id)
                    .single();

                if (appError) throw appError;

                const nextRound = application.current_round + 1;

                const { error: updateError } = await supabase
                    .from('campaign_applications')
                    .update({
                        current_round: nextRound,
                        status: 'in-progress',
                    })
                    .eq('id', currentResult.application_id);

                if (updateError) throw updateError;
            }

            // Requirement 5.9, 6.9: Lock subsequent rounds when result status changes to "failed"
            if (data.status === 'failed') {
                const { error: updateError } = await supabase
                    .from('campaign_applications')
                    .update({
                        status: 'rejected',
                    })
                    .eq('id', currentResult.application_id);

                if (updateError) throw updateError;
            }
        }

        await getResults(currentResult.application_id);
    };

    return {
        results,
        loading,
        getResults,
        createResult,
        updateResult,
    };
}

export interface CampaignInvitation {
    id: string;
    campaign_id: string;
    employer_id: string;
    candidate_id: string;
    status: 'pending' | 'accepted' | 'declined';
    message?: string;
    sent_at: string;
    responded_at?: string;
    // Joined data
    campaign?: Campaign;
    candidate?: Candidate;
}

export interface InvitationFilters {
    campaign_id?: string;
    candidate_id?: string;
    employer_id?: string;
    status?: 'pending' | 'accepted' | 'declined';
}

export interface CandidateSearchFilters {
    skills?: string[];
    min_experience?: number;
    max_experience?: number;
    location?: string;
    role?: string;
}

/**
 * Hook for managing campaign invitations
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10
 */
export function useCampaignInvitations() {
    const [invitations, setInvitations] = useState<CampaignInvitation[]>([]);
    const [loading, setLoading] = useState(false);

    /**
     * Fetch invitations with optional filters
     * Validates: Requirements 7.9
     */
    const getInvitations = async (filters?: InvitationFilters): Promise<CampaignInvitation[]> => {
        setLoading(true);

        let query = supabase
            .from('campaign_invitations')
            .select(`
                *,
                hiring_campaigns (
                    id,
                    name,
                    start_date,
                    end_date,
                    status,
                    visibility,
                    job_id,
                    jobs (
                        title,
                        location,
                        type
                    )
                ),
                profiles!campaign_invitations_candidate_id_fkey (
                    id,
                    full_name,
                    email,
                    headline,
                    skills,
                    location,
                    experience_years,
                    avatar_url
                )
            `)
            .order('sent_at', { ascending: false });

        // Apply filters
        if (filters?.campaign_id) {
            query = query.eq('campaign_id', filters.campaign_id);
        }
        if (filters?.candidate_id) {
            query = query.eq('candidate_id', filters.candidate_id);
        }
        if (filters?.employer_id) {
            query = query.eq('employer_id', filters.employer_id);
        }
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching invitations:', error);
            setLoading(false);
            throw error;
        }

        const mappedInvitations: CampaignInvitation[] = data.map((inv: any) => ({
            id: inv.id,
            campaign_id: inv.campaign_id,
            employer_id: inv.employer_id,
            candidate_id: inv.candidate_id,
            status: inv.status,
            message: inv.message,
            sent_at: inv.sent_at,
            responded_at: inv.responded_at,
            campaign: inv.hiring_campaigns ? {
                id: inv.hiring_campaigns.id,
                employer_id: '',
                job_id: inv.hiring_campaigns.job_id,
                name: inv.hiring_campaigns.name,
                start_date: inv.hiring_campaigns.start_date,
                end_date: inv.hiring_campaigns.end_date,
                status: inv.hiring_campaigns.status,
                visibility: inv.hiring_campaigns.visibility,
                created_at: '',
                updated_at: '',
                job: inv.hiring_campaigns.jobs ? {
                    id: inv.hiring_campaigns.job_id,
                    role: inv.hiring_campaigns.jobs.title,
                    title: inv.hiring_campaigns.jobs.title,
                    type: inv.hiring_campaigns.jobs.type || 'Full Time',
                    location: inv.hiring_campaigns.jobs.location,
                    description: '',
                    posted_at: '',
                    applicants_count: 0,
                    status: 'Active',
                } : undefined,
            } : undefined,
            candidate: inv.profiles ? {
                id: inv.profiles.id,
                full_name: inv.profiles.full_name,
                role: inv.profiles.headline || 'Candidate',
                headline: inv.profiles.headline,
                match_score: 0,
                skills: inv.profiles.skills || [],
                location: inv.profiles.location || 'Remote',
                experience: inv.profiles.experience_years || 0,
                email: inv.profiles.email,
                avatar_url: inv.profiles.avatar_url,
            } : undefined,
        }));

        setInvitations(mappedInvitations);
        setLoading(false);
        return mappedInvitations;
    };

    /**
     * Send invitation to a candidate
     * Validates: Requirements 7.3, 7.4, 7.5
     */
    const createInvitation = async (
        campaignId: string,
        candidateId: string,
        message?: string
    ): Promise<CampaignInvitation> => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('User not authenticated');

        // Check for duplicate invitation
        const { data: existingInvitation } = await supabase
            .from('campaign_invitations')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('candidate_id', candidateId)
            .single();

        if (existingInvitation) {
            throw new Error('Invitation already sent to this candidate for this campaign');
        }

        // Requirement 7.4: Create invitation record with status pending
        const { data: newInvitation, error } = await supabase
            .from('campaign_invitations')
            .insert({
                campaign_id: campaignId,
                employer_id: userData.user.id,
                candidate_id: candidateId,
                status: 'pending',
                message: message, // Requirement 7.5: Include custom message
            })
            .select()
            .single();

        if (error) throw error;

        await getInvitations({ employer_id: userData.user.id });
        return newInvitation;
    };

    /**
     * Respond to invitation (accept or decline)
     * Validates: Requirements 7.6, 7.7, 7.8, 7.10
     */
    const respondToInvitation = async (
        id: string,
        status: 'accepted' | 'declined'
    ): Promise<void> => {
        // Fetch invitation details
        const { data: invitation, error: fetchError } = await supabase
            .from('campaign_invitations')
            .select('campaign_id, candidate_id, employer_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Requirement 7.6, 7.8: Update invitation status
        const { error: updateError } = await supabase
            .from('campaign_invitations')
            .update({
                status: status,
                responded_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // Requirement 7.7, 7.10: When accepted, create campaign application
        if (status === 'accepted') {
            // Check if application already exists
            const { data: existingApp } = await supabase
                .from('campaign_applications')
                .select('id')
                .eq('campaign_id', invitation.campaign_id)
                .eq('candidate_id', invitation.candidate_id)
                .single();

            if (!existingApp) {
                // Fetch campaign to get job_id
                const { data: campaign, error: campaignError } = await supabase
                    .from('hiring_campaigns')
                    .select('job_id')
                    .eq('id', invitation.campaign_id)
                    .single();

                if (campaignError) throw campaignError;

                // Create campaign application
                const { error: appError } = await supabase
                    .from('campaign_applications')
                    .insert({
                        campaign_id: invitation.campaign_id,
                        candidate_id: invitation.candidate_id,
                        job_id: campaign.job_id,
                        status: 'pending',
                        current_round: 0,
                    });

                if (appError) throw appError;
            }
        }

        await getInvitations({ candidate_id: invitation.candidate_id });
    };

    /**
     * Search candidates by skills, experience, location, and role
     * Validates: Requirements 7.1, 7.2
     */
    const searchCandidates = async (filters: CandidateSearchFilters): Promise<Candidate[]> => {
        setLoading(true);

        // Requirement 7.1: Search by skills, experience, location, role
        let query = supabase
            .from('profiles')
            .select('*')
            .eq('role', 'candidate')
            .or('open_to_work.is.null,open_to_work.eq.true');

        // Filter by location
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }

        // Filter by role/headline
        if (filters.role) {
            query = query.ilike('headline', `%${filters.role}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error searching candidates:', error);
            setLoading(false);
            throw error;
        }

        // Filter by skills and experience in memory (since JSONB array filtering is complex)
        let filteredCandidates = data;

        // Filter by skills
        if (filters.skills && filters.skills.length > 0) {
            filteredCandidates = filteredCandidates.filter((candidate: any) => {
                const candidateSkills = candidate.skills || [];
                return filters.skills!.some(skill =>
                    candidateSkills.some((cs: string) =>
                        cs.toLowerCase().includes(skill.toLowerCase())
                    )
                );
            });
        }

        // Filter by experience
        if (filters.min_experience !== undefined) {
            filteredCandidates = filteredCandidates.filter((candidate: any) => {
                const exp = candidate.experience_years || 0;
                return exp >= filters.min_experience!;
            });
        }

        if (filters.max_experience !== undefined) {
            filteredCandidates = filteredCandidates.filter((candidate: any) => {
                const exp = candidate.experience_years || 0;
                return exp <= filters.max_experience!;
            });
        }

        // Fetch employer's jobs to calculate match scores (Requirement 7.2)
        const { data: { user } } = await supabase.auth.getUser();
        const { data: jobsData } = user
            ? await supabase.from('jobs').select('*').eq('employer_id', user.id).eq('is_active', true)
            : { data: [] };

        // Requirement 7.2: Map to Candidate format with match scores
        const mappedCandidates: Candidate[] = filteredCandidates.map((p: any) => {
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
                role: p.headline || 'Candidate',
                headline: p.headline,
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
                bio: p.about || p.bio,
                work_experience: p.experience || p.work_experience || [],
                education_history: p.education || p.education_history || [],
            };
        });

        setLoading(false);
        return mappedCandidates;
    };

    return {
        invitations,
        loading,
        getInvitations,
        createInvitation,
        respondToInvitation,
        searchCandidates,
    };
}
