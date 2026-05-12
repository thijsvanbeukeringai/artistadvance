import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

let cached: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!key) throw new Error("STRIPE_SECRET_KEY niet gezet");
  if (cached) return cached;
  cached = new Stripe(key);
  return cached;
}

/**
 * Tier-aware pricing.
 * Per tier (starter/agency/group) ZIJN er een maand- en jaar-price ID.
 * Voor backward-compatibility valt elke price terug op de eerder bestaande
 * STRIPE_PRICE_MONTHLY/STRIPE_PRICE_YEARLY als de tier-specifieke env-var
 * niet gezet is — handig tijdens setup, niet voor productie.
 */
export type PricingTier = "starter" | "agency" | "group";
export type BillingInterval = "monthly" | "yearly";

export const STRIPE_PRICES: Record<PricingTier, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? process.env.STRIPE_PRICE_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? process.env.STRIPE_PRICE_YEARLY ?? "",
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? process.env.STRIPE_PRICE_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY ?? process.env.STRIPE_PRICE_YEARLY ?? "",
  },
  group: {
    monthly: process.env.STRIPE_PRICE_GROUP_MONTHLY ?? process.env.STRIPE_PRICE_MONTHLY ?? "",
    yearly: process.env.STRIPE_PRICE_GROUP_YEARLY ?? process.env.STRIPE_PRICE_YEARLY ?? "",
  },
};

export function isStripeConfigured(): boolean {
  if (!key) return false;
  // Minstens één tier×interval gezet
  return Object.values(STRIPE_PRICES).some((t) => t.monthly && t.yearly);
}

export function priceIdFor(tier: PricingTier, interval: BillingInterval): string | null {
  return STRIPE_PRICES[tier][interval] || null;
}
