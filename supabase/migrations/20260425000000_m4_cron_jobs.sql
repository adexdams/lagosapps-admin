-- M4 cron jobs: membership expiry, referral expiry, benefit usage reset, overdue order flags
-- Requires pg_cron extension (enabled on Supabase Pro; on free tier, invoke Edge Functions via external scheduler)

-- ── Helper: expire memberships ───────────────────────────────

CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Mark subscriptions whose expires_at has passed
  UPDATE membership_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < CURRENT_DATE;

  -- Downgrade profiles whose active subscription expired and they have no newer active one
  UPDATE profiles p
  SET membership_tier = 'none'
  WHERE membership_tier != 'none'
    AND NOT EXISTS (
      SELECT 1 FROM membership_subscriptions s
      WHERE s.user_id = p.id
        AND s.status = 'active'
        AND s.expires_at >= CURRENT_DATE
    );
END;
$$;

-- ── Helper: expire referrals ─────────────────────────────────

CREATE OR REPLACE FUNCTION expire_referrals()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE referrals
  SET status = 'expired'
  WHERE status IN ('pending', 'confirmed')
    AND expires_at IS NOT NULL
    AND expires_at < CURRENT_DATE;
END;
$$;

-- ── Helper: reset monthly benefit usage ──────────────────────

CREATE OR REPLACE FUNCTION reset_monthly_benefit_usage()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete usage rows whose period_end has passed (new period starts fresh)
  DELETE FROM membership_benefit_usage
  WHERE period_end < CURRENT_DATE;
END;
$$;

-- ── Helper: flag overdue orders ───────────────────────────────

CREATE OR REPLACE FUNCTION flag_overdue_fulfillment()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Mark fulfillment_tracking rows as 'behind' when the fulfillment deadline has passed
  UPDATE fulfillment_tracking
  SET risk_level = 'behind'
  WHERE risk_level != 'behind'
    AND fulfillment_deadline IS NOT NULL
    AND fulfillment_deadline < now()
    AND order_id IN (
      SELECT id FROM orders WHERE status NOT IN ('delivered', 'cancelled')
    );
END;
$$;

-- ── Schedule via pg_cron ─────────────────────────────────────────────────────

SELECT cron.schedule('expire-memberships',   '0 1 * * *', 'SELECT expire_memberships()');
SELECT cron.schedule('expire-referrals',     '0 1 * * *', 'SELECT expire_referrals()');
SELECT cron.schedule('reset-benefit-usage',  '0 2 1 * *', 'SELECT reset_monthly_benefit_usage()');
SELECT cron.schedule('flag-overdue-orders',  '0 * * * *', 'SELECT flag_overdue_fulfillment()');
