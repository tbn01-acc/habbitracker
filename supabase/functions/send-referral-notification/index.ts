import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "activation" | "payment";
  referrer_id: string;
  referred_id: string;
  referred_name?: string;
  payment_amount?: number;
  commission_amount?: number;
  bonus_weeks?: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-referral-notification");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user is authenticated
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: NotificationRequest = await req.json();
    console.log("Notification request:", body);

    const { type, referrer_id, referred_id, referred_name, payment_amount, commission_amount, bonus_weeks } = body;

    // Get referrer email and profile
    const { data: referrerAuth } = await supabase.auth.admin.getUserById(referrer_id);
    if (!referrerAuth?.user?.email) {
      console.log("Referrer email not found");
      return new Response(
        JSON.stringify({ error: "Referrer email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const referrerEmail = referrerAuth.user.email;

    // Get referrer profile
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", referrer_id)
      .single();

    const referrerName = referrerProfile?.display_name || "Партнёр";
    const refName = referred_name || "пользователь";

    let subject = "";
    let html = "";

    if (type === "activation") {
      subject = "🎉 Ваш реферал активирован!";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; border-radius: 12px; text-align: center; color: white; }
            .content { padding: 30px 20px; }
            .highlight { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .bonus { font-size: 24px; font-weight: bold; color: #22c55e; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Реферал активирован!</h1>
            </div>
            <div class="content">
              <p>Привет, ${referrerName}!</p>
              <p>Отличные новости! Ваш реферал <strong>${refName}</strong> выполнил условия активации:</p>
              <ul>
                <li>✅ 7 дней использования приложения</li>
                <li>✅ 30+ минут активного времени</li>
              </ul>
              <div class="highlight">
                <p>Вам начислен бонус:</p>
                <p class="bonus">+${bonus_weeks || 1} недель PRO</p>
              </div>
              <p>Продолжайте приглашать друзей и получайте ещё больше бонусов!</p>
            </div>
            <div class="footer">
              <p>Это автоматическое уведомление от ТопФокус</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === "payment") {
      subject = "💰 Ваш реферал оплатил подписку!";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #f97316); padding: 30px; border-radius: 12px; text-align: center; color: white; }
            .content { padding: 30px 20px; }
            .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .bonus { font-size: 24px; font-weight: bold; color: #f59e0b; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Оплата от реферала!</h1>
            </div>
            <div class="content">
              <p>Привет, ${referrerName}!</p>
              <p>Ваш реферал <strong>${refName}</strong> оплатил PRO подписку!</p>
              ${payment_amount ? `<p>Сумма платежа: <strong>${payment_amount.toLocaleString()} ₽</strong></p>` : ''}
              <div class="highlight">
                ${commission_amount ? `<p>Ваша комиссия: <span class="bonus">+${commission_amount.toLocaleString()} ₽</span></p>` : ''}
                ${bonus_weeks ? `<p>Бонусные недели: <span class="bonus">+${bonus_weeks} недель PRO</span></p>` : ''}
              </div>
              <p>Средства зачислены на ваш кошелёк в приложении.</p>
            </div>
            <div class="footer">
              <p>Это автоматическое уведомление от ТопФокус</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${type} email to ${referrerEmail}`);

    const emailResponse = await resend.emails.send({
      from: "ТопФокус <notifications@resend.dev>",
      to: [referrerEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
