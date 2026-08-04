import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This endpoint is a server-to-server webhook. It is NEVER called from a
// browser, so CORS is deliberately closed: no wildcard origin, no preflight.
const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

// Official YooKassa notification source networks.
// https://yookassa.ru/developers/using-api/webhooks
const YOOKASSA_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
  "77.75.154.128/25",
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt === null || rangeInt === null) return false;
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

// Constant-time string comparison
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Period -> days mapping
const periodDaysMap: Record<string, number | null> = {
  monthly: 30,
  quarterly: 90,
  semiannual: 180,
  annual: 365,
  biennial: 730,
  lifetime: null, // no expiration
};

// Server-side price table per plan + billing period.
// The webhook enforces that the paid amount is at least 50% of the base price
// for the selected plan/period combination.
const PLAN_PRICE_TABLE: Record<string, Record<string, number>> = {
  pro:     { monthly: 349, quarterly: 995,  semiannual: 1780, annual: 3350, biennial: 5863, lifetime: 7490 },
  premium: { monthly: 449, quarterly: 1280, semiannual: 2290, annual: 4310, biennial: 7543, lifetime: 9990 },
  profi:   { monthly: 399, quarterly: 1138, semiannual: 2035, annual: 3832, biennial: 6697, lifetime: 8790 },
};
const MIN_DISCOUNT_FACTOR = 0.5;

Deno.serve(async (req) => {
  // No browser access at all — reject preflight and non-POST outright.
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  // ---- ORIGIN AUTHENTICATION ----
  // 1) Shared secret header (configured in the YooKassa webhook URL/headers).
  // 2) Source IP must belong to YooKassa's published notification ranges.
  const expectedSecret = Deno.env.get("YOOKASSA_WEBHOOK_SECRET");
  const providedSecret =
    req.headers.get("x-yookassa-webhook-secret") ??
    new URL(req.url).searchParams.get("secret") ??
    "";

  const secretOk = !!expectedSecret && safeEqual(providedSecret, expectedSecret);

  const clientIp = getClientIp(req);
  const ipOk = !!clientIp && YOOKASSA_CIDRS.some((c) => ipInCidr(clientIp, c));

  if (!secretOk && !ipOk) {
    console.error("Rejected webhook: bad secret and untrusted IP", { clientIp });
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: jsonHeaders,
    });
  }


  try {
    const body = await req.json();
    const event = body.event;

    // We only care about successful payments
    if (event !== "payment.succeeded") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...jsonHeaders },
      });
    }

    const paymentObj = body.object;
    const paymentId = paymentObj.id;
    const userId = paymentObj.metadata?.user_id;
    const period = paymentObj.metadata?.period || "monthly";

    if (!userId) {
      console.error("No user_id in payment metadata", paymentId);
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    if (!paymentId || typeof paymentId !== "string") {
      console.error("Invalid payment ID");
      return new Response(JSON.stringify({ error: "Invalid payment_id" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    // Validate period value
    if (!Object.keys(periodDaysMap).includes(period)) {
      console.error("Invalid period value:", period);
      return new Response(JSON.stringify({ error: "Invalid period" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    // ---- SERVER-SIDE VERIFICATION ----
    // Short-circuit: if we've already processed this payment, skip the outbound
    // YooKassa API call entirely. This prevents an attacker from triggering
    // unbounded outbound API hammering by replaying old payment IDs.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: alreadyPaid } = await supabase
      .from("payments")
      .select("status")
      .eq("invoice_id", paymentId)
      .eq("status", "paid")
      .maybeSingle();

    if (alreadyPaid) {
      return new Response(JSON.stringify({ ok: true, already_processed: true }), {
        status: 200,
        headers: { ...jsonHeaders },
      });
    }

    // Verify the payment actually exists and succeeded in YooKassa
    const shopId = Deno.env.get("YOOKASSA_SHOP_ID");
    const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY");

    if (!shopId || !secretKey) {
      console.error("YooKassa credentials not configured");
      return new Response(JSON.stringify({ error: "Payment system not configured" }), {
        status: 500,
        headers: { ...jsonHeaders },
      });
    }

    // Fetch the payment from YooKassa API to verify it's real and succeeded
    const verifyResponse = await fetch(
      `https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: "Basic " + btoa(`${shopId}:${secretKey}`),
          "Content-Type": "application/json",
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error("Failed to verify payment with YooKassa:", verifyResponse.status);
      return new Response(JSON.stringify({ error: "Payment verification failed" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    const verifiedPayment = await verifyResponse.json();

    // Verify the payment status is actually "succeeded"
    if (verifiedPayment.status !== "succeeded") {
      console.error(`Payment ${paymentId} status is "${verifiedPayment.status}", not "succeeded"`);
      return new Response(JSON.stringify({ error: "Payment not succeeded" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    // Verify the user_id in metadata matches what YooKassa has
    const verifiedUserId = verifiedPayment.metadata?.user_id;
    if (verifiedUserId !== userId) {
      console.error(`User ID mismatch: webhook=${userId}, YooKassa=${verifiedUserId}`);
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 403,
        headers: { ...jsonHeaders },
      });
    }

    // Use verified data from YooKassa, not from the webhook payload
    const verifiedPeriod = verifiedPayment.metadata?.period || "monthly";
    if (!Object.keys(periodDaysMap).includes(verifiedPeriod)) {
      console.error("Invalid verified period:", verifiedPeriod);
      return new Response(JSON.stringify({ error: "Invalid period" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    // Verify the paid amount is at least the minimum acceptable price for
    // the chosen plan + period (allows promo discounts, blocks 1-kopek hacks).
    const verifiedPlan = (verifiedPayment.metadata?.plan_id as string) || "pro";
    const planRow = PLAN_PRICE_TABLE[verifiedPlan];
    if (!planRow || planRow[verifiedPeriod] == null) {
      console.error(`Unknown plan/period: ${verifiedPlan}/${verifiedPeriod}`);
      return new Response(JSON.stringify({ error: "Unknown plan/period" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }
    const basePrice = planRow[verifiedPeriod];
    const minAcceptable = Math.round(basePrice * MIN_DISCOUNT_FACTOR);
    const paidAmount = parseFloat(verifiedPayment.amount?.value ?? "0");
    if (!paidAmount || paidAmount + 0.01 < minAcceptable) {
      console.error(`Underpayment for ${verifiedPlan}/${verifiedPeriod}: paid=${paidAmount}, min=${minAcceptable}`);
      return new Response(JSON.stringify({ error: "Amount below minimum price" }), {
        status: 400,
        headers: { ...jsonHeaders },
      });
    }

    // Idempotency: re-check inside the transaction window
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("invoice_id", paymentId)
      .single();

    if (existingPayment?.status === "paid") {
      console.log(`Payment ${paymentId} already processed, skipping.`);
      return new Response(JSON.stringify({ ok: true, already_processed: true }), {
        status: 200,
        headers: { ...jsonHeaders },
      });
    }

    // Update payment status
    await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("invoice_id", paymentId);

    // Calculate subscription expiration
    const days = periodDaysMap[verifiedPeriod];
    const now = new Date();
    const expiresAt = days
      ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Upsert subscription
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: verifiedUserId,
          plan: "pro",
          period: verifiedPeriod,
          started_at: now.toISOString(),
          expires_at: expiresAt,
          is_trial: false,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subError) {
      console.error("Subscription upsert error:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to activate subscription" }),
        {
          status: 500,
          headers: { ...jsonHeaders },
        }
      );
    }

    console.log(`Payment ${paymentId} verified and processed. User ${verifiedUserId} upgraded to PRO (${verifiedPeriod}).`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...jsonHeaders },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...jsonHeaders },
    });
  }
});
