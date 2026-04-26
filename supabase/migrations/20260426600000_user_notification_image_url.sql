-- Add image_url to user_notifications so broadcast images reach the user's inbox.
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS image_url TEXT;
