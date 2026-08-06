import { createClient } from '@supabase/supabase-js';

// Placeholder fallbacks keep the CI build (no .env committed) and SSR-safe
// imports from crashing; real values come from the Vercel dashboard / local .env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL && import.meta.env.DEV) {
  console.warn('[supabase] VITE_SUPABASE_URL not set — using placeholder. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for full Supabase features.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
