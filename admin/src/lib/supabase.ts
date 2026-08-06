import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL && import.meta.env.DEV) {
  console.warn('[supabase] VITE_SUPABASE_URL not set — using placeholder. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for full Supabase features.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

