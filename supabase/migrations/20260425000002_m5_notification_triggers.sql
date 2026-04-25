-- M5: System notification triggers + membership renewal reminder cron
-- Adds: membership new/cancelled notifications, large wallet transaction alerts,
--       and a daily cron job to email members whose subscription expires in 3 days.

-- ── 1. Membership subscription events ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_membership_event()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
  user_name TEXT;
  tier_label TEXT;
BEGIN
  SELECT name INTO user_name FROM public.profiles WHERE id = NEW.user_id;
  tier_label := initcap(NEW.tier);

  -- New subscription created
  IF TG_OP = 'INSERT' THEN
    SELECT ARRAY_AGG(user_id) INTO recipient_ids
      FROM public.admins_with_roles('operations', 'super_admin');
    IF recipient_ids IS NOT NULL THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'membership_new',
        tier_label || ' membership activated',
        COALESCE(user_name, 'A user') || ' subscribed to ' || tier_label || ' (' || NEW.billing_cycle || ')',
        'membership_subscription',
        NEW.id
      );
    END IF;

  -- Subscription cancelled
  ELSIF TG_OP = 'UPDATE'
    AND NEW.status = 'cancelled'
    AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    SELECT ARRAY_AGG(user_id) INTO recipient_ids
      FROM public.admins_with_roles('operations', 'super_admin');
    IF recipient_ids IS NOT NULL THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'membership_cancelled',
        tier_label || ' membership cancelled',
        COALESCE(user_name, 'A user') || ' cancelled their ' || tier_label || ' membership',
        'membership_subscription',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_membership_event: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_membership_event ON public.membership_subscriptions;
CREATE TRIGGER on_membership_event
  AFTER INSERT OR UPDATE ON public.membership_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.notify_membership_event();

-- ── 2. Large wallet transaction alerts ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_large_wallet_transaction()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
  user_name TEXT;
  -- Default threshold ₦50,000 — respects per-admin notification_preferences where set
  default_threshold CONSTANT NUMERIC := 50000;
BEGIN
  IF NEW.amount < default_threshold THEN
    RETURN NEW;
  END IF;

  SELECT name INTO user_name FROM public.profiles WHERE id = NEW.user_id;

  SELECT ARRAY_AGG(DISTINCT atm.user_id) INTO recipient_ids
  FROM public.admin_team_members atm
  WHERE atm.is_active = true
    AND atm.role IN ('operations', 'super_admin')
    AND (
      -- Respect per-admin threshold preference if set, else use default
      NOT EXISTS (
        SELECT 1 FROM public.notification_preferences np
        WHERE np.user_id = atm.user_id
          AND np.wallet_enabled = true
          AND np.large_txn_threshold IS NOT NULL
          AND NEW.amount < np.large_txn_threshold
      )
    );

  IF recipient_ids IS NOT NULL THEN
    PERFORM public.insert_system_notification(
      recipient_ids,
      'wallet_large_txn',
      'Large wallet ' || NEW.type,
      COALESCE(user_name, 'A user') || ' ' || NEW.type || 'd ₦' || to_char(NEW.amount, 'FM999,999,999') || ' (ref: ' || COALESCE(NEW.reference, NEW.id) || ')',
      'wallet_transaction',
      NEW.id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_large_wallet_transaction: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_large_wallet_txn ON public.wallet_transactions;
CREATE TRIGGER on_large_wallet_txn
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_large_wallet_transaction();

-- ── 3. Membership renewal reminder emails (cron, daily at 08:00 UTC) ─────────

CREATE OR REPLACE FUNCTION public.send_membership_renewal_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec RECORD;
  function_url TEXT;
  anon_key TEXT;
  expires_label TEXT;
BEGIN
  SELECT value INTO function_url FROM platform_settings WHERE key = 'send_email_function_url';
  SELECT value INTO anon_key   FROM platform_settings WHERE key = 'supabase_anon_key';

  IF function_url IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'send_membership_renewal_reminders: missing platform_settings (url or key)';
    RETURN;
  END IF;

  -- Find active subscriptions expiring in exactly 3 days
  FOR rec IN
    SELECT
      s.id,
      s.tier,
      s.expires_at,
      p.name,
      p.email
    FROM membership_subscriptions s
    JOIN profiles p ON p.id = s.user_id
    WHERE s.status = 'active'
      AND s.expires_at::date = CURRENT_DATE + 3
      AND p.email IS NOT NULL
  LOOP
    expires_label := to_char(rec.expires_at, 'DD Mon YYYY');

    PERFORM net.http_post(
      url     := function_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body    := jsonb_build_object(
        'template', 'membership_renewal',
        'to',       rec.email,
        'data', jsonb_build_object(
          'name',          COALESCE(rec.name, split_part(rec.email, '@', 1)),
          'tier',          initcap(rec.tier),
          'daysRemaining', '3',
          'expiresAt',     expires_label,
          'renewUrl',      'https://lagosapps.com/membership'
        )
      )
    );
  END LOOP;
END;
$$;

-- Schedule: 08:00 UTC every day
SELECT cron.schedule(
  'membership-renewal-reminders',
  '0 8 * * *',
  'SELECT send_membership_renewal_reminders()'
);
