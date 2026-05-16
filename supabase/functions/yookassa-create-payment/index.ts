import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-app-source, x-application-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Server-side price table (RUB), per plan + billing period.
  // The webhook re-validates the actual paid amount against this table.
  const PRICE_TABLE: Record<string, Record<string, number>> = {
    pro:     { monthly: 349, quarterly: 995,  semiannual: 1780, annual: 3350, biennial: 5863, lifetime: 7490 },
    premium: { monthly: 449, quarterly: 1280, semiannual: 2290, annual: 4310, biennial: 7543, lifetime: 9990 },
    profi:   { monthly: 399, quarterly: 1138, semiannual: 2035, annual: 3832, biennial: 6697, lifetime: 8790 },
  };
  // Minimum acceptable percentage of the base price (promo codes can discount,
  // but never below this floor). 50% caps the maximum promo discount.
  const MIN_DISCOUNT_FACTOR = 0.5;

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { period, description, returnUrl, paymentMethodType, planId } = body;
    const clientAmount = Number(body.amount);

    const normalizedPeriod = typeof period === "string" ? period : "monthly";
    const normalizedPlan = typeof planId === "string" && PRICE_TABLE[planId] ? planId : "pro";
    const planTable = PRICE_TABLE[normalizedPlan];
    if (!planTable || !Object.prototype.hasOwnProperty.call(planTable, normalizedPeriod)) {
      return new Response(JSON.stringify({ error: "Invalid plan or period" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const basePrice = planTable[normalizedPeriod];
    const minPrice = Math.round(basePrice * MIN_DISCOUNT_FACTOR);
    // Honor a client-supplied (discounted) amount only within the allowed band.
    // If the client tries to undercut the floor, fall back to the base price.
    const amount =
      Number.isFinite(clientAmount) && clientAmount >= minPrice && clientAmount <= basePrice
        ? clientAmount
        : basePrice;

    const shopId = Deno.env.get("YOOKASSA_SHOP_ID");
    const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY");

    if (!shopId || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate idempotency key
    const idempotencyKey = crypto.randomUUID();

    // Build payment method data (for SBP or default card)
    const paymentMethodData: Record<string, string> | undefined =
      paymentMethodType === "sbp"
        ? { type: "sbp" }
        : paymentMethodType === "bank_card"
        ? { type: "bank_card" }
        : undefined;

    // Create payment via YooKassa API
    const paymentBody: Record<string, unknown> = {
      amount: {
        value: amount.toFixed(2),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: returnUrl || "https://top-focus.ru/profile",
      },
      capture: true,
      description: description || `ТопФокус PRO — ${normalizedPeriod}`,
      metadata: {
        user_id: user.id,
        period: normalizedPeriod,
        plan_id: normalizedPlan,
        base_price: basePrice,
        min_price: minPrice,
        expected_amount: amount,
      },
    };

    if (paymentMethodData) {
      paymentBody.payment_method_data = paymentMethodData;
    }

    const yooResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotencyKey,
        Authorization:
          "Basic " + btoa(`${shopId}:${secretKey}`),
      },
      body: JSON.stringify(paymentBody),
    });

    if (!yooResponse.ok) {
      const errBody = await yooResponse.text();
      console.error("YooKassa API error:", errBody);
      return new Response(
        JSON.stringify({ error: "Payment creation failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payment = await yooResponse.json();

    // Save payment record in DB using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      invoice_id: payment.id,
      amount: amount,
      currency: "RUB",
      status: "pending",
      payment_method: "yookassa",
      subscription_period: normalizedPeriod,
      metadata: { yookassa_payment_id: payment.id },
    });

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        confirmation_url: payment.confirmation.confirmation_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
