// Supabase Edge Function: send-email
// Sends transactional emails via Resend, pulling templates from the database.
//
// Invoke:
//   const { data, error } = await supabase.functions.invoke("send-email", {
//     body: {
//       template: "welcome" | "password_reset" | "order_confirmation" | "wallet_topup" | "membership_renewal" | "broadcast" | "custom",
//       to: "user@example.com" | ["a@b.com", "c@d.com"],
//       data: { /* template-specific variables */ },
//       subject?: string,  // for "custom"
//       html?: string,     // for "custom"
//     }
//   });
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "hello@lagosapps.com";
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME") ?? "LagosApps";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Default logo (admin can override via platform_settings or email_templates)
const DEFAULT_LOGO_URL = "https://raw.githubusercontent.com/adexdams/lagosapps-admin/main/public/lagosapp-logo.webp";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailPayload {
  template: string;
  to: string | string[];
  data?: Record<string, unknown>;
  subject?: string;
  html?: string;
}

interface TemplateRow {
  key: string;
  subject: string;
  banner_url: string | null;
  heading: string;
  body_html: string;
}

// Replace {{variable}} placeholders with actual values
function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

// Master layout — includes logo + optional banner + content + footer
function layout(opts: {
  logoUrl: string;
  bannerUrl: string | null;
  content: string;
}): string {
  const bannerBlock = opts.bannerUrl
    ? `<tr><td style="padding:0;"><img src="${opts.bannerUrl}" alt="" style="width:100%;display:block;max-width:600px;height:auto;" /></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F6FA;font-family:'Helvetica Neue',Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="padding:24px 40px;border-bottom:1px solid #E8ECF1;">
          <img src="${opts.logoUrl}" alt="LagosApps" style="height:36px;width:auto;display:block;" />
        </td></tr>
        ${bannerBlock}
        <tr><td style="padding:32px 40px;font-size:15px;line-height:1.6;color:#334155;">
          ${opts.content}
        </td></tr>
        <tr><td style="padding:24px 40px;background:#F8FAFC;border-top:1px solid #E8ECF1;font-size:12px;color:#94A3B8;text-align:center;">
          <p style="margin:0 0 8px;">LagosApps — Lagos, Nigeria</p>
          <p style="margin:0;"><a href="https://lagosapps.com" style="color:#64748B;text-decoration:none;">lagosapps.com</a> &nbsp;·&nbsp; <a href="mailto:hello@lagosapps.com" style="color:#64748B;text-decoration:none;">hello@lagosapps.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.template) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'template' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject: string;
    let html: string;
    const data = payload.data ?? {};

    if (payload.template === "custom" && payload.subject && payload.html) {
      // Custom template — bypass DB lookup, use provided subject/html inside the layout
      subject = payload.subject;
      html = layout({
        logoUrl: DEFAULT_LOGO_URL,
        bannerUrl: null,
        content: payload.html,
      });
    } else {
      // Fetch template from DB
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });

      const { data: tpl, error: tplError } = await admin
        .from("email_templates")
        .select("key, subject, banner_url, heading, body_html")
        .eq("key", payload.template)
        .eq("is_active", true)
        .single<TemplateRow>();

      if (tplError || !tpl) {
        return new Response(JSON.stringify({ error: `Template '${payload.template}' not found or inactive` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch global logo override from platform_settings (optional)
      const { data: logoSetting } = await admin
        .from("platform_settings")
        .select("value")
        .eq("key", "email_logo_url")
        .maybeSingle();

      const logoUrl = (logoSetting?.value as string) || DEFAULT_LOGO_URL;

      // Interpolate variables
      subject = interpolate(tpl.subject, data);
      const heading = interpolate(tpl.heading, data);
      const bodyHtml = interpolate(tpl.body_html, data);

      const content = `<h2 style="margin:0 0 16px;font-size:20px;color:#0F172A;">${heading}</h2>${bodyHtml}`;

      html = layout({
        logoUrl,
        bannerUrl: tpl.banner_url,
        content,
      });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject,
        html,
      }),
    });

    const result = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: "Resend API error", details: result }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
