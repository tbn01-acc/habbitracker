import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Fetch pending messages (batch of 50)
    const { data: messages, error: fetchError } = await supabase
      .from('telegram_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) throw fetchError
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sent = 0
    let failed = 0

    for (const msg of messages) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: msg.chat_id,
              text: msg.message,
              parse_mode: 'HTML',
            }),
          }
        )

        const result = await res.json()

        if (result.ok) {
          await supabase
            .from('telegram_queue')
            .update({ status: 'sent' })
            .eq('id', msg.id)
          sent++
        } else {
          await supabase
            .from('telegram_queue')
            .update({ status: 'failed' })
            .eq('id', msg.id)
          failed++
          console.error(`Failed to send to ${msg.chat_id}:`, result.description)
        }
      } catch (sendErr) {
        await supabase
          .from('telegram_queue')
          .update({ status: 'failed' })
          .eq('id', msg.id)
        failed++
        console.error(`Error sending to ${msg.chat_id}:`, sendErr)
      }
    }

    return new Response(
      JSON.stringify({ processed: messages.length, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('telegram-processor error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
