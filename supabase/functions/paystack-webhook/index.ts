import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

async function fireEmail(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("fireEmail: non-blocking failure:", e instanceof Error ? e.message : e);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-paystack-signature") ?? "";
  const rawBody = await req.text();

  if (!await verifySignature(rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: {
      reference: string;
      amount: number; // kobo
      customer: { email: string };
      channel: string;
      status: string;
    };
  };

  if (event.event !== "charge.success" || event.data.status !== "success") {
    return new Response("OK", { status: 200 });
  }

  const { reference, amount, channel } = event.data;
  const amountNaira = amount / 100;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (reference.startsWith("ORD-")) {
    // Cart checkout — confirm the order
    const { error } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        payment_reference: reference,
        payment_method: channel,
      })
      .eq("id", reference)
      .eq("status", "pending"); // idempotency guard

    if (error) {
      console.error("Order confirm failed:", error.message);
      return new Response("Internal Error", { status: 500 });
    }

    // Send order confirmation email (fire-and-forget)
    const { data: order } = await supabase
      .from("orders")
      .select("total_amount, user_id")
      .eq("id", reference)
      .maybeSingle();

    if (order) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", order.user_id)
        .maybeSingle();

      if (profile?.email) {
        await fireEmail({
          template: "order_confirmation",
          to: profile.email,
          data: {
            name: profile.name || profile.email.split("@")[0],
            orderId: reference,
            total: formatNaira(Number(order.total_amount)),
          },
        });
      }
    }

  } else if (reference.startsWith("TXN-")) {
    // Wallet top-up — upsert wallet transaction and update profile balance
    // First check if this transaction was already recorded (idempotency)
    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("id", reference)
      .maybeSingle();

    if (existing) {
      // Already processed by the client-side callback
      return new Response("OK", { status: 200 });
    }

    const email = event.data.customer.email;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, wallet_balance")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      console.error("Profile not found for email:", email);
      return new Response("OK", { status: 200 });
    }

    const newBalance = (profile.wallet_balance ?? 0) + amountNaira;

    const { error: txnError } = await supabase.from("wallet_transactions").insert({
      id: reference,
      user_id: profile.id,
      description: "Wallet Top-up",
      amount: amountNaira,
      type: "credit",
      running_balance: newBalance,
      reference,
    });

    if (txnError && txnError.code !== "23505") {
      // 23505 = unique violation (already inserted) — safe to ignore
      console.error("Wallet txn insert failed:", txnError.message);
      return new Response("Internal Error", { status: 500 });
    }

    await supabase
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("id", profile.id);

    // Send wallet top-up confirmation email (fire-and-forget)
    await fireEmail({
      template: "wallet_topup",
      to: email,
      data: {
        name: profile.name || email.split("@")[0],
        amount: formatNaira(amountNaira),
        newBalance: formatNaira(newBalance),
        reference,
      },
    });
  }

  return new Response("OK", { status: 200 });
});
