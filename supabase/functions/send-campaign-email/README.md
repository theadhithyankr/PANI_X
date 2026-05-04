# Send Campaign Email Edge Function

This Supabase Edge Function handles sending email notifications for the Event-Based Hiring Campaign System.

## Features

- **Invitation Emails**: Send campaign invitations to candidates with custom messages
- **Round Reminders**: Send 24-hour reminders before scheduled rounds
- **Result Notifications**: Send pass/fail notifications with scores and feedback

## Environment Variables

Required environment variables (set in Supabase Dashboard > Edge Functions > Secrets):

- `RESEND_API_KEY` - API key from Resend.com for sending emails (optional for development)
- `EMAIL_FROM` - Sender email address (default: `PANI Hiring <noreply@pani.app>`)
- `APP_URL` - Frontend application URL for generating campaign links (default: `http://localhost:5173`)

## Setup

### 1. Get a Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain (or use the test domain for development)

### 2. Configure Secrets

```bash
# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Set the sender email (optional)
supabase secrets set EMAIL_FROM="PANI Hiring <noreply@yourdomain.com>"

# Set the app URL (optional, for production)
supabase secrets set APP_URL=https://yourapp.com
```

### 3. Deploy the Function

```bash
supabase functions deploy send-campaign-email
```

## API Reference

### Request Format

```typescript
POST /send-campaign-email

{
  "type": "invitation" | "reminder" | "result",
  "candidate": {
    "id": "string",
    "full_name": "string",
    "email": "string"
  },
  "campaign": {
    "id": "string",
    "name": "string",
    "job_title": "string" // optional
  },
  "message": "string", // optional, for invitation type
  "round": { // required for reminder and result types
    "id": "string",
    "name": "string",
    "scheduled_date": "ISO 8601 date string",
    "round_number": number
  },
  "result": { // required for result type
    "status": "passed" | "failed",
    "score": number, // optional
    "feedback": "string" // optional
  },
  "nextRound": { // optional, for result type when passed
    "id": "string",
    "name": "string",
    "scheduled_date": "ISO 8601 date string",
    "round_number": number
  }
}
```

### Response Format

```typescript
{
  "success": boolean,
  "message": "string",
  "emailId": "string", // Resend email ID (when sent)
  "preview": { // When RESEND_API_KEY is not configured
    "to": "string",
    "subject": "string"
  }
}
```

### Error Response

```typescript
{
  "error": "string",
  "details": "string" // optional
}
```

## Email Types

### 1. Invitation Email

Sent when an employer invites a candidate to a campaign.

**Includes:**
- Campaign name and job title
- Custom message from employer (optional)
- Direct link to campaign page

### 2. Round Reminder Email

Sent 24 hours before a scheduled round.

**Includes:**
- Round name and number
- Scheduled date and time
- Campaign name
- Direct link to campaign page

### 3. Result Email

Sent when a round result is published.

**Includes:**
- Pass/fail status
- Score (if available)
- Feedback (if provided)
- Next round details (if passed)
- Direct link to campaign page

## Development Mode

When `RESEND_API_KEY` is not configured, the function will:
- Log email details to console
- Return success with preview data
- Not actually send emails

This is useful for local development and testing.

## Testing

### Test Invitation Email

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-campaign-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "invitation",
    "candidate": {
      "id": "123",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "campaign": {
      "id": "456",
      "name": "Software Engineer Hiring Drive 2024",
      "job_title": "Senior Software Engineer"
    },
    "message": "We think you would be a great fit for this role!"
  }'
```

### Test Reminder Email

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-campaign-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "reminder",
    "candidate": {
      "id": "123",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "campaign": {
      "id": "456",
      "name": "Software Engineer Hiring Drive 2024"
    },
    "round": {
      "id": "789",
      "name": "Technical Assessment",
      "scheduled_date": "2024-01-15T10:00:00Z",
      "round_number": 2
    }
  }'
```

### Test Result Email

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-campaign-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "result",
    "candidate": {
      "id": "123",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "campaign": {
      "id": "456",
      "name": "Software Engineer Hiring Drive 2024"
    },
    "round": {
      "id": "789",
      "name": "Technical Assessment",
      "scheduled_date": "2024-01-15T10:00:00Z",
      "round_number": 2
    },
    "result": {
      "status": "passed",
      "score": 85,
      "feedback": "Great problem-solving skills!"
    },
    "nextRound": {
      "id": "790",
      "name": "HR Interview",
      "scheduled_date": "2024-01-20T14:00:00Z",
      "round_number": 3
    }
  }'
```

## Error Handling

The function includes comprehensive error handling:

- **400 Bad Request**: Missing required fields or invalid request format
- **405 Method Not Allowed**: Non-POST requests
- **502 Bad Gateway**: Email service (Resend) errors
- **500 Internal Server Error**: Unexpected errors

All errors include descriptive messages and details for debugging.

## Security

- CORS headers allow requests from any origin (adjust for production)
- Requires Supabase authentication via `authorization` header
- API keys stored securely as Supabase secrets
- Email addresses validated before sending

## Monitoring

Monitor email delivery in:
1. Supabase Dashboard > Edge Functions > Logs
2. Resend Dashboard > Emails

## Troubleshooting

### Emails not sending

1. Check if `RESEND_API_KEY` is set correctly
2. Verify domain is verified in Resend
3. Check Edge Function logs for errors
4. Ensure candidate email addresses are valid

### Invalid email format errors

- Ensure all required fields are provided
- Check date formats are ISO 8601
- Verify email addresses are valid

### Rate limiting

Resend has rate limits based on your plan. For high-volume sending:
- Upgrade your Resend plan
- Implement batching with delays
- Use the batch sending function in the frontend service
