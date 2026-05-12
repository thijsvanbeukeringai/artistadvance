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

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
  yearly: process.env.STRIPE_PRICE_YEARLY ?? "",
};

export function isStripeConfigured(): boolean {
  return !!key && !!STRIPE_PRICES.monthly && !!STRIPE_PRICES.yearly;
}
