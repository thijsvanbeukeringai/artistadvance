// Supabase client wrapper.
// Voor demo: gebruikt anon-key (publishable) met open RLS policies. Productie:
// vervang met server-side service-role + scoped RLS via auth.uid().

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!_client) {
    _client = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(url && anonKey);
}

export function supabaseStatus() {
  return {
    configured: isSupabaseConfigured(),
    url: url ?? null,
    project_id: url ? url.replace("https://", "").split(".")[0] : null,
  };
}
