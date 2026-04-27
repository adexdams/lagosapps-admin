-- Users need INSERT on user_notifications so the user-facing app can create
-- in-app notifications at checkout, membership activation, etc.
-- The initial schema only granted SELECT + UPDATE to users; this was missed.

CREATE POLICY "Users create own notifications" ON user_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
