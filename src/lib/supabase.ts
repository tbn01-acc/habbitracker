/**
 * Re-export Supabase client from integrations.
 * Используем единый клиент для всего приложения.
 */
export { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';
