/**
 * Единый клиент Supabase с поддержкой Reverse Proxy.
 * Все запросы идут через /api/db для обхода блокировок.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Anon key - публичный, можно хранить в коде
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o";

/**
 * Вычисляем URL для прокси динамически.
 * В браузере используем origin текущего домена + /api/db
 * Это позволяет Vercel перенаправить запросы на Supabase.
 */
const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // В браузере - используем текущий домен приложения
    return `${window.location.origin}/api/db`;
  }
  // Fallback для SSR (если когда-либо понадобится)
  return 'https://top-focus.ru/api/db';
};

const supabaseUrl = getSupabaseUrl();

// Создаём единственный экземпляр клиента
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
      // Заголовок для идентификации запросов от нашего приложения
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
