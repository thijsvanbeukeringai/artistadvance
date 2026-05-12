"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { readAccount } from "./account";
import { supabaseService } from "./supabase-service";
import { stripeClient, STRIPE_PRICES, isStripeConfigured } from "./stripe";

type BillingInterval = "monthly" | "yearly";

/** Maak (of hergebruik) Stripe customer voor deze organisatie. */
async function ensureStripeCustomer(organizationId: string, email: string | null): Promise<string> {
  const svc = supabaseService();
  const { data: existing } = await svc
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const { data: org } = await svc.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  const stripe = stripeClient();
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: org?.name ?? undefined,
    metadata: { organization_id: organizationId },
  });

  await svc.from("organization_subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_customer_id: customer.id,
    },
    { onConflict: "organization_id" },
  );

  return customer.id;
}

export async function createCheckoutSessionAction(interval: BillingInterval) {
  if (!isStripeConfigured()) {
    return { ok: false as const, error: "Billing nog niet geconfigureerd. Vraag de bouwer om Stripe-keys + price IDs." };
  }
  const account = await readAccount();
  if (account.role === "guest") return { ok: false as const, error: "Niet aangemeld." };
  if (!account.organizationId) return { ok: false as const, error: "Geen organisatie gekoppeld aan account." };
  if (account.role !== "super_admin" && account.role !== "agency_admin") {
    return { ok: false as const, error: "Alleen agency-admins mogen abonnement starten." };
  }

  const customerId = await ensureStripeCustomer(account.organizationId, account.userEmail);
  const priceId = interval === "yearly" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

  const hdrs = headers();
  const protocol = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "localhost:3010";
  const base = `${protocol}://${host}`;

  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/billing/cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { organization_id: account.organizationId },
      trial_period_days: 14,
    },
    metadata: { organization_id: account.organizationId },
  });

  if (!session.url) return { ok: false as const, error: "Stripe checkout-URL niet ontvangen." };
  redirect(session.url);
}

export async function openBillingPortalAction() {
  if (!isStripeConfigured()) return { ok: false as const, error: "Billing niet geconfigureerd." };
  const account = await readAccount();
  if (account.role === "guest") return { ok: false as const, error: "Niet aangemeld." };
  if (!account.organizationId) return { ok: false as const, error: "Geen organisatie." };

  const svc = supabaseService();
  const { data: sub } = await svc
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", account.organizationId)
    .maybeSingle();
  if (!sub?.stripe_customer_id) return { ok: false as const, error: "Geen Stripe customer." };

  const hdrs = headers();
  const protocol = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "localhost:3010";
  const base = `${protocol}://${host}`;

  const stripe = stripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${base}/settings`,
  });
  redirect(session.url);
}
