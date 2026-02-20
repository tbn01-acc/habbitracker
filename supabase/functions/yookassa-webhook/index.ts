import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Period -> days mapping
const periodDaysMap: Record<string, number | null> = {
  monthly: 30,
  quarterly: 90,
  semiannual: 180,
  annual: 365,
  biennial: 730,
  lifetime: null, // no expiration
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const event = body.event;

    // We only care about successful payments
    if (event !== "payment.succeeded") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentId || typeof paymentId !== "string") {
      console.error("Invalid payment ID");
      return new Response(JSON.stringify({ error: "Invalid payment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate period value
    if (!Object.keys(periodDaysMap).includes(period)) {
      console.error("Invalid period value:", period);
      return new Response(JSON.stringify({ error: "Invalid period" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- SERVER-SIDE VERIFICATION ----
    // Verify the payment actually exists and succeeded in YooKassa
    const shopId = Deno.env.get("YOOKASSA_SHOP_ID");
    const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY");

    if (!shopId || !secretKey) {
      console.error("YooKassa credentials not configured");
      return new Response(JSON.stringify({ error: "Payment system not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifiedPayment = await verifyResponse.json();

    // Verify the payment status is actually "succeeded"
    if (verifiedPayment.status !== "succeeded") {
      console.error(`Payment ${paymentId} status is "${verifiedPayment.status}", not "succeeded"`);
      return new Response(JSON.stringify({ error: "Payment not succeeded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user_id in metadata matches what YooKassa has
    const verifiedUserId = verifiedPayment.metadata?.user_id;
    if (verifiedUserId !== userId) {
      console.error(`User ID mismatch: webhook=${userId}, YooKassa=${verifiedUserId}`);
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use verified data from YooKassa, not from the webhook payload
    const verifiedPeriod = verifiedPayment.metadata?.period || "monthly";
    if (!Object.keys(periodDaysMap).includes(verifiedPeriod)) {
      console.error("Invalid verified period:", verifiedPeriod);
      return new Response(JSON.stringify({ error: "Invalid period" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency: check if this payment was already processed
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("invoice_id", paymentId)
      .single();

    if (existingPayment?.status === "paid") {
      console.log(`Payment ${paymentId} already processed, skipping.`);
      return new Response(JSON.stringify({ ok: true, already_processed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Payment ${paymentId} verified and processed. User ${verifiedUserId} upgraded to PRO (${verifiedPeriod}).`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
