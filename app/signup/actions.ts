"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseService } from "@/lib/supabase-service";
import { stripeClient, priceIdFor, isStripeConfigured, type PricingTier, type BillingInterval } from "@/lib/stripe";

type SignupResult = { ok: true } | { ok: false; error: string };

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function asTier(v: string): PricingTier {
  return v === "starter" || v === "agency" || v === "group" ? v : "agency";
}
function asInterval(v: string): BillingInterval {
  return v === "yearly" ? "yearly" : "monthly";
}

/**
 * Trial-signup vanaf de landing-page:
 *  1) Maak Supabase auth-user aan + auto-confirm
 *  2) Maak nieuwe organisatie (management) aan met de agency-naam
 *  3) Maak users-row aan met role=agency_admin (eerste gebruiker = baas van eigen org)
 *  4) Login + zet system cookies (agency mode)
 *  5) Maak Stripe customer + Checkout session met 7-dagen trial
 *  6) Redirect naar Stripe Checkout — kaart wordt vooraf gevraagd, eerste afschrijving = dag 8
 */
export async function trialSignupAction(formData: FormData): Promise<SignupResult> {
  const agencyName = String(formData.get("agency_name") || "").trim();
  const fullName = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const tier = asTier(String(formData.get("tier") || "agency"));
  const interval = asInterval(String(formData.get("interval") || "monthly"));

  if (!agencyName) return { ok: false, error: "Naam van je agency is verplicht." };
  if (!fullName) return { ok: false, error: "Jouw naam is verplicht." };
  if (!email) return { ok: false, error: "Email is verplicht." };
  if (!password || password.length < 10) return { ok: false, error: "Wachtwoord moet minstens 10 tekens zijn." };
  if (!isStripeConfigured()) return { ok: false, error: "Billing nog niet geconfigureerd. Probeer later opnieuw." };
  const priceId = priceIdFor(tier, interval);
  if (!priceId) return { ok: false, error: `Geen prijs geconfigureerd voor ${tier} ${interval}.` };

  const c = supabaseServer();
  if (!c) return { ok: false, error: "Supabase niet geconfigureerd." };

  // 1) Auth user
  const { data: signed, error: suErr } = await c.auth.signUp({ email, password });
  if (suErr) return { ok: false, error: suErr.message };
  if (!signed.user) return { ok: false, error: "Geen user terug van Supabase." };

  const svc = supabaseService();

  // Auto-confirm als nodig
  if (!signed.session) {
    await svc.rpc("confirm_signup", { user_id: signed.user.id });
    const { error: signInErr } = await c.auth.signInWithPassword({ email, password });
    if (signInErr) return { ok: false, error: signInErr.message };
  }

  // 2) Nieuwe organisatie voor deze agency
  const { data: org, error: orgErr } = await svc
    .from("organizations")
    .insert({ name: agencyName, type: "management" })
    .select("id")
    .single();
  if (orgErr || !org) {
    return { ok: false, error: `Agency aanmaken faalde: ${orgErr?.message ?? "onbekend"}` };
  }

  // 3) Users-row als agency_admin
  const { error: insertErr } = await svc.from("users").insert({
    auth_id: signed.user.id,
    organization_id: org.id,
    name: fullName,
    email,
    role: "agency_admin",
  });
  if (insertErr) {
    return { ok: false, error: `Profiel aanmaken faalde: ${insertErr.message}` };
  }

  // 4) System cookies: agency mode, scope op deze org
  const jar = cookies();
  jar.set("aa_account_mode", "agency", COOKIE_OPTS);
  jar.set("aa_account_id", org.id, COOKIE_OPTS);

  // 5) Stripe customer + Checkout session met trial
  const stripe = stripeClient();
  const customer = await stripe.customers.create({
    email,
    name: agencyName,
    metadata: { organization_id: org.id },
  });
  await svc.from("organization_subscriptions").upsert(
    { organization_id: org.id, stripe_customer_id: customer.id },
    { onConflict: "organization_id" },
  );

  const hdrs = headers();
  const protocol = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "localhost:3010";
  const base = `${protocol}://${host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/billing/cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { organization_id: org.id },
      trial_period_days: 7,
    },
    metadata: { organization_id: org.id },
  });

  if (!session.url) return { ok: false, error: "Stripe checkout-URL niet ontvangen." };

  revalidatePath("/", "layout");
  redirect(session.url);
}
