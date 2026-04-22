-- ============================================================
-- Email Templates — admin-editable subject/body/banner per template
-- ============================================================

CREATE TABLE email_templates (
  key VARCHAR(50) PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  banner_url TEXT,
  heading TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- list of {name, description} for admin reference
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Public can read active templates (needed by Edge Function using anon key)
CREATE POLICY "Public read active templates" ON email_templates FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin manage templates" ON email_templates FOR ALL USING (is_admin());

-- Seed default templates
INSERT INTO email_templates (key, label, description, subject, heading, body_html, variables) VALUES
  (
    'welcome',
    'Welcome Email',
    'Sent when a new user signs up',
    'Welcome to LagosApps!',
    'Welcome, {{name}}!',
    '<p>You''ve just joined LagosApps — one account for energy, transport, groceries, health, events, and more across Lagos.</p>
<p>Your referral code: <strong style="color:#057a55;font-family:monospace;">{{referralCode}}</strong></p>
<p style="margin-top:24px;"><a href="https://lagosapps.com" style="background:#057a55;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block;">Explore the portals</a></p>',
    '[{"name":"name","description":"User''s full name"},{"name":"referralCode","description":"User''s unique referral code"}]'::jsonb
  ),
  (
    'password_reset',
    'Password Reset',
    'Sent when a user requests a password reset',
    'Reset your LagosApps password',
    'Reset your password',
    '<p>Click the button below to set a new password. This link expires in 1 hour.</p>
<p style="margin-top:24px;"><a href="{{resetUrl}}" style="background:#057a55;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block;">Reset password</a></p>
<p style="margin-top:24px;color:#64748B;font-size:13px;">If you didn''t request this, you can safely ignore this email.</p>',
    '[{"name":"resetUrl","description":"One-time password reset link"}]'::jsonb
  ),
  (
    'order_confirmation',
    'Order Confirmation',
    'Sent after a user places an order',
    'Order {{orderId}} confirmed',
    'Order confirmed',
    '<p>Thanks {{name}}! Your order <strong>{{orderId}}</strong> has been received and is being processed.</p>
<div style="background:#F8FAFC;border-radius:12px;padding:16px;margin:20px 0;">
  <p style="margin:0 0 8px;color:#64748B;font-size:13px;">Total</p>
  <p style="margin:0;font-size:20px;font-weight:800;color:#0F172A;">{{total}}</p>
</div>
<p>We''ll send updates as your order progresses.</p>',
    '[{"name":"name","description":"Customer name"},{"name":"orderId","description":"Order ID (e.g. ORD-042)"},{"name":"total","description":"Formatted total amount (e.g. ₦15,000)"}]'::jsonb
  ),
  (
    'wallet_topup',
    'Wallet Top-up',
    'Sent after a successful wallet top-up',
    'Wallet topped up — {{amount}}',
    'Wallet top-up successful',
    '<p>{{amount}} has been added to your wallet.</p>
<p style="color:#64748B;">New balance: <strong style="color:#0F172A;">{{newBalance}}</strong></p>
<p style="margin-top:16px;color:#64748B;font-size:13px;">Reference: {{reference}}</p>',
    '[{"name":"amount","description":"Amount added"},{"name":"newBalance","description":"New wallet balance"},{"name":"reference","description":"Payment reference"}]'::jsonb
  ),
  (
    'membership_renewal',
    'Membership Renewal Reminder',
    'Sent when a membership is expiring soon',
    'Your {{tier}} membership expires soon',
    'Membership expiring in {{daysRemaining}} days',
    '<p>Your <strong>{{tier}}</strong> membership expires on <strong>{{expiresAt}}</strong>.</p>
<p>Renew now to keep enjoying your tier benefits without interruption.</p>
<p style="margin-top:24px;"><a href="{{renewUrl}}" style="background:#057a55;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block;">Renew membership</a></p>',
    '[{"name":"tier","description":"Membership tier (Bronze/Silver/Gold)"},{"name":"daysRemaining","description":"Days until expiry"},{"name":"expiresAt","description":"Expiry date"},{"name":"renewUrl","description":"Link to renewal page"}]'::jsonb
  ),
  (
    'broadcast',
    'Broadcast Message',
    'Sent when admin broadcasts a message to users',
    '{{title}}',
    '{{title}}',
    '<div style="font-size:15px;line-height:1.6;color:#334155;">{{message}}</div>',
    '[{"name":"title","description":"Broadcast title"},{"name":"message","description":"Broadcast message body (HTML allowed)"}]'::jsonb
  );
