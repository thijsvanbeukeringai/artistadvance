import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client met service-role key.
 *
 * Bypasst RLS — gebruik ALLEEN binnen server-side code (server actions,
 * route handlers, RSC). Nooit exposeren naar de browser-bundle.
 *
 * Auth/session draait via `supabaseServer()` (anon + cookies). Voor
 * data-mutaties / reads buiten user-scope wordt deze service-client gebruikt.
 */
export function supabaseService(): SupabaseClient {
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL niet gezet");
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY niet gezet. Voeg toe aan .env.local en Vercel env vars (server-only, geen NEXT_PUBLIC_ prefix).",
    );
  }
  if (cached) return cached;
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
