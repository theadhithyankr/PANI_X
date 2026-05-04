const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
    serve: (handler: (req: Request) => Response | Promise<Response>) => void;
    env: {
        get: (key: string) => string | undefined;
    };
};

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

interface EmailRequest {
    type: 'invitation' | 'reminder' | 'result';
    candidate: Candidate;
    campaign: Campaign;
    message?: string;
    round?: Round;
    result?: Result;
    nextRound?: Round;
}

const generateEmailContent = (request: EmailRequest): { subject: string; html: string; text: string } => {
    const { type, candidate, campaign, message, round, result, nextRound } = request;
    const campaignUrl = `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/campaigns/${campaign.id}`;

    if (type === 'invitation') {
        const subject = `You're invited to ${campaign.name}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Campaign Invitation</h2>
        <p>Hi ${candidate.full_name},</p>
        <p>You've been invited to participate in <strong>${campaign.name}</strong>${campaign.job_title ? ` for the ${campaign.job_title} position` : ''}.</p>
        ${message ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="margin: 0;">${message}</p></div>` : ''}
        <p>Click the link below to view campaign details and apply:</p>
        <a href="${campaignUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Campaign</a>
        <p style="color: #666; font-size: 14px;">This is an automated notification from the PANI hiring platform.</p>
      </div>
    `;
        const text = `Hi ${candidate.full_name},\n\nYou've been invited to participate in ${campaign.name}${campaign.job_title ? ` for the ${campaign.job_title} position` : ''}.\n\n${message ? `${message}\n\n` : ''}View campaign details: ${campaignUrl}`;

        return { subject, html, text };
    }

    if (type === 'reminder' && round) {
        const roundDate = new Date(round.scheduled_date);
        const formattedDate = roundDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const subject = `Reminder: ${round.name} scheduled for tomorrow`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Round Reminder</h2>
        <p>Hi ${candidate.full_name},</p>
        <p>This is a reminder that you have <strong>${round.name}</strong> (Round ${round.round_number}) scheduled for tomorrow in the <strong>${campaign.name}</strong> campaign.</p>
        <div style="background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">📅 ${formattedDate}</p>
        </div>
        <p>Make sure you're prepared and ready for the assessment.</p>
        <a href="${campaignUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Campaign Details</a>
        <p style="color: #666; font-size: 14px;">Good luck!</p>
      </div>
    `;
        const text = `Hi ${candidate.full_name},\n\nThis is a reminder that you have ${round.name} (Round ${round.round_number}) scheduled for tomorrow in the ${campaign.name} campaign.\n\nScheduled: ${formattedDate}\n\nView campaign details: ${campaignUrl}`;

        return { subject, html, text };
    }

    if (type === 'result' && round && result) {
        const isPassed = result.status === 'passed';
        const subject = `${campaign.name} - ${round.name} Result: ${isPassed ? 'Passed ✓' : 'Not Selected'}`;

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Round Result</h2>
        <p>Hi ${candidate.full_name},</p>
        <p>Your result for <strong>${round.name}</strong> (Round ${round.round_number}) in the <strong>${campaign.name}</strong> campaign is now available.</p>
        <div style="background: ${isPassed ? '#D1FAE5' : '#FEE2E2'}; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0; color: ${isPassed ? '#065F46' : '#991B1B'};">${isPassed ? '✓ Congratulations! You Passed' : 'Not Selected'}</h3>
          ${result.score !== undefined ? `<p style="font-size: 24px; font-weight: bold; margin: 10px 0;">Score: ${result.score}</p>` : ''}
        </div>
        ${result.feedback ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="margin: 0;"><strong>Feedback:</strong> ${result.feedback}</p></div>` : ''}
        ${isPassed && nextRound ? `
          <div style="background: #EEF2FF; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Next Round:</strong> ${nextRound.name}</p>
            <p style="margin: 5px 0 0 0; color: #666;">Scheduled: ${new Date(nextRound.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        ` : ''}
        <a href="${campaignUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Campaign Details</a>
        <p style="color: #666; font-size: 14px;">${isPassed ? 'Best of luck for the next round!' : 'Thank you for your participation.'}</p>
      </div>
    `;

        const text = `Hi ${candidate.full_name},\n\nYour result for ${round.name} (Round ${round.round_number}) in the ${campaign.name} campaign:\n\nStatus: ${isPassed ? 'PASSED ✓' : 'NOT SELECTED'}\n${result.score !== undefined ? `Score: ${result.score}\n` : ''}${result.feedback ? `\nFeedback: ${result.feedback}\n` : ''}${isPassed && nextRound ? `\nNext Round: ${nextRound.name}\nScheduled: ${new Date(nextRound.scheduled_date).toLocaleDateString()}\n` : ''}\nView campaign details: ${campaignUrl}`;

        return { subject, html, text };
    }

    throw new Error('Invalid email request type or missing required fields');
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const emailRequest = (await req.json()) as EmailRequest;

        // Validate required fields
        if (!emailRequest.type || !emailRequest.candidate || !emailRequest.campaign) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: type, candidate, campaign' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        if (!emailRequest.candidate.email) {
            return new Response(
                JSON.stringify({ error: 'Candidate email is required' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Generate email content
        const { subject, html, text } = generateEmailContent(emailRequest);

        // Check if Resend API key is configured
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!resendApiKey) {
            // Log the email instead of sending (for development/testing)
            console.log('Email would be sent:', {
                to: emailRequest.candidate.email,
                subject,
                text,
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Email logged (RESEND_API_KEY not configured)',
                    preview: { to: emailRequest.candidate.email, subject }
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Send email using Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: Deno.env.get('EMAIL_FROM') || 'PANI Hiring <noreply@pani.app>',
                to: emailRequest.candidate.email,
                subject,
                html,
                text,
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('Resend API error:', errorText);

            return new Response(
                JSON.stringify({
                    error: 'Failed to send email',
                    details: errorText.slice(0, 500)
                }),
                {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        const resendData = await resendResponse.json();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Email sent successfully',
                emailId: resendData.id
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Edge function error:', error);

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
