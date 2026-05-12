import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient, isStripeConfigured } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) return NextResponse.json({ ok: false, error: "Stripe niet geconfigureerd" }, { status: 503 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ ok: false, error: "Webhook secret ontbreekt" }, { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ ok: false, error: "Geen signature" }, { status: 400 });

  const stripe = stripeClient();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Bad signature: ${(err as Error).message}` }, { status: 400 });
  }

  const svc = supabaseService();

  async function upsertFromSubscription(sub: any) {
    const orgId = (sub.metadata?.organization_id ?? "").toString() || null;
    if (!orgId) return;
    const priceId = sub.items?.data?.[0]?.price?.id ?? null;
    const interval = sub.items?.data?.[0]?.price?.recurring?.interval ?? null;
    const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
    await svc.from("organization_subscriptions").upsert(
      {
        organization_id: orgId,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        status: sub.status,
        interval,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertFromSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertFromSubscription(sub);
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as any;
      const subRef = inv.subscription ?? inv.parent?.subscription_details?.subscription;
      if (subRef) {
        const subId = typeof subRef === "string" ? subRef : subRef.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertFromSubscription(sub);
      }
      break;
    }
    default:
      // Niet handelen, maar wel ACKen zodat Stripe niet retried.
      break;
  }

  return NextResponse.json({ received: true });
}
