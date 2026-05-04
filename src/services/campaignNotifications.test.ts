import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendInvitationEmail, sendRoundReminderEmail, sendResultEmail, sendBatchInvitationEmails } from './campaignNotifications';
import { supabase } from '../utils/supabase/client';

// Mock the Supabase client
vi.mock('../utils/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('Campaign Notifications Service', () => {
    const mockCandidate = {
        id: 'candidate-123',
        full_name: 'John Doe',
        email: 'john@example.com',
    };

    const mockCampaign = {
        id: 'campaign-456',
        name: 'Software Engineer Hiring Drive 2024',
        job_title: 'Senior Software Engineer',
    };

    const mockRound = {
        id: 'round-789',
        name: 'Technical Assessment',
        scheduled_date: '2024-01-15T10:00:00Z',
        round_number: 2,
    };

    const mockResult = {
        status: 'passed' as const,
        score: 85,
        feedback: 'Great problem-solving skills!',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendInvitationEmail', () => {
        it('should send invitation email successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Email sent successfully',
                emailId: 'email-123',
            };

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: mockResponse,
                error: null,
            });

            const result = await sendInvitationEmail(mockCandidate, mockCampaign, 'Welcome!');

            expect(supabase.functions.invoke).toHaveBeenCalledWith('send-campaign-email', {
                body: {
                    type: 'invitation',
                    candidate: mockCandidate,
                    campaign: mockCampaign,
                    message: 'Welcome!',
                },
            });

            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when sending invitation email', async () => {
            const mockError = new Error('Network error');

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: null,
                error: mockError,
            });

            await expect(sendInvitationEmail(mockCandidate, mockCampaign)).rejects.toThrow('Network error');
        });
    });

    describe('sendRoundReminderEmail', () => {
        it('should send round reminder email successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Email sent successfully',
                emailId: 'email-456',
            };

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: mockResponse,
                error: null,
            });

            const result = await sendRoundReminderEmail(mockCandidate, mockCampaign, mockRound);

            expect(supabase.functions.invoke).toHaveBeenCalledWith('send-campaign-email', {
                body: {
                    type: 'reminder',
                    candidate: mockCandidate,
                    campaign: mockCampaign,
                    round: mockRound,
                },
            });

            expect(result).toEqual(mockResponse);
        });

        it('should handle errors when sending reminder email', async () => {
            const mockError = new Error('Service unavailable');

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: null,
                error: mockError,
            });

            await expect(sendRoundReminderEmail(mockCandidate, mockCampaign, mockRound)).rejects.toThrow('Service unavailable');
        });
    });

    describe('sendResultEmail', () => {
        it('should send result email successfully with next round', async () => {
            const mockNextRound = {
                id: 'round-790',
                name: 'HR Interview',
                scheduled_date: '2024-01-20T14:00:00Z',
                round_number: 3,
            };

            const mockResponse = {
                success: true,
                message: 'Email sent successfully',
                emailId: 'email-789',
            };

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: mockResponse,
                error: null,
            });

            const result = await sendResultEmail(mockCandidate, mockCampaign, mockRound, mockResult, mockNextRound);

            expect(supabase.functions.invoke).toHaveBeenCalledWith('send-campaign-email', {
                body: {
                    type: 'result',
                    candidate: mockCandidate,
                    campaign: mockCampaign,
                    round: mockRound,
                    result: mockResult,
                    nextRound: mockNextRound,
                },
            });

            expect(result).toEqual(mockResponse);
        });

        it('should send result email successfully without next round', async () => {
            const failedResult = {
                status: 'failed' as const,
                score: 45,
                feedback: 'Needs improvement in algorithms',
            };

            const mockResponse = {
                success: true,
                message: 'Email sent successfully',
                emailId: 'email-790',
            };

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: mockResponse,
                error: null,
            });

            const result = await sendResultEmail(mockCandidate, mockCampaign, mockRound, failedResult);

            expect(supabase.functions.invoke).toHaveBeenCalledWith('send-campaign-email', {
                body: {
                    type: 'result',
                    candidate: mockCandidate,
                    campaign: mockCampaign,
                    round: mockRound,
                    result: failedResult,
                    nextRound: undefined,
                },
            });

            expect(result).toEqual(mockResponse);
        });
    });

    describe('sendBatchInvitationEmails', () => {
        it('should send batch invitation emails successfully', async () => {
            const mockCandidates = [
                { id: '1', full_name: 'Alice', email: 'alice@example.com' },
                { id: '2', full_name: 'Bob', email: 'bob@example.com' },
            ];

            const mockResponse = {
                success: true,
                message: 'Email sent successfully',
                emailId: 'email-batch',
            };

            vi.mocked(supabase.functions.invoke).mockResolvedValue({
                data: mockResponse,
                error: null,
            });

            const results = await sendBatchInvitationEmails(mockCandidates, mockCampaign, 'Join us!');

            expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual(mockResponse);
            expect(results[1]).toEqual(mockResponse);
        });

        it('should handle partial failures in batch sending', async () => {
            const mockCandidates = [
                { id: '1', full_name: 'Alice', email: 'alice@example.com' },
                { id: '2', full_name: 'Bob', email: 'bob@example.com' },
            ];

            const mockSuccessResponse = {
                success: true,
                message: 'Email sent successfully',
                emailId: 'email-success',
            };

            const mockError = new Error('Failed to send');

            vi.mocked(supabase.functions.invoke)
                .mockResolvedValueOnce({ data: mockSuccessResponse, error: null })
                .mockResolvedValueOnce({ data: null, error: mockError });

            const results = await sendBatchInvitationEmails(mockCandidates, mockCampaign);

            expect(results).toHaveLength(2);
            expect(results[0]).toEqual(mockSuccessResponse);
            expect(results[1]).toMatchObject({
                success: false,
                message: 'Failed to send email',
            });
        });
    });
});
