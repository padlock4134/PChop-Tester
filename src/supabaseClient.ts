import { createClient } from '@supabase/supabase-js';

interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

const env = import.meta.env as ImportMetaEnv;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

let supabaseJwt: string | null = null;

export const setSupabaseJwt = (token: string) => {
  supabaseJwt = token;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => supabaseJwt,
});
