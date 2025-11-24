# Bot Protection Setup Guide

This guide explains how to set up bot protection for the signup form.

## Protection Methods Implemented

### 1. **Honeypot Field** ✅ (Always Active)
- Hidden field that humans can't see but bots often fill
- Automatically blocks submissions if the field is filled
- No user interaction required

### 2. **Form Timing Check** ✅ (Always Active)
- Detects if form is submitted too quickly (< 3 seconds)
- Legitimate users need time to fill out the form
- Blocks automated submissions

### 3. **reCAPTCHA v3** (Optional but Recommended)
- Invisible bot protection
- No user interaction required
- Scores user behavior (0.0 = bot, 1.0 = human)
- Requires Google reCAPTCHA account

### 4. **Email Verification** (Recommended)
- Supabase can require email verification before account activation
- Prevents bots from creating active accounts
- See Supabase setup below

## Setting Up reCAPTCHA v3

### Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+"** to create a new site
3. Fill in the form:
   - **Label**: Gastbook (or your site name)
   - **reCAPTCHA type**: Select **reCAPTCHA v3**
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - Your production domain (e.g., `yourdomain.com`)
   - Accept the reCAPTCHA Terms of Service
4. Click **Submit**
5. Copy your **Site Key** and **Secret Key**

### Step 2: Add Keys to Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**Important**: 
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is public and safe to expose in client-side code
- `RECAPTCHA_SECRET_KEY` must be kept secret and only used on the server

### Step 3: Deploy to Production

When deploying to Vercel (or other platforms):

1. Add the environment variables in your deployment platform's settings
2. Make sure both keys are set:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (public)
   - `RECAPTCHA_SECRET_KEY` (secret)

## Enabling Email Verification in Supabase

Email verification adds an extra layer of protection by requiring users to verify their email before their account is fully activated.

### Step 1: Enable Email Verification

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, enable:
   - ✅ **Enable email confirmations**
   - ✅ **Secure email change** (recommended)

### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the confirmation email template if desired
3. The default template will work fine

### Step 3: Test Email Verification

1. Sign up with a test email
2. Check your email for the confirmation link
3. Click the link to verify your account
4. You should now be able to log in

## How It Works

### Honeypot Field
- A hidden input field that's invisible to users
- Bots often auto-fill all form fields, including hidden ones
- If the honeypot field is filled, the submission is rejected

### Form Timing
- Tracks when the form page loads
- Calculates time between page load and form submission
- Blocks submissions that happen too quickly (< 3 seconds)
- Legitimate users typically take 5-10+ seconds

### reCAPTCHA v3
- Runs invisibly in the background
- Analyzes user behavior and interaction patterns
- Returns a score from 0.0 (bot) to 1.0 (human)
- Current threshold: 0.5 (can be adjusted in `app/api/recaptcha/route.ts`)

### Email Verification
- Supabase sends a confirmation email after signup
- User must click the link to activate their account
- Unverified accounts cannot log in
- Prevents bots from creating active accounts

## Adjusting reCAPTCHA Threshold

The current threshold is set to 0.5 (50% confidence). You can adjust this in `app/api/recaptcha/route.ts`:

```typescript
if (data.success && data.score >= 0.5) {
  // Change 0.5 to your desired threshold
  // Lower (e.g., 0.3) = more permissive, may allow some bots
  // Higher (e.g., 0.7) = more strict, may block some humans
}
```

**Recommended thresholds:**
- **0.3-0.4**: More permissive, good for high-traffic sites
- **0.5**: Balanced (current setting)
- **0.6-0.7**: More strict, good for sensitive applications

## Testing Bot Protection

### Test Honeypot
1. Open browser developer tools
2. Find the hidden honeypot field
3. Fill it with any value
4. Try to submit - should be blocked

### Test Timing
1. Fill out the form very quickly (< 3 seconds)
2. Submit - should be blocked with error message
3. Fill out normally - should work

### Test reCAPTCHA
1. Without reCAPTCHA keys: Form works but no reCAPTCHA verification
2. With keys: Form includes invisible reCAPTCHA verification
3. Check browser console for any reCAPTCHA errors

## Troubleshooting

### reCAPTCHA not loading
- Check that `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
- Verify the domain is added in reCAPTCHA admin console
- Check browser console for errors

### reCAPTCHA verification failing
- Verify `RECAPTCHA_SECRET_KEY` is set correctly
- Check server logs for verification errors
- Ensure domain matches what's registered in reCAPTCHA console

### Too many false positives
- Lower the reCAPTCHA threshold
- Increase the form timing threshold (currently 3 seconds)
- Review reCAPTCHA analytics in Google console

### Too many bots getting through
- Increase the reCAPTCHA threshold
- Enable email verification
- Consider adding rate limiting (see below)

## Additional Recommendations

### Rate Limiting (Future Enhancement)

You can add rate limiting at the Supabase level or using a service like:
- **Supabase Edge Functions** with rate limiting
- **Vercel Edge Middleware** with rate limiting
- **Cloudflare** rate limiting rules

### IP Blocking

For persistent bot attacks, consider:
- Blocking known bot IP ranges
- Using a service like Cloudflare Bot Management
- Implementing IP-based rate limiting

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify all environment variables are set correctly
4. Test with reCAPTCHA disabled first to isolate issues

