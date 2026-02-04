import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ""
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Обработка CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()
    if (!initData) throw new Error("No initData provided")

    // 1. Валидация данных Telegram (проверка подписи бота)
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')

    const dataCheckString = Array.from(urlParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n')

    const secretKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const secretHash = await crypto.subtle.sign("HMAC", secretKey, new TextEncoder().encode(BOT_TOKEN))
    
    const signatureKey = await crypto.subtle.importKey(
      "raw",
      secretHash,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signature = await crypto.subtle.sign("HMAC", signatureKey, new TextEncoder().encode(dataCheckString))
    
    const hexSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (hexSignature !== hash) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 2. Извлекаем данные пользователя
    const userString = urlParams.get('user')
    if (!userString) throw new Error("No user data")
    const tgUser = JSON.parse(userString)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 3. Создаем или авторизуем пользователя в Auth Supabase
    // Используем email как заглушку, так как Auth требует уникальный идентификатор
    const email = `tg_${tgUser.id}@telegram.bot`
    const password = crypto.randomUUID() // Пароль не важен при таком входе

    // Пытаемся найти пользователя или создать нового
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgUser.id.toString(),
        username: tgUser.username,
        full_name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
        avatar_url: tgUser.photo_url
      }
    })

    // Если пользователь уже существует — просто получаем его данные
    let userId = authData?.user?.id
    if (authError && authError.message.includes("already registered")) {
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const foundUser = existingUser.users.find(u => u.email === email)
        userId = foundUser?.id
    }

    // 4. Генерируем магическую ссылку или сессию (здесь для простоты создаем сессию)
    const { data: sessionData, error: loginError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (loginError) throw loginError

    return new Response(JSON.stringify({ 
        access_token: sessionData.properties?.action_link?.split('token=')[1]?.split('&')[0] || "check_email",
        refresh_token: "" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
