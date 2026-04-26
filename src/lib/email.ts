import { supabase } from "./supabase";

type EmailTemplate =
  | "welcome"
  | "password_reset"
  | "order_confirmation"
  | "wallet_topup"
  | "membership_renewal"
  | "broadcast"
  | "custom";

interface SendEmailOptions {
  template: EmailTemplate;
  to?: string | string[];
  batchRecipients?: string[];
  data?: Record<string, unknown>;
  subject?: string; // for "custom"
  html?: string; // for "custom"
}

/**
 * Send a transactional email via the send-email Edge Function (Resend).
 * Returns { success, id } on success or { error } on failure.
 */
export async function sendEmail(options: SendEmailOptions) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: options,
  });
  if (error) return { error: error.message };
  return data as { success: true; id: string } | { error: string };
}

export interface InlineTemplate {
  subject: string;
  heading: string;
  body_html: string;
  banner_url?: string | null;
}

/**
 * Preview an email without sending — returns the fully rendered HTML
 * and subject as it would appear in a recipient's inbox.
 *
 * Pass `inlineTemplate` to preview unsaved edits; otherwise the live
 * database template is used.
 */
export async function previewEmail(options: {
  template: string;
  data?: Record<string, unknown>;
  inlineTemplate?: InlineTemplate;
  customSubject?: string;
  customHtml?: string;
  logoUrl?: string;
}): Promise<{ subject: string; html: string } | { error: string }> {
  const { data: result, error } = await supabase.functions.invoke("send-email", {
    body: {
      template: options.template,
      data: options.data,
      inlineTemplate: options.inlineTemplate,
      subject: options.customSubject,
      html: options.customHtml,
      dryRun: true,
      logoUrl: options.logoUrl,
    },
  });
  if (error) return { error: error.message };
  const r = result as { success: boolean; subject?: string; html?: string; error?: string };
  if (r.error) return { error: r.error };
  return { subject: r.subject ?? "", html: r.html ?? "" };
}

// Convenience helpers — one per template

export async function sendWelcomeEmail(to: string, name: string, referralCode: string) {
  return sendEmail({ template: "welcome", to, data: { name, referralCode } });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({ template: "password_reset", to, data: { resetUrl } });
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderId: string,
  total: string
) {
  return sendEmail({ template: "order_confirmation", to, data: { name, orderId, total } });
}

export async function sendWalletTopupEmail(
  to: string,
  amount: string,
  newBalance: string,
  reference: string
) {
  return sendEmail({ template: "wallet_topup", to, data: { amount, newBalance, reference } });
}

export async function sendMembershipRenewalEmail(
  to: string,
  tier: string,
  daysRemaining: number,
  expiresAt: string,
  renewUrl: string
) {
  return sendEmail({
    template: "membership_renewal",
    to,
    data: { tier, daysRemaining, expiresAt, renewUrl },
  });
}

export async function sendBroadcastEmail(
  to: string | string[],
  title: string,
  message: string,
  imageUrl?: string
) {
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length > 1) {
    // Batch mode: each recipient gets a private email (separate To: header per address)
    return sendEmail({ template: "broadcast", batchRecipients: recipients, data: { title, message, imageUrl } });
  }
  return sendEmail({ template: "broadcast", to: recipients[0], data: { title, message, imageUrl } });
}

export async function sendCustomEmail(to: string | string[], subject: string, html: string) {
  return sendEmail({ template: "custom", to, subject, html });
}
