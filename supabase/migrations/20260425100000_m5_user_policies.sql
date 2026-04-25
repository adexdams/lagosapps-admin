-- M5: User-side RLS policies for membership subscriptions, benefit usage, and referrals
-- Users can insert/update their own rows in these tables.

-- ── membership_subscriptions ─────────────────────────────────────────────────

CREATE POLICY "Users create own subscriptions"
  ON membership_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscriptions"
  ON membership_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ── membership_benefit_usage ─────────────────────────────────────────────────

CREATE POLICY "Users insert own benefit usage"
  ON membership_benefit_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own benefit usage"
  ON membership_benefit_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Unique constraint to enable safe upsert (ON CONFLICT on this triple)
ALTER TABLE membership_benefit_usage
  ADD CONSTRAINT uniq_benefit_usage
  UNIQUE (subscription_id, benefit_key, period_start);

-- ── referrals ────────────────────────────────────────────────────────────────

-- Users can create referral rows where they are the referred party (signup flow)
CREATE POLICY "Users insert as referred"
  ON referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- ── Realtime ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE membership_subscriptions;
