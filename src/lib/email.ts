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
  to: string | string[];
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
  return sendEmail({ template: "broadcast", to, data: { title, message, imageUrl } });
}

export async function sendCustomEmail(to: string | string[], subject: string, html: string) {
  return sendEmail({ template: "custom", to, subject, html });
}
