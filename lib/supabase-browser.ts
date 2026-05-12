"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase niet geconfigureerd");
  if (!_client) _client = createBrowserClient(url, anonKey);
  return _client;
}
