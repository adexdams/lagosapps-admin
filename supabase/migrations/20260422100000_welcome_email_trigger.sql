-- ============================================================
-- Welcome Email Trigger
--
-- Fires the send-email Edge Function (welcome template) whenever
-- a new profile row is inserted. This covers ALL signup paths:
--   - User-facing app: supabase.auth.signUp → auth.users insert
--     → handle_new_user trigger → profiles insert → THIS trigger
--   - Admin app: admin manually creates a user
--
-- The DB call uses pg_net to hit the Edge Function asynchronously,
-- so signup latency isn't affected if Resend is slow.
-- ============================================================

-- Enable pg_net extension (Supabase's HTTP client for Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store the function URL + anon key in vault-style settings so the trigger
-- can reach them. We use vault.secrets so they're not plaintext in schema.
-- Simplest for now: use platform_settings table we already have.

-- Put the edge function URL in platform_settings so it's editable without migration
INSERT INTO platform_settings (key, value) VALUES
  ('send_email_function_url', 'https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/send-email')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- The trigger function itself
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  anon_key TEXT;
  request_id BIGINT;
BEGIN
  -- Only fire for genuinely new users (role = 'user', has email)
  -- Skip if this is an admin seeding (admins can be inserted without email, etc.)
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Fetch the edge function URL from settings
  SELECT value INTO function_url FROM platform_settings WHERE key = 'send_email_function_url';
  IF function_url IS NULL THEN
    RAISE WARNING 'send_welcome_email: send_email_function_url not configured in platform_settings';
    RETURN NEW;
  END IF;

  -- Anon key is needed in the Authorization header. Read from secrets.
  -- NOTE: supabase_anon_key is a Supabase-provided setting from vault.
  BEGIN
    anon_key := current_setting('app.settings.supabase_anon_key', true);
  EXCEPTION WHEN OTHERS THEN
    anon_key := NULL;
  END;

  -- Fallback: try reading from platform_settings if admin stored it there
  IF anon_key IS NULL OR anon_key = '' THEN
    SELECT value INTO anon_key FROM platform_settings WHERE key = 'supabase_anon_key';
  END IF;

  IF anon_key IS NULL OR anon_key = '' THEN
    RAISE WARNING 'send_welcome_email: supabase_anon_key not available — email not sent for %', NEW.email;
    RETURN NEW;
  END IF;

  -- Fire the Edge Function asynchronously via pg_net
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'template', 'welcome',
      'to', NEW.email,
      'data', jsonb_build_object(
        'name', COALESCE(NEW.name, split_part(NEW.email, '@', 1)),
        'referralCode', COALESCE(NEW.referral_code, '')
      )
    )
  ) INTO request_id;

  RAISE NOTICE 'send_welcome_email: queued request_id=% for %', request_id, NEW.email;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let email failure block the signup. Log and continue.
  RAISE WARNING 'send_welcome_email: % (user: %)', SQLERRM, NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email();

-- Seed the anon key into platform_settings so the trigger can use it.
-- The admin can rotate this value through the UI later.
-- (Hardcoded value matches the known anon key for uhrlsvnmoemrakwfrjyf)
INSERT INTO platform_settings (key, value) VALUES
  ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocmxzdm5tb2VtcmFrd2ZyanlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2ODQsImV4cCI6MjA5MjI2MjY4NH0.VN59kY6Mb5_n2cjejx-wyiTcz_G_VmYjhq5w8P4A0lI')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
