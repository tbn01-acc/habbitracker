import { createClient } from '@supabase/supabase-js';

// Вычисляем полный URL: https://top-focus.ru/_supabase
const getSupabaseUrl = () => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || '/_supabase';
  if (typeof window !== 'undefined') {
    // Если это относительный путь, превращаем его в абсолютный для браузера
    return baseUrl.startsWith('/') 
      ? `${window.location.origin}${baseUrl}` 
      : baseUrl;
  }
  return `https://top-focus.ru${baseUrl}`;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'topfocus-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'top-focus-oda',
      'x-app-source': 'top-focus-pwa'
    },
  },
});
