-- Ensure only one active subscription per user at a time.
-- When a new active subscription is inserted:
--   1. Cancel all previously active subscriptions for that user
--   2. Sync profiles.membership_tier to the new tier
-- When a subscription is cancelled:
--   1. If no remaining active subscriptions, reset profiles.membership_tier to 'none'

CREATE OR REPLACE FUNCTION public.sync_active_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status::TEXT = 'active' THEN
    -- Cancel any other active subs for this user (silently — no notification for auto-cancel)
    UPDATE public.membership_subscriptions
    SET status = 'cancelled'
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND status::TEXT = 'active';

    -- Sync profile tier
    UPDATE public.profiles
    SET membership_tier = NEW.tier::membership_tier
    WHERE id = NEW.user_id;

  ELSIF TG_OP = 'UPDATE'
    AND NEW.status::TEXT = 'cancelled'
    AND OLD.status::TEXT != 'cancelled' THEN
    -- If no other active sub remains, reset profile to 'none'
    IF NOT EXISTS (
      SELECT 1 FROM public.membership_subscriptions
      WHERE user_id = NEW.user_id
        AND status::TEXT = 'active'
        AND id != NEW.id
    ) THEN
      UPDATE public.profiles
      SET membership_tier = 'none'
      WHERE id = NEW.user_id;
    ELSE
      -- Sync to the remaining active tier
      UPDATE public.profiles p
      SET membership_tier = ms.tier::membership_tier
      FROM (
        SELECT tier FROM public.membership_subscriptions
        WHERE user_id = NEW.user_id AND status::TEXT = 'active' AND id != NEW.id
        ORDER BY created_at DESC
        LIMIT 1
      ) ms
      WHERE p.id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_active_subscription: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subscription_change ON public.membership_subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.membership_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_active_subscription();

-- ── One-time data fix ─────────────────────────────────────────────────────────
-- For each user with multiple active subscriptions, keep the newest one and
-- cancel the rest. Also sync profiles.membership_tier.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Cancel older duplicates per user
  FOR r IN
    SELECT DISTINCT user_id FROM public.membership_subscriptions WHERE status = 'active'
  LOOP
    UPDATE public.membership_subscriptions
    SET status = 'cancelled'
    WHERE user_id = r.user_id
      AND status::TEXT = 'active'
      AND id NOT IN (
        SELECT id FROM public.membership_subscriptions
        WHERE user_id = r.user_id AND status::TEXT = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      );
  END LOOP;

  -- Sync profiles.membership_tier to the remaining active subscription
  UPDATE public.profiles p
  SET membership_tier = ms.tier::membership_tier
  FROM (
    SELECT DISTINCT ON (user_id) user_id, tier
    FROM public.membership_subscriptions
    WHERE status::TEXT = 'active'
    ORDER BY user_id, created_at DESC
  ) ms
  WHERE p.id = ms.user_id;

  -- Reset profiles with no active subscription to 'none'
  UPDATE public.profiles
  SET membership_tier = 'none'
  WHERE id NOT IN (
    SELECT DISTINCT user_id FROM public.membership_subscriptions WHERE status::TEXT = 'active'
  )
  AND membership_tier::TEXT != 'none';
END;
$$;
