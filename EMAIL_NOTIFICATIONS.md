# Email Notifications Setup

This guide explains how to set up email notifications for Gastbook.

## Overview

Email notifications are sent when:
- A user receives a friend request
- A friend request is accepted
- A user receives a new message
- A user receives a comment on their post
- A user receives a like on their post
- A user is mentioned in a post or comment
- A group join request is accepted/rejected

## Setup Options

### Option 1: Supabase Email (Recommended for Development)

Supabase provides built-in email functionality through their Auth service. However, for custom emails, you'll need to use Supabase Edge Functions or an external service.

### Option 2: Resend (Recommended for Production)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_api_key_here
   ```

### Option 3: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to `.env.local`:
   ```
   SENDGRID_API_KEY=your_api_key_here
   ```

## Implementation

### 1. Install Dependencies

For Resend:
```bash
npm install resend
```

For SendGrid:
```bash
npm install @sendgrid/mail
```

### 2. Create Email Service

Create `lib/email.ts` with your email service implementation.

### 3. Database Triggers

Set up database triggers in Supabase to automatically send emails when events occur:

```sql
-- Example trigger for friend requests
CREATE OR REPLACE FUNCTION send_friend_request_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call your email API endpoint
  PERFORM net.http_post(
    url := 'https://your-domain.com/api/notifications/email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.api_key')
    ),
    body := jsonb_build_object(
      'type', 'friend_request',
      'user_id', NEW.friend_id,
      'from_user_id', NEW.user_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friend_request_email_trigger
  AFTER INSERT ON public.friends
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION send_friend_request_email();
```

### 4. API Route

Create `app/api/notifications/email/route.ts` to handle email sending.

### 5. User Preferences

Add email notification preferences to user profiles:

```sql
ALTER TABLE public.profiles
ADD COLUMN email_notifications JSONB DEFAULT '{
  "friend_requests": true,
  "messages": true,
  "comments": true,
  "likes": true,
  "mentions": true,
  "group_updates": true
}'::jsonb;
```

## Next Steps

1. Choose an email service provider
2. Set up API keys in environment variables
3. Implement the email service in `lib/email.ts`
4. Create API routes for sending emails
5. Set up database triggers (optional, or use application-level triggers)
6. Add user preferences UI in settings page

## Example Email Templates

Email templates should be created in your email service or as React Email templates.

