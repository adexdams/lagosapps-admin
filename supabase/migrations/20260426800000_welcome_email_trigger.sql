-- Trigger: send welcome email when a new profile is created (i.e. user signs up)
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  function_url TEXT;
  anon_key TEXT;
BEGIN
  SELECT value INTO function_url FROM platform_settings WHERE key = 'send_email_function_url';
  SELECT value INTO anon_key   FROM platform_settings WHERE key = 'supabase_anon_key';

  IF function_url IS NULL OR anon_key IS NULL OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := function_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body    := jsonb_build_object(
      'template', 'welcome',
      'to',       NEW.email,
      'data', jsonb_build_object(
        'name', COALESCE(NULLIF(NEW.name, ''), split_part(NEW.email, '@', 1))
      )
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION send_welcome_email();
