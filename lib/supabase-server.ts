import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseServer(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  const jar = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return jar.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          jar.set({ name, value, ...options });
        } catch {
          // Read-only context (Server Component) - ignore.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          jar.set({ name, value: "", ...options });
        } catch {
          // Read-only context.
        }
      },
    },
  });
}

export async function currentUser() {
  const c = supabaseServer();
  if (!c) return null;
  const { data: { user } } = await c.auth.getUser();
  return user;
}
