# Campaign Notifications Integration Guide

This guide shows how to integrate the campaign notification service into your campaign workflow components.

## Integration Points

The notification service should be integrated at these key points in the campaign workflow:

### 1. Campaign Invitation Flow

**Location:** Invitation management UI / Employer dashboard

**When:** Employer sends invitations to candidates

```typescript
// In your invitation handler component
import { sendInvitationEmail, sendBatchInvitationEmails } from '@/services/campaignNotifications';

// Single invitation
const handleSendInvitation = async (candidateId: string, campaignId: string, message: string) => {
  try {
    // Fetch candidate and campaign data
    const { data: candidate } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', candidateId)
      .single();

    const { data: campaign } = await supabase
      .from('hiring_campaigns')
      .select('id, name, jobs(title)')
      .eq('id', campaignId)
      .single();

    // Create invitation record in database
    const { data: invitation, error } = await supabase
      .from('campaign_invitations')
      .insert({
        campaign_id: campaignId,
        candidate_id: candidateId,
        employer_id: currentUser.id,
        status: 'pending',
        message: message,
      })
      .select()
      .single();

    if (error) throw error;

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      candidate,
      {
        id: campaign.id,
        name: campaign.name,
        job_title: campaign.jobs?.title,
      },
      message
    );

    if (emailResult.success) {
      // Update invitation with email ID
      await supabase
        .from('campaign_invitations')
        .update({ email_id: emailResult.emailId })
        .eq('id', invitation.id);

      toast.success('Invitation sent successfully!');
    } else {
      toast.error('Failed to send invitation email');
      console.error(emailResult.error);
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    toast.error('Failed to send invitation');
  }
};

// Batch invitations
const handleBatchInvite = async (candidateIds: string[], campaignId: string, message: string) => {
  try {
    // Fetch candidates
    const { data: candidates } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', candidateIds);

    // Fetch campaign
    const { data: campaign } = await supabase
      .from('hiring_campaigns')
      .select('id, name, jobs(title)')
      .eq('id', campaignId)
      .single();

    // Create invitation records
    const invitations = candidateIds.map(candidateId => ({
      campaign_id: campaignId,
      candidate_id: candidateId,
      employer_id: currentUser.id,
      status: 'pending',
      message: message,
    }));

    await supabase.from('campaign_invitations').insert(invitations);

    // Send batch emails
    const results = await sendBatchInvitationEmails(
      candidates,
      {
        id: campaign.id,
        name: campaign.name,
        job_title: campaign.jobs?.title,
      },
      message
    );

    const successCount = results.filter(r => r.success).length;
    toast.success(`${successCount}/${candidates.length} invitations sent`);
  } catch (error) {
    console.error('Error sending batch invitations:', error);
    toast.error('Failed to send invitations');
  }
};
```

---

### 2. Round Result Publishing

**Location:** Employer campaign dashboard / Round management

**When:** Employer publishes results for a round

```typescript
// In your round result handler component
import { sendResultEmail } from '@/services/campaignNotifications';

const handlePublishResult = async (
  applicationId: string,
  roundId: string,
  score: number,
  status: 'passed' | 'failed',
  feedback?: string
) => {
  try {
    // Fetch application with candidate and campaign data
    const { data: application } = await supabase
      .from('campaign_applications')
      .select(`
        id,
        current_round,
        profiles!candidate_id (id, full_name, email),
        hiring_campaigns!campaign_id (
          id,
          name,
          jobs(title)
        )
      `)
      .eq('id', applicationId)
      .single();

    // Fetch current round
    const { data: round } = await supabase
      .from('campaign_rounds')
      .select('id, name, scheduled_date, round_number')
      .eq('id', roundId)
      .single();

    // Create round result record
    const { error: resultError } = await supabase
      .from('campaign_round_results')
      .insert({
        application_id: applicationId,
        round_id: roundId,
        score: score,
        status: status,
        feedback: feedback,
        completed_at: new Date().toISOString(),
      });

    if (resultError) throw resultError;

    // Update application status
    if (status === 'passed') {
      // Move to next round
      await supabase
        .from('campaign_applications')
        .update({ current_round: round.round_number + 1 })
        .eq('id', applicationId);

      // Fetch next round
      const { data: nextRound } = await supabase
        .from('campaign_rounds')
        .select('id, name, scheduled_date, round_number')
        .eq('campaign_id', application.hiring_campaigns.id)
        .eq('round_number', round.round_number + 1)
        .single();

      // Send result email with next round
      await sendResultEmail(
        application.profiles,
        {
          id: application.hiring_campaigns.id,
          name: application.hiring_campaigns.name,
          job_title: application.hiring_campaigns.jobs?.title,
        },
        round,
        { status, score, feedback },
        nextRound
      );
    } else {
      // Mark as failed
      await supabase
        .from('campaign_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      // Send result email without next round
      await sendResultEmail(
        application.profiles,
        {
          id: application.hiring_campaigns.id,
          name: application.hiring_campaigns.name,
          job_title: application.hiring_campaigns.jobs?.title,
        },
        round,
        { status, score, feedback }
      );
    }

    toast.success('Result published and email sent!');
  } catch (error) {
    console.error('Error publishing result:', error);
    toast.error('Failed to publish result');
  }
};
```

---

### 3. Scheduled Reminder System

**Location:** Backend cron job / Scheduled task

**When:** Daily at a specific time (e.g., 9 AM)

#### Option A: Using Supabase Cron (Recommended)

Create a database function and schedule it:

```sql
-- Create function to send reminders
CREATE OR REPLACE FUNCTION send_campaign_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called by the edge function
  -- The actual logic is in the edge function
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-scheduled-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  );
END;
$$;

-- Schedule to run daily at 9 AM
SELECT cron.schedule(
  'send-campaign-reminders',
  '0 9 * * *',
  'SELECT send_campaign_reminders();'
);
```

#### Option B: Using Node.js Cron Job

```typescript
// In your backend server (e.g., server.ts)
import cron from 'node-cron';
import { sendScheduledReminders } from './services/campaignNotifications';

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled reminder job...');
  
  try {
    const results = await sendScheduledReminders();
    console.log(`Sent ${results.length} reminder emails`);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Success: ${successCount}, Failed: ${failureCount}`);
  } catch (error) {
    console.error('Error in scheduled reminder job:', error);
  }
});
```

#### Option C: Using Vercel Cron Jobs

```typescript
// In pages/api/cron/send-reminders.ts
import { sendScheduledReminders } from '@/services/campaignNotifications';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = await sendScheduledReminders();
    const successCount = results.filter(r => r.success).length;
    
    return res.status(200).json({
      success: true,
      sent: results.length,
      succeeded: successCount,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return res.status(500).json({ error: 'Failed to send reminders' });
  }
}
```

Then configure in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

### 4. Manual Reminder Trigger

**Location:** Employer dashboard / Round management

**When:** Employer manually sends a reminder

```typescript
// In your round management component
import { sendRoundReminderEmail } from '@/services/campaignNotifications';

const handleSendManualReminder = async (roundId: string) => {
  try {
    // Fetch round with campaign and candidates
    const { data: round } = await supabase
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
          jobs(title)
        )
      `)
      .eq('id', roundId)
      .single();

    // Fetch all candidates in this round
    const { data: applications } = await supabase
      .from('campaign_applications')
      .select(`
        candidate_id,
        current_round,
        status,
        profiles!candidate_id (id, full_name, email)
      `)
      .eq('campaign_id', round.campaign_id)
      .eq('current_round', round.round_number)
      .eq('status', 'active');

    // Send reminders to all candidates
    const results = await Promise.allSettled(
      applications.map(app =>
        sendRoundReminderEmail(
          app.profiles,
          {
            id: round.hiring_campaigns.id,
            name: round.hiring_campaigns.name,
            job_title: round.hiring_campaigns.jobs?.title,
          },
          round
        )
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    toast.success(`Sent ${successCount}/${applications.length} reminders`);
  } catch (error) {
    console.error('Error sending manual reminders:', error);
    toast.error('Failed to send reminders');
  }
};
```

---

## Component Examples

### Invitation Dialog Component

```typescript
// components/employer/SendInvitationDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendInvitationEmail } from '@/services/campaignNotifications';

interface SendInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: { id: string; full_name: string; email: string };
  campaign: { id: string; name: string; job_title?: string };
}

export function SendInvitationDialog({
  open,
  onOpenChange,
  candidate,
  campaign,
}: SendInvitationDialogProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await sendInvitationEmail(candidate, campaign, message);
      
      if (result.success) {
        toast.success('Invitation sent successfully!');
        onOpenChange(false);
      } else {
        toast.error('Failed to send invitation');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invitation to {candidate.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Campaign</label>
            <p className="text-sm text-muted-foreground">{campaign.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Custom Message (Optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={loading}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Result Publishing Component

```typescript
// components/employer/PublishResultDialog.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendResultEmail } from '@/services/campaignNotifications';

interface PublishResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  round: any;
  campaign: any;
  nextRound?: any;
}

export function PublishResultDialog({
  open,
  onOpenChange,
  application,
  round,
  campaign,
  nextRound,
}: PublishResultDialogProps) {
  const [score, setScore] = useState('');
  const [status, setStatus] = useState<'passed' | 'failed'>('passed');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      // Save result to database
      await supabase.from('campaign_round_results').insert({
        application_id: application.id,
        round_id: round.id,
        score: parseFloat(score),
        status,
        feedback,
      });

      // Update application
      if (status === 'passed') {
        await supabase
          .from('campaign_applications')
          .update({ current_round: round.round_number + 1 })
          .eq('id', application.id);
      } else {
        await supabase
          .from('campaign_applications')
          .update({ status: 'rejected' })
          .eq('id', application.id);
      }

      // Send email
      const result = await sendResultEmail(
        application.profiles,
        campaign,
        round,
        { status, score: parseFloat(score), feedback },
        status === 'passed' ? nextRound : undefined
      );

      if (result.success) {
        toast.success('Result published and email sent!');
        onOpenChange(false);
      } else {
        toast.error('Result saved but email failed to send');
      }
    } catch (error) {
      toast.error('Failed to publish result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Result for {application.profiles.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Score</label>
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Feedback (Optional)</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback to the candidate..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish Result'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Testing Integration

Test your integration with these scenarios:

### 1. Test Invitation Flow
- Send invitation to a test candidate
- Check email is received
- Verify invitation record in database
- Check email ID is stored

### 2. Test Result Flow
- Publish a passed result
- Verify email includes next round details
- Publish a failed result
- Verify email doesn't include next round

### 3. Test Reminder Flow
- Create a round scheduled for tomorrow
- Run scheduled reminder job
- Verify reminders are sent to active candidates

### 4. Test Error Handling
- Test with invalid email address
- Test with missing required fields
- Test with network errors
- Verify graceful error handling

---

## Monitoring & Logging

Add logging to track email activity:

```typescript
// Create email log table
await supabase.from('email_logs').insert({
  type: 'invitation',
  candidate_id: candidate.id,
  campaign_id: campaign.id,
  email_id: result.emailId,
  status: result.success ? 'sent' : 'failed',
  error: result.error,
  sent_at: new Date().toISOString(),
});
```

Monitor key metrics:
- Total emails sent
- Success/failure rate
- Average send time
- Email open rate (from Resend)
- Email click rate (from Resend)

---

## Next Steps

1. ✅ Deploy the edge function
2. ✅ Configure environment variables
3. ✅ Integrate into invitation flow
4. ✅ Integrate into result publishing
5. ✅ Set up scheduled reminders
6. ✅ Add logging and monitoring
7. ✅ Test all flows thoroughly
8. ✅ Monitor email delivery in production

For more details, see:
- Service documentation: `CAMPAIGN_NOTIFICATIONS_README.md`
- Usage examples: `campaignNotifications.example.ts`
- Edge function docs: `supabase/functions/send-campaign-email/README.md`
