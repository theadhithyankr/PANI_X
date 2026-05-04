import { supabase } from '../utils/supabase/client';

interface Candidate {
    id: string;
    full_name: string;
    email: string;
}

interface Campaign {
    id: string;
    name: string;
    job_title?: string;
}

interface Round {
    id: string;
    name: string;
    scheduled_date: string;
    round_number: number;
}

interface Result {
    status: 'passed' | 'failed';
    score?: number;
    feedback?: string;
}

interface EmailResponse {
    success: boolean;
    message: string;
    emailId?: string;
    preview?: {
        to: string;
        subject: string;
    };
    error?: string;
    details?: string;
}

/**
 * Send an invitation email to a candidate for a campaign
 * @param candidate - The candidate to invite
 * @param campaign - The campaign details
 * @param message - Optional custom message from the employer
 * @returns Promise with the email sending result
 */
export const sendInvitationEmail = async (
    candidate: Candidate,
    campaign: Campaign,
    message?: string
): Promise<EmailResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('send-campaign-email', {
            body: {
                type: 'invitation',
                candidate,
                campaign,
                message,
            },
        });

        if (error) {
            console.error('Error sending invitation email:', error);
            throw error;
        }

        return data as EmailResponse;
    } catch (error) {
        console.error('Failed to send invitation email:', error);
        throw error;
    }
};

/**
 * Send a 24-hour reminder email for an upcoming round
 * @param candidate - The candidate to remind
 * @param campaign - The campaign details
 * @param round - The round details
 * @returns Promise with the email sending result
 */
export const sendRoundReminderEmail = async (
    candidate: Candidate,
    campaign: Campaign,
    round: Round
): Promise<EmailResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('send-campaign-email', {
            body: {
                type: 'reminder',
                candidate,
                campaign,
                round,
            },
        });

        if (error) {
            console.error('Error sending round reminder email:', error);
            throw error;
        }

        return data as EmailResponse;
    } catch (error) {
        console.error('Failed to send round reminder email:', error);
        throw error;
    }
};

/**
 * Send a result notification email for a completed round
 * @param candidate - The candidate who completed the round
 * @param campaign - The campaign details
 * @param round - The completed round details
 * @param result - The result (pass/fail, score, feedback)
 * @param nextRound - Optional next round details (if candidate passed)
 * @returns Promise with the email sending result
 */
export const sendResultEmail = async (
    candidate: Candidate,
    campaign: Campaign,
    round: Round,
    result: Result,
    nextRound?: Round
): Promise<EmailResponse> => {
    try {
        const { data, error } = await supabase.functions.invoke('send-campaign-email', {
            body: {
                type: 'result',
                candidate,
                campaign,
                round,
                result,
                nextRound,
            },
        });

        if (error) {
            console.error('Error sending result email:', error);
            throw error;
        }

        return data as EmailResponse;
    } catch (error) {
        console.error('Failed to send result email:', error);
        throw error;
    }
};

/**
 * Batch send invitation emails to multiple candidates
 * @param candidates - Array of candidates to invite
 * @param campaign - The campaign details
 * @param message - Optional custom message from the employer
 * @returns Promise with array of results for each email
 */
export const sendBatchInvitationEmails = async (
    candidates: Candidate[],
    campaign: Campaign,
    message?: string
): Promise<EmailResponse[]> => {
    const results = await Promise.allSettled(
        candidates.map(candidate => sendInvitationEmail(candidate, campaign, message))
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error(`Failed to send email to ${candidates[index].email}:`, result.reason);
            return {
                success: false,
                message: 'Failed to send email',
                error: result.reason?.message || 'Unknown error',
            };
        }
    });
};

/**
 * Schedule reminder emails for all candidates with rounds in the next 24 hours
 * This function should be called by a scheduled job/cron
 * @returns Promise with array of results for each email sent
 */
export const sendScheduledReminders = async (): Promise<EmailResponse[]> => {
    try {
        // Calculate time window (next 24-48 hours to catch rounds happening tomorrow)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(tomorrow.getHours() + 24);
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 48);

        // Fetch all upcoming rounds in the next 24-48 hours with their candidates
        const { data: upcomingRounds, error } = await supabase
            .from('campaign_rounds')
            .select(`
        id,
        name,
        scheduled_date,
        round_number,
        campaign_id,
        hiring_campaigns!inner (
          id,
          name,
          job_id,
          jobs (title)
        ),
        campaign_applications!inner (
          candidate_id,
          current_round,
          status,
          profiles!campaign_applications_candidate_id_fkey (
            id,
            full_name,
            email
          )
        )
      `)
            .gte('scheduled_date', tomorrow.toISOString())
            .lt('scheduled_date', dayAfterTomorrow.toISOString());

        if (error) {
            console.error('Error fetching upcoming rounds:', error);
            throw error;
        }

        if (!upcomingRounds || upcomingRounds.length === 0) {
            return [];
        }

        // Send reminder emails
        const emailPromises: Promise<EmailResponse>[] = [];

        for (const round of upcomingRounds) {
            const campaign = round.hiring_campaigns;
            const applications = round.campaign_applications;

            for (const application of applications) {
                // Only send reminder if this is the candidate's current round and they're active
                if (
                    application.current_round === round.round_number &&
                    application.status === 'active' &&
                    application.profiles
                ) {
                    const candidate = {
                        id: application.profiles.id,
                        full_name: application.profiles.full_name,
                        email: application.profiles.email,
                    };

                    const campaignData = {
                        id: campaign.id,
                        name: campaign.name,
                        job_title: campaign.jobs?.title,
                    };

                    const roundData = {
                        id: round.id,
                        name: round.name,
                        scheduled_date: round.scheduled_date,
                        round_number: round.round_number,
                    };

                    emailPromises.push(sendRoundReminderEmail(candidate, campaignData, roundData));
                }
            }
        }

        const results = await Promise.allSettled(emailPromises);

        return results.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error('Failed to send reminder email:', result.reason);
                return {
                    success: false,
                    message: 'Failed to send reminder email',
                    error: result.reason?.message || 'Unknown error',
                };
            }
        });
    } catch (error) {
        console.error('Error in sendScheduledReminders:', error);
        throw error;
    }
};
