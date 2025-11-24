# Database Updates

This file contains additional SQL scripts for new features.

## Add Preferences Column to Profiles

To enable font preferences and other user settings, add a `preferences` JSONB column to the profiles table:

```sql
-- Add preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "fontFamily": "albert-sans"
}'::jsonb;

-- Update existing profiles to have default preferences
UPDATE public.profiles
SET preferences = '{"fontFamily": "albert-sans"}'::jsonb
WHERE preferences IS NULL;
```

This allows storing user preferences like:
- `fontFamily`: The selected font (roboto, open-sans, montserrat, albert-sans)
- `emailNotifications`: Email notification preferences
- `pushNotifications`: Push notification preferences
- Other future preferences

