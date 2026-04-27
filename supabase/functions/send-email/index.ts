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
const DEFAULT_LOGO_URL = "https://uhrlsvnmoemrakwfrjyf.supabase.co/storage/v1/object/public/public-assets/brand-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InlineTemplate {
  subject: string;
  heading: string;
  body_html: string;
  banner_url?: string | null;
}

interface EmailPayload {
  template: string;
  to?: string | string[];
  batchRecipients?: string[]; // send one private email per address via Resend batch API
  data?: Record<string, unknown>;
  subject?: string;
  html?: string;
  dryRun?: boolean; // if true, return rendered HTML instead of sending
  inlineTemplate?: InlineTemplate; // preview unsaved edits without hitting DB
  logoUrl?: string; // override the logo (used by dryRun preview to inject local asset)
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
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media only screen and (max-width:620px){
    .ec-wrap{padding:16px 8px!important;}
    .ec-cell{padding:20px 24px!important;}
    .ec-foot{padding:20px 24px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F5F6FA;font-family:'Helvetica Neue',Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA;">
    <tr><td class="ec-wrap" align="center" style="padding:40px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td class="ec-cell" style="padding:24px 40px;border-bottom:1px solid #E8ECF1;">
          <img src="${opts.logoUrl}" alt="LagosApps" width="auto" height="40" style="height:40px;width:auto;display:block;max-width:180px;" />
        </td></tr>
        ${bannerBlock}
        <tr><td class="ec-cell" style="padding:32px 40px;font-size:15px;line-height:1.6;color:#334155;">
          ${opts.content}
        </td></tr>
        <tr><td class="ec-foot" style="padding:24px 40px;background:#F8FAFC;border-top:1px solid #E8ECF1;font-size:12px;color:#94A3B8;text-align:center;">
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

    if (!payload.template) {
      return new Response(JSON.stringify({ error: "Missing 'template' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!payload.dryRun && !payload.to && !payload.batchRecipients?.length) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'batchRecipients' field (required unless dryRun)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject: string;
    let html: string;
    const data: Record<string, unknown> = { ...(payload.data ?? {}) };

    // For password_reset: use admin SDK to generate the Supabase recovery link when
    // the caller passes `data.email` without `data.resetUrl` (user app flow).
    if (payload.template === "password_reset" && data.email && !data.resetUrl) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const redirectTo = (data.redirectTo as string | undefined) ?? "https://lagosapps.com";
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: data.email as string,
        options: { redirectTo },
      });

      // Support both SDK response formats: newer has linkData.properties.action_link,
      // older has linkData.action_link at the root.
      const actionLink =
        (linkData as Record<string, unknown> | null)?.properties?.action_link as string | undefined ??
        (linkData as Record<string, unknown> | null)?.action_link as string | undefined;

      if (linkError || !actionLink) {
        // Silently succeed if user not found — prevents email enumeration
        const notFound =
          linkError?.message?.toLowerCase().includes("not found") ||
          linkError?.message?.toLowerCase().includes("not exist") ||
          linkError?.message?.toLowerCase().includes("unable to find");
        if (notFound) {
          return new Response(JSON.stringify({ success: true, id: null }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: linkError?.message ?? "Could not generate recovery link" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      data.resetUrl = actionLink;
      // Also try to hydrate the user's name for a personalised email
      const { data: profile } = await admin.from("profiles").select("name").eq("email", data.email as string).maybeSingle();
      if (profile?.name) data.name = profile.name;
      // Ensure `to` is set if caller only passed data.email
      if (!payload.to) payload.to = data.email as string;
    }

    // Pre-build imageBlock for broadcast (interpolate has no conditional support)
    if (payload.template === "broadcast") {
      const imgUrl = data.imageUrl as string | undefined;
      data.imageBlock = imgUrl
        ? `<div style="margin-top:20px;"><img src="${imgUrl}" alt="" style="width:100%;max-width:520px;border-radius:12px;display:block;margin:0 auto;" /></div>`
        : "";
    }

    if (payload.template === "custom" && payload.subject && payload.html) {
      // Custom template — bypass DB lookup, use provided subject/html inside the layout
      subject = payload.subject;
      html = layout({
        logoUrl: payload.logoUrl ?? DEFAULT_LOGO_URL,
        bannerUrl: null,
        content: payload.html,
      });
    } else {
      let tpl: TemplateRow;
      let logoUrl = payload.logoUrl ?? DEFAULT_LOGO_URL;

      if (payload.inlineTemplate) {
        // Inline template provided — use it directly (for previewing unsaved edits)
        tpl = {
          key: payload.template,
          subject: payload.inlineTemplate.subject,
          heading: payload.inlineTemplate.heading,
          body_html: payload.inlineTemplate.body_html,
          banner_url: payload.inlineTemplate.banner_url ?? null,
        };
        // Only fetch logo from DB if no override was provided
        if (!payload.logoUrl) {
          const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
          const { data: logoSetting } = await admin
            .from("platform_settings")
            .select("value")
            .eq("key", "email_logo_url")
            .maybeSingle();
          if (logoSetting?.value) logoUrl = logoSetting.value as string;
        }
      } else {
        // Fetch template from DB
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

        const { data: dbTpl, error: tplError } = await admin
          .from("email_templates")
          .select("key, subject, banner_url, heading, body_html")
          .eq("key", payload.template)
          .eq("is_active", true)
          .single<TemplateRow>();

        if (tplError || !dbTpl) {
          return new Response(JSON.stringify({ error: `Template '${payload.template}' not found or inactive` }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        tpl = dbTpl;

        // Only fetch logo from DB if no override was provided
        if (!payload.logoUrl) {
          const { data: logoSetting } = await admin
            .from("platform_settings")
            .select("value")
            .eq("key", "email_logo_url")
            .maybeSingle();
          if (logoSetting?.value) logoUrl = logoSetting.value as string;
        }
      }

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

    // Dry run — return rendered HTML without sending
    if (payload.dryRun) {
      return new Response(JSON.stringify({ success: true, dryRun: true, subject, html }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch send — one private email per address (recipients cannot see each other)
    if (payload.batchRecipients?.length) {
      const CHUNK = 100; // Resend batch limit
      const chunks: string[][] = [];
      for (let i = 0; i < payload.batchRecipients.length; i += CHUNK) {
        chunks.push(payload.batchRecipients.slice(i, i + CHUNK));
      }

      let totalSent = 0;
      for (const chunk of chunks) {
        const batchPayload = chunk.map((addr) => ({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [addr],
          subject,
          html,
        }));

        const batchRes = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batchPayload),
        });

        if (!batchRes.ok) {
          const err = await batchRes.json();
          return new Response(JSON.stringify({ error: "Resend batch API error", details: err, sent: totalSent }), {
            status: batchRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        totalSent += chunk.length;
      }

      return new Response(JSON.stringify({ success: true, sent: totalSent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Single / small send
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
