import { createClient } from '@supabase/supabase-js';

/**
 * Legacy supabase client — redirects to the unified client.
 * Kept for backward compatibility with imports from '@/lib/supabase'.
 */
const getSupabaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && !envUrl.startsWith('/')) return envUrl;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/db`;
  }
  return 'https://top-focus.ru/api/db';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o";

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
      'x-app-source': 'top-focus-pwa',
    },
  },
});
