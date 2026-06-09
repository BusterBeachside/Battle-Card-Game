import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  let url = '';
  let key = '';

  // 1. Try compiler direct replacement globals
  try {
    // @ts-ignore
    url = __SUPABASE_URL__;
    // @ts-ignore
    key = __SUPABASE_ANON_KEY__;
  } catch (e) {
    // Falls back if compile-time globals aren't defined
  }

  // 2. Try standard import.meta.env properties
  if (!url) {
    url = import.meta.env.VITE_SUPABASE_URL || '';
  }
  if (!key) {
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  // 3. Try process.env variables if defined
  if (!url) {
    try {
      url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    } catch (e) {}
  }
  if (!key) {
    try {
      key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    } catch (e) {}
  }

  // Diagnostic log (fully secure, masks the secret key content)
  console.log("[Supabase Config Status Check]:", {
    hasUrl: !!url,
    urlLength: url ? url.length : 0,
    hasKey: !!key,
    keyLength: key ? key.length : 0,
    urlSnippet: url ? url.substring(0, 16) + "..." : "none"
  });

  if (!url || !key) {
    console.warn("Supabase credentials are not configured in environment variables. Define VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or SUPABASE_URL / SUPABASE_ANON_KEY.");
    return null;
  }

  try {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}
