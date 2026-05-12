"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseService } from "@/lib/supabase-service";

type AuthResult = { ok: true } | { ok: false; error: string };

/** Block //evil.com open-redirect; alleen single-leading-slash paths toegestaan. */
function safeRedirect(next: string): string {
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  if (next.includes("\\")) return "/";
  return next;
}

const COOKIE_MODE = "aa_account_mode";
const COOKIE_ID = "aa_account_id";

async function setSystemCookies(system: "agency" | "artist", authUserId: string) {
  const jar = cookies();
  const svc = supabaseService();
  const { data: profile } = await svc
    .from("users")
    .select("organization_id, role")
    .eq("auth_id", authUserId)
    .maybeSingle();
  const orgId = profile?.organization_id as string | null;

  if (system === "artist") {
    // Pak eerste artist van de gebruiker zijn organisatie (super-admin: eerste any-artist).
    let q = svc.from("artists").select("id, organization_id").order("name").limit(1);
    if (profile?.role !== "super_admin" && orgId) q = q.eq("organization_id", orgId);
    const { data: artist } = await q.maybeSingle();
    jar.set({ name: COOKIE_MODE, value: "artist", path: "/", sameSite: "lax", secure: true });
    if (artist?.id) jar.set({ name: COOKIE_ID, value: artist.id, path: "/", sameSite: "lax", secure: true });
    return;
  }

  // agency
  jar.set({ name: COOKIE_MODE, value: "agency", path: "/", sameSite: "lax", secure: true });
  if (orgId) jar.set({ name: COOKIE_ID, value: orgId, path: "/", sameSite: "lax", secure: true });
}

export async function signInAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeRedirect(String(formData.get("next") || "/"));
  const systemRaw = String(formData.get("system") || "agency");
  const system: "agency" | "artist" = systemRaw === "artist" ? "artist" : "agency";
  if (!email || !password) return { ok: false, error: "Email en wachtwoord verplicht." };

  const c = supabaseServer();
  if (!c) return { ok: false, error: "Supabase niet geconfigureerd." };

  const { data: signed, error } = await c.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  if (signed.user) await setSystemCookies(system, signed.user.id);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(formData: FormData): Promise<AuthResult> {
  // Productie-gating: zet ALLOW_SIGNUP=1 in env vars om sign-up open te zetten.
  // Default: signup uit (security-audit High-4).
  if (process.env.ALLOW_SIGNUP !== "1") {
    return { ok: false, error: "Sign-up is uitgeschakeld. Vraag een agency-admin om een uitnodiging." };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim() || email.split("@")[0];
  const next = safeRedirect(String(formData.get("next") || "/"));
  if (!email || !password) return { ok: false, error: "Email en wachtwoord verplicht." };
  if (password.length < 10) return { ok: false, error: "Wachtwoord moet minstens 10 tekens zijn." };

  const c = supabaseServer();
  if (!c) return { ok: false, error: "Supabase niet geconfigureerd." };

  const { data: signed, error } = await c.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  if (!signed.user) return { ok: false, error: "Geen user terug van Supabase." };

  // Auto-confirm via service-role (RPC is geblokkeerd voor anon/authenticated post-audit).
  if (!signed.session) {
    const svc = supabaseService();
    await svc.rpc("confirm_signup", { user_id: signed.user.id });
    const { error: signInErr } = await c.auth.signInWithPassword({ email, password });
    if (signInErr) return { ok: false, error: signInErr.message };
  }

  // Bootstrap users-row via service-role (RLS blokkeert anonymous/authenticated writes).
  const svc = supabaseService();
  const { data: org } = await svc.from("organizations").select("id")
    .eq("type", "management")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const organizationId = org?.id ?? null;

  const systemRaw = String(formData.get("system") || "agency");
  const system: "agency" | "artist" = systemRaw === "artist" ? "artist" : "agency";

  // Standaard: agency_member voor agency-signup, advancing_member voor artist-signup.
  // Super-admin role MOET handmatig via DB worden gezet.
  const { error: insertErr } = await svc.from("users").insert({
    auth_id: signed.user.id,
    organization_id: organizationId,
    name,
    email,
    role: system === "artist" ? "advancing_member" : "agency_member",
  });
  if (insertErr) return { ok: false, error: `Profiel aanmaken faalde: ${insertErr.message}` };

  await setSystemCookies(system, signed.user.id);

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const c = supabaseServer();
  if (c) await c.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
