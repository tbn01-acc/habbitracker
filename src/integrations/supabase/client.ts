/**
 * Единый клиент Supabase с поддержкой Reverse Proxy.
 * Все запросы идут через /api/db для обхода блокировок.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Anon key - публичный, можно хранить в коде
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o";

/**
 * URL для прокси:
 * - В браузере: origin + /api/db (Vercel rewrite -> supabase.co)
 * - Fallback для SSR: top-focus.ru/api/db
 */
const getSupabaseUrl = (): string => {
  // Allow override via env var (e.g. direct Supabase URL for local dev)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && !envUrl.startsWith('/')) return envUrl;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/db`;
  }
  return 'https://top-focus.ru/api/db';
};

const supabaseUrl = getSupabaseUrl();

export const supabase = createClient<Database>(supabaseUrl, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'topfocus-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'top-focus-oda',
      'x-app-source': 'top-focus-pwa',
    },
  },
});

/**
 * Вспомогательная функция для проверки работоспособности прокси.
 */
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✅ Supabase proxy connection successful');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Supabase proxy connection failed:', err);
    return { success: false, error: err };
  }
};
