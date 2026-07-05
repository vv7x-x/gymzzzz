import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const isConfigured = SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL';

export const supabase = isConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: { 'x-app-name': 'gymos' }
      }
    })
  : null;

export function isSupabaseReady() {
  return !!supabase;
}
