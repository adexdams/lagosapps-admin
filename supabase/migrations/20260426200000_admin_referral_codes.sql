-- Admin-generated referral/promo codes.
-- Admins create codes; users redeem them for free membership.
-- Single-use (max_uses=1), limited (max_uses=N), or unlimited (max_uses=NULL).

CREATE TABLE admin_referral_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(20) NOT NULL UNIQUE,
  gifted_tier   membership_tier NOT NULL DEFAULT 'bronze',
  max_uses      INT,                         -- NULL = unlimited
  used_count    INT NOT NULL DEFAULT 0,
  expires_at    DATE,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_code_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES admin_referral_codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);

ALTER TABLE admin_referral_codes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access codes"       ON admin_referral_codes   FOR ALL USING (is_admin());
CREATE POLICY "Users read active codes"       ON admin_referral_codes   FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access redemptions" ON admin_code_redemptions FOR ALL USING (is_admin());
CREATE POLICY "Users read own redemptions"    ON admin_code_redemptions FOR SELECT USING (auth.uid() = user_id);

-- ── Safe atomic redemption function ──────────────────────────────────────────
-- Runs as SECURITY DEFINER so it can atomically:
--   1. Validate the code (active, not expired, not exhausted)
--   2. Check the user hasn't redeemed an admin code before
--   3. Insert a membership subscription (trigger handles profile sync)
--   4. Log the redemption
--   5. Increment used_count and deactivate if exhausted

CREATE OR REPLACE FUNCTION public.redeem_admin_code(
  p_code    TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code     admin_referral_codes%ROWTYPE;
  v_months   INT := 6;
  v_expires  DATE;
BEGIN
  -- Lock and fetch the code row
  SELECT * INTO v_code
  FROM admin_referral_codes
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invalid referral code');
  END IF;

  IF NOT v_code.is_active THEN
    RETURN jsonb_build_object('ok', false, 'message', 'This code is no longer active');
  END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'message', 'This code has expired');
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.used_count >= v_code.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'message', 'This code has reached its usage limit');
  END IF;

  -- Prevent double-redemption of any admin code by this user
  IF EXISTS (SELECT 1 FROM admin_code_redemptions WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You have already redeemed a promo code');
  END IF;

  -- Get configured membership duration
  SELECT COALESCE(value::INT, 6) INTO v_months
  FROM platform_settings WHERE key = 'referral_duration_months';
  IF v_months IS NULL THEN v_months := 6; END IF;

  v_expires := CURRENT_DATE + (v_months * 30);

  -- Create subscription; sync_active_subscription trigger handles profile update
  INSERT INTO membership_subscriptions (user_id, tier, billing_cycle, amount_paid, starts_at, expires_at, status)
  VALUES (p_user_id, v_code.gifted_tier, 'annual', 0, CURRENT_DATE, v_expires, 'active');

  -- Record redemption
  INSERT INTO admin_code_redemptions (code_id, user_id)
  VALUES (v_code.id, p_user_id);

  -- Increment usage and auto-deactivate if limit reached
  UPDATE admin_referral_codes
  SET
    used_count = used_count + 1,
    is_active  = CASE
                   WHEN max_uses IS NOT NULL AND (used_count + 1) >= max_uses THEN false
                   ELSE true
                 END
  WHERE id = v_code.id;

  RETURN jsonb_build_object('ok', true, 'tier', v_code.gifted_tier::TEXT, 'expires_at', v_expires::TEXT);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'message', SQLERRM);
END;
$$;

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(TEXT, UUID) TO authenticated;
