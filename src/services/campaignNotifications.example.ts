/**
 * Campaign Notifications Service - Usage Examples
 * 
 * This file demonstrates how to use the campaign notification service
 * to send emails for invitations, reminders, and results.
 */

import {
    sendInvitationEmail,
    sendRoundReminderEmail,
    sendResultEmail,
    sendBatchInvitationEmails,
    sendScheduledReminders,
} from './campaignNotifications';

// ============================================================================
// Example 1: Send Campaign Invitation
// ============================================================================

export const exampleSendInvitation = async () => {
    const candidate = {
        id: 'candidate-123',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
    };

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    const customMessage = 'We were impressed by your profile and think you would be a great fit for our team!';

    try {
        const result = await sendInvitationEmail(candidate, campaign, customMessage);

        if (result.success) {
            console.log('Invitation sent successfully!', result.emailId);
        } else {
            console.error('Failed to send invitation:', result.error);
        }
    } catch (error) {
        console.error('Error sending invitation:', error);
    }
};

// ============================================================================
// Example 2: Send Round Reminder (24 hours before)
// ============================================================================

export const exampleSendReminder = async () => {
    const candidate = {
        id: 'candidate-123',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
    };

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    const round = {
        id: 'round-789',
        name: 'Technical Assessment',
        scheduled_date: '2024-01-15T10:00:00Z',
        round_number: 2,
    };

    try {
        const result = await sendRoundReminderEmail(candidate, campaign, round);

        if (result.success) {
            console.log('Reminder sent successfully!', result.emailId);
        } else {
            console.error('Failed to send reminder:', result.error);
        }
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
};

// ============================================================================
// Example 3: Send Result Email (Passed)
// ============================================================================

export const exampleSendPassedResult = async () => {
    const candidate = {
        id: 'candidate-123',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
    };

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    const completedRound = {
        id: 'round-789',
        name: 'Technical Assessment',
        scheduled_date: '2024-01-15T10:00:00Z',
        round_number: 2,
    };

    const result = {
        status: 'passed' as const,
        score: 85,
        feedback: 'Excellent problem-solving skills and clean code implementation!',
    };

    const nextRound = {
        id: 'round-790',
        name: 'HR Interview',
        scheduled_date: '2024-01-20T14:00:00Z',
        round_number: 3,
    };

    try {
        const emailResult = await sendResultEmail(candidate, campaign, completedRound, result, nextRound);

        if (emailResult.success) {
            console.log('Result email sent successfully!', emailResult.emailId);
        } else {
            console.error('Failed to send result email:', emailResult.error);
        }
    } catch (error) {
        console.error('Error sending result email:', error);
    }
};

// ============================================================================
// Example 4: Send Result Email (Failed)
// ============================================================================

export const exampleSendFailedResult = async () => {
    const candidate = {
        id: 'candidate-123',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
    };

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    const completedRound = {
        id: 'round-789',
        name: 'Technical Assessment',
        scheduled_date: '2024-01-15T10:00:00Z',
        round_number: 2,
    };

    const result = {
        status: 'failed' as const,
        score: 45,
        feedback: 'Good effort, but needs improvement in data structures and algorithms.',
    };

    try {
        // No nextRound parameter when candidate fails
        const emailResult = await sendResultEmail(candidate, campaign, completedRound, result);

        if (emailResult.success) {
            console.log('Result email sent successfully!', emailResult.emailId);
        } else {
            console.error('Failed to send result email:', emailResult.error);
        }
    } catch (error) {
        console.error('Error sending result email:', error);
    }
};

// ============================================================================
// Example 5: Batch Send Invitations to Multiple Candidates
// ============================================================================

export const exampleBatchInvitations = async () => {
    const candidates = [
        { id: '1', full_name: 'Alice Johnson', email: 'alice@example.com' },
        { id: '2', full_name: 'Bob Williams', email: 'bob@example.com' },
        { id: '3', full_name: 'Carol Davis', email: 'carol@example.com' },
    ];

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    const message = 'We are excited to invite you to our hiring campaign!';

    try {
        const results = await sendBatchInvitationEmails(candidates, campaign, message);

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log(`Batch send complete: ${successCount} succeeded, ${failureCount} failed`);

        // Log individual results
        results.forEach((result, index) => {
            if (result.success) {
                console.log(`✓ ${candidates[index].email}: ${result.emailId}`);
            } else {
                console.error(`✗ ${candidates[index].email}: ${result.error}`);
            }
        });
    } catch (error) {
        console.error('Error in batch send:', error);
    }
};

// ============================================================================
// Example 6: Send Scheduled Reminders (Cron Job)
// ============================================================================

export const exampleScheduledReminders = async () => {
    // This function should be called by a scheduled job/cron
    // It automatically finds all rounds happening in the next 24 hours
    // and sends reminders to candidates

    try {
        const results = await sendScheduledReminders();

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        console.log(`Scheduled reminders sent: ${successCount} succeeded, ${failureCount} failed`);

        if (results.length === 0) {
            console.log('No upcoming rounds found in the next 24 hours');
        }
    } catch (error) {
        console.error('Error sending scheduled reminders:', error);
    }
};

// ============================================================================
// Example 7: Integration with Campaign Application Flow
// ============================================================================

export const exampleCampaignApplicationFlow = async () => {
    // Step 1: Employer invites candidate
    const candidate = {
        id: 'candidate-123',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
    };

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    // Send invitation
    await sendInvitationEmail(candidate, campaign, 'We would love to have you join our campaign!');

    // Step 2: 24 hours before Round 1, send reminder
    const round1 = {
        id: 'round-1',
        name: 'Aptitude Test',
        scheduled_date: '2024-01-10T09:00:00Z',
        round_number: 1,
    };

    await sendRoundReminderEmail(candidate, campaign, round1);

    // Step 3: After Round 1 completion, send result
    const round1Result = {
        status: 'passed' as const,
        score: 90,
        feedback: 'Excellent performance on the aptitude test!',
    };

    const round2 = {
        id: 'round-2',
        name: 'Technical Assessment',
        scheduled_date: '2024-01-15T10:00:00Z',
        round_number: 2,
    };

    await sendResultEmail(candidate, campaign, round1, round1Result, round2);

    // Step 4: 24 hours before Round 2, send reminder
    await sendRoundReminderEmail(candidate, campaign, round2);

    // Step 5: After Round 2 completion, send result
    const round2Result = {
        status: 'passed' as const,
        score: 85,
        feedback: 'Great problem-solving skills!',
    };

    const round3 = {
        id: 'round-3',
        name: 'HR Interview',
        scheduled_date: '2024-01-20T14:00:00Z',
        round_number: 3,
    };

    await sendResultEmail(candidate, campaign, round2, round2Result, round3);

    console.log('Campaign application flow completed successfully!');
};

// ============================================================================
// Example 8: Error Handling Best Practices
// ============================================================================

export const exampleErrorHandling = async () => {
    const candidate = {
        id: 'candidate-123',
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
    };

    const campaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
    };

    try {
        const result = await sendInvitationEmail(candidate, campaign);

        if (result.success) {
            // Email sent successfully
            console.log('✓ Email sent:', result.emailId);

            // Update database to track email sent
            // await updateInvitationStatus(invitationId, 'sent', result.emailId);
        } else {
            // Email failed to send
            console.error('✗ Email failed:', result.error);

            // Log error for monitoring
            // await logEmailError(candidate.id, campaign.id, result.error);

            // Optionally retry or notify admin
            // await notifyAdminOfEmailFailure(candidate.email, result.error);
        }
    } catch (error) {
        // Network error or unexpected error
        console.error('✗ Unexpected error:', error);

        // Log critical error
        // await logCriticalError('email_service', error);

        // Fallback: queue for retry
        // await queueEmailForRetry(candidate, campaign);
    }
};
