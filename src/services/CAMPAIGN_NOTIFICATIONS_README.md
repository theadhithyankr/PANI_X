# Campaign Notifications Service

A comprehensive email notification service for the Event-Based Hiring Campaign System. This service handles all campaign-related email communications including invitations, round reminders, and result notifications.

## Features

- ✉️ **Campaign Invitations**: Send personalized invitation emails to candidates
- ⏰ **Round Reminders**: Automated 24-hour reminders before scheduled rounds
- 📊 **Result Notifications**: Pass/fail notifications with scores and feedback
- 📦 **Batch Operations**: Send invitations to multiple candidates efficiently
- 🔄 **Scheduled Reminders**: Automated reminder system for upcoming rounds
- 🛡️ **Error Handling**: Comprehensive error handling and logging
- 🧪 **Fully Tested**: Complete test coverage with Vitest

## Architecture

```
Frontend Service (campaignNotifications.ts)
    ↓
Supabase Edge Function (send-campaign-email)
    ↓
Resend Email API
    ↓
Candidate's Email Inbox
```

## Installation & Setup

### 1. Deploy the Edge Function

```bash
cd supabase/functions/send-campaign-email
supabase functions deploy send-campaign-email
```

### 2. Configure Environment Variables

Set these secrets in your Supabase project:

```bash
# Required for production
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional (with defaults)
supabase secrets set EMAIL_FROM="PANI Hiring <noreply@yourdomain.com>"
supabase secrets set APP_URL=https://yourapp.com
```

### 3. Get a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain (or use test domain for development)

## Usage

### Import the Service

```typescript
import {
  sendInvitationEmail,
  sendRoundReminderEmail,
  sendResultEmail,
  sendBatchInvitationEmails,
  sendScheduledReminders,
} from '@/services/campaignNotifications';
```

### Send Campaign Invitation

```typescript
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

const result = await sendInvitationEmail(
  candidate,
  campaign,
  'We think you would be a great fit!' // optional custom message
);

if (result.success) {
  console.log('Invitation sent!', result.emailId);
}
```

### Send Round Reminder

```typescript
const round = {
  id: 'round-789',
  name: 'Technical Assessment',
  scheduled_date: '2024-01-15T10:00:00Z',
  round_number: 2,
};

const result = await sendRoundReminderEmail(candidate, campaign, round);
```

### Send Result Notification

```typescript
// For passed candidates
const result = {
  status: 'passed',
  score: 85,
  feedback: 'Excellent problem-solving skills!',
};

const nextRound = {
  id: 'round-790',
  name: 'HR Interview',
  scheduled_date: '2024-01-20T14:00:00Z',
  round_number: 3,
};

await sendResultEmail(candidate, campaign, round, result, nextRound);

// For failed candidates (no nextRound)
const failedResult = {
  status: 'failed',
  score: 45,
  feedback: 'Needs improvement in algorithms.',
};

await sendResultEmail(candidate, campaign, round, failedResult);
```

### Batch Send Invitations

```typescript
const candidates = [
  { id: '1', full_name: 'Alice', email: 'alice@example.com' },
  { id: '2', full_name: 'Bob', email: 'bob@example.com' },
  { id: '3', full_name: 'Carol', email: 'carol@example.com' },
];

const results = await sendBatchInvitationEmails(
  candidates,
  campaign,
  'Join our hiring campaign!'
);

// Check results
const successCount = results.filter(r => r.success).length;
console.log(`${successCount}/${candidates.length} emails sent`);
```

### Automated Scheduled Reminders

```typescript
// This should be called by a cron job/scheduled task
// It automatically finds rounds happening in 24-48 hours and sends reminders
const results = await sendScheduledReminders();
console.log(`Sent ${results.length} reminder emails`);
```

## API Reference

### `sendInvitationEmail(candidate, campaign, message?)`

Send a campaign invitation email to a candidate.

**Parameters:**
- `candidate` (object): Candidate information
  - `id` (string): Candidate ID
  - `full_name` (string): Candidate's full name
  - `email` (string): Candidate's email address
- `campaign` (object): Campaign information
  - `id` (string): Campaign ID
  - `name` (string): Campaign name
  - `job_title` (string, optional): Job title
- `message` (string, optional): Custom message from employer

**Returns:** `Promise<EmailResponse>`

---

### `sendRoundReminderEmail(candidate, campaign, round)`

Send a 24-hour reminder email for an upcoming round.

**Parameters:**
- `candidate` (object): Candidate information
- `campaign` (object): Campaign information
- `round` (object): Round information
  - `id` (string): Round ID
  - `name` (string): Round name
  - `scheduled_date` (string): ISO 8601 date string
  - `round_number` (number): Round number

**Returns:** `Promise<EmailResponse>`

---

### `sendResultEmail(candidate, campaign, round, result, nextRound?)`

Send a result notification email for a completed round.

**Parameters:**
- `candidate` (object): Candidate information
- `campaign` (object): Campaign information
- `round` (object): Completed round information
- `result` (object): Result information
  - `status` ('passed' | 'failed'): Result status
  - `score` (number, optional): Score achieved
  - `feedback` (string, optional): Feedback message
- `nextRound` (object, optional): Next round information (if passed)

**Returns:** `Promise<EmailResponse>`

---

### `sendBatchInvitationEmails(candidates, campaign, message?)`

Send invitation emails to multiple candidates.

**Parameters:**
- `candidates` (array): Array of candidate objects
- `campaign` (object): Campaign information
- `message` (string, optional): Custom message

**Returns:** `Promise<EmailResponse[]>`

---

### `sendScheduledReminders()`

Send reminder emails for all rounds happening in the next 24-48 hours.

**Returns:** `Promise<EmailResponse[]>`

---

### `EmailResponse` Type

```typescript
interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string; // Resend email ID (when sent)
  preview?: {       // When in development mode
    to: string;
    subject: string;
  };
  error?: string;   // Error message (when failed)
  details?: string; // Error details (when failed)
}
```

## Email Templates

### Invitation Email

**Subject:** You're invited to [Campaign Name]

**Content:**
- Campaign name and job title
- Custom message from employer (if provided)
- Direct link to campaign page
- Call-to-action button

---

### Reminder Email

**Subject:** Reminder: [Round Name] scheduled for tomorrow

**Content:**
- Round name and number
- Scheduled date and time (formatted)
- Campaign name
- Direct link to campaign page
- Motivational message

---

### Result Email (Passed)

**Subject:** [Campaign Name] - [Round Name] Result: Passed ✓

**Content:**
- Pass status with visual indicator
- Score (if available)
- Feedback (if provided)
- Next round details
- Direct link to campaign page
- Encouragement message

---

### Result Email (Failed)

**Subject:** [Campaign Name] - [Round Name] Result: Not Selected

**Content:**
- Fail status with visual indicator
- Score (if available)
- Feedback (if provided)
- Direct link to campaign page
- Thank you message

## Development Mode

When `RESEND_API_KEY` is not configured, the service operates in development mode:

- ✅ All functions work normally
- 📝 Email details are logged to console
- 🚫 No actual emails are sent
- ✨ Returns preview data instead

This is perfect for local development and testing without sending real emails.

## Testing

Run the test suite:

```bash
npm test src/services/campaignNotifications.test.ts
```

The test suite includes:
- ✅ Invitation email sending
- ✅ Reminder email sending
- ✅ Result email sending (passed and failed)
- ✅ Batch invitation sending
- ✅ Error handling
- ✅ Partial failure scenarios

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await sendInvitationEmail(candidate, campaign);
  
  if (result.success) {
    // Email sent successfully
    console.log('Email sent:', result.emailId);
  } else {
    // Email failed to send
    console.error('Email failed:', result.error);
    // Handle failure (retry, log, notify admin, etc.)
  }
} catch (error) {
  // Network error or unexpected error
  console.error('Unexpected error:', error);
  // Handle critical error
}
```

## Best Practices

### 1. Always Check Success Status

```typescript
const result = await sendInvitationEmail(candidate, campaign);
if (!result.success) {
  // Handle failure
  await logEmailFailure(candidate.id, result.error);
}
```

### 2. Use Batch Operations for Multiple Emails

```typescript
// ✅ Good: Use batch operation
await sendBatchInvitationEmails(candidates, campaign);

// ❌ Bad: Loop with individual calls
for (const candidate of candidates) {
  await sendInvitationEmail(candidate, campaign);
}
```

### 3. Handle Partial Failures in Batch Operations

```typescript
const results = await sendBatchInvitationEmails(candidates, campaign);

results.forEach((result, index) => {
  if (!result.success) {
    console.error(`Failed for ${candidates[index].email}:`, result.error);
    // Queue for retry or notify admin
  }
});
```

### 4. Use Scheduled Reminders with Cron

Set up a cron job to run `sendScheduledReminders()` daily:

```typescript
// Example: Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  await sendScheduledReminders();
});
```

### 5. Log Email Activity

```typescript
const result = await sendInvitationEmail(candidate, campaign);

if (result.success) {
  // Log to database for tracking
  await db.emailLogs.create({
    type: 'invitation',
    candidateId: candidate.id,
    campaignId: campaign.id,
    emailId: result.emailId,
    sentAt: new Date(),
  });
}
```

## Monitoring

### Track Email Delivery

1. **Supabase Dashboard**: Edge Functions > Logs
2. **Resend Dashboard**: Emails > Delivery Status
3. **Application Logs**: Console logs for debugging

### Key Metrics to Monitor

- Email send success rate
- Email delivery rate (from Resend)
- Email open rate (from Resend)
- Failed email attempts
- Average send time

## Troubleshooting

### Emails Not Sending

1. ✅ Check if `RESEND_API_KEY` is set
2. ✅ Verify domain is verified in Resend
3. ✅ Check Edge Function logs for errors
4. ✅ Ensure candidate email addresses are valid
5. ✅ Check Resend API rate limits

### Invalid Email Format Errors

1. ✅ Ensure all required fields are provided
2. ✅ Check date formats are ISO 8601
3. ✅ Verify email addresses are valid
4. ✅ Check round numbers are positive integers

### Rate Limiting

Resend has rate limits based on your plan:
- **Free**: 100 emails/day
- **Paid**: Higher limits based on plan

For high-volume sending:
1. Upgrade your Resend plan
2. Implement batching with delays
3. Use the batch sending function

## Security Considerations

- 🔒 API keys stored securely as Supabase secrets
- 🔒 Email addresses validated before sending
- 🔒 CORS headers configured for security
- 🔒 Requires Supabase authentication
- 🔒 No sensitive data in email content

## Requirements Validation

This service satisfies the following requirements from the spec:

- ✅ **8.1**: Send invitation emails within 5 minutes
- ✅ **8.2**: Send 24-hour reminder emails
- ✅ **8.3**: Send result emails within 5 minutes
- ✅ **8.4**: Include campaign name, round name, and date in reminders
- ✅ **8.5**: Include pass/fail status and score in result emails
- ✅ **8.6**: Include next round details when candidate passes
- ✅ **8.7**: Include direct link to campaign in all emails

## Future Enhancements

Potential improvements for future versions:

- 📧 Email templates customization
- 🌐 Multi-language support
- 📊 Email analytics dashboard
- 🔔 SMS notifications
- 📱 Push notifications
- 🎨 Rich HTML templates with branding
- 📅 Calendar invite attachments
- 🔄 Automatic retry mechanism
- 📈 A/B testing for email content

## Support

For issues or questions:
1. Check the Edge Function README: `supabase/functions/send-campaign-email/README.md`
2. Review usage examples: `src/services/campaignNotifications.example.ts`
3. Check test cases: `src/services/campaignNotifications.test.ts`
4. Review Supabase Edge Function logs
5. Check Resend dashboard for delivery issues

## License

Part of the PANI hiring platform project.
