import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;
let cachedFallback: SupabaseClient | null = null;

/**
 * Next.js cached fetch resultaten van Supabase queries op productie. Daardoor
 * laat een net-toegevoegde vlucht zich pas zien NA cache-expiry of een
 * full redeploy. Door cache:'no-store' op de fetch te zetten omzeilen we
 * de Next.js fetch-cache; React cache() in loadSnapshot blijft binnen één
 * request memoizen (geen probleem).
 */
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input as RequestInfo, { ...init, cache: "no-store" as RequestCache });

/**
 * Server-only Supabase client.
 *
 * - Met SERVICE_ROLE_KEY: bypasst RLS, gebruik in server actions / RSC.
 * - Zonder SERVICE_ROLE_KEY: fallback naar anon-client (RLS van kracht).
 *   Werkt alleen als de DB read-policies voor anon heeft.
 */
export function supabaseService(): SupabaseClient {
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL niet gezet");

  if (serviceKey) {
    if (cached) return cached;
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: noStoreFetch },
    });
    return cached;
  }

  // Fallback: anon-client. RLS blijft actief. Writes vereisen schrijfrechten
  // op de policy; bij ontbreken silently faalt de write.
  if (!anonKey) throw new Error("Noch SUPABASE_SERVICE_ROLE_KEY noch NEXT_PUBLIC_SUPABASE_ANON_KEY gezet.");
  if (cachedFallback) return cachedFallback;
  if (process.env.NODE_ENV !== "production") {
    console.warn("[supabase] SERVICE_ROLE_KEY ontbreekt — anon-fallback actief. Schrijf-acties zullen falen.");
  }
  cachedFallback = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
  return cachedFallback;
}
