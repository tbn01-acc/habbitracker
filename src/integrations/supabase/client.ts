/**
 * Единый клиент Supabase.
 * Используем прямое подключение к Supabase для надёжности.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// URL и ключ из переменных окружения
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jexrtsyokhegjxnvqjur.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o";

// Создаём единственный экземпляр клиента
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
 * Вспомогательная функция для проверки работоспособности соединения.
 */
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    return { success: false, error: err };
  }
};
