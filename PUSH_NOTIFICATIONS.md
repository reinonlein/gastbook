# Push Notifications Setup

This guide explains how to set up push notifications for the Gastbook PWA.

## Prerequisites

1. Generate VAPID keys for web push notifications
2. Add VAPID keys to environment variables
3. Create push_subscriptions table in Supabase

## Step 1: Generate VAPID Keys

Install web-push CLI:
```bash
npm install -g web-push
```

Generate keys:
```bash
web-push generate-vapid-keys
```

This will output:
- Public Key (add to `.env.local` as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
- Private Key (add to `.env.local` as `VAPID_PRIVATE_KEY`)

## Step 2: Create Database Table

Run this SQL in Supabase:

```sql
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
```

## Step 3: Install Dependencies

```bash
npm install web-push
```

## Step 4: Create API Route for Sending Notifications

Create `app/api/push/send/route.ts` to send push notifications from your backend.

## Step 5: Enable Push Notifications in Settings

Users can enable/disable push notifications in the Settings page. The service worker will be registered automatically when enabled.

## Usage

### Sending a Push Notification

```typescript
// In your backend code
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Get user's subscription from database
const subscription = await getPushSubscription(userId);

// Send notification
await webpush.sendNotification(subscription, JSON.stringify({
  title: 'New Friend Request',
  body: 'John Doe sent you a friend request',
  icon: '/icon-192x192.png',
  url: '/notifications',
}));
```

## Testing

1. Enable push notifications in Settings
2. Grant notification permission when prompted
3. Test by sending a notification from your backend

## Browser Support

Push notifications are supported in:
- Chrome/Edge (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (iOS 16.4+)
- Opera

## Notes

- Service worker is registered at `/sw.js`
- Notifications require HTTPS (except localhost)
- Users must grant notification permission
- Service worker must be registered before subscribing

