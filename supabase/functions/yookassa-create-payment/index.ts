import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { amount, period, description, returnUrl, paymentMethodType } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      description: description || `ТопФокус PRO — ${period || "subscription"}`,
      metadata: {
        user_id: user.id,
        period: period || "monthly",
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
      amount: parseFloat(amount),
      currency: "RUB",
      status: "pending",
      payment_method: "yookassa",
      subscription_period: period || "monthly",
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
