"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { createCheckoutSessionAction, openBillingPortalAction } from "@/lib/billing";

export default function BillingActions({
  hasSubscription,
  hasCustomer,
  stripeReady,
}: {
  hasSubscription: boolean;
  hasCustomer: boolean;
  stripeReady: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startCheckout(interval: "monthly" | "yearly") {
    setError(null);
    start(async () => {
      // BillingActions wijst standaard naar de Agency-tier (mid). Voor
      // andere tiers gebruik de Pricing-page op /landing#pricing.
      const result = await createCheckoutSessionAction("agency", interval);
      if (result && result.ok === false) setError(result.error);
    });
  }

  function openPortal() {
    setError(null);
    start(async () => {
      const result = await openBillingPortalAction();
      if (result && result.ok === false) setError(result.error);
    });
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Beheer</h3>
        <p className="text-[11px] text-ink-500 mt-0.5">Stripe portal: facturen, betaalmethode, plan upgraden of opzeggen.</p>
      </header>
      <div className="p-5 space-y-3">
        {hasCustomer && stripeReady && (
          <button
            type="button"
            onClick={openPortal}
            disabled={pending}
            className="w-full inline-flex items-center justify-between gap-3 bg-ink-900 text-white px-4 py-3 rounded-lg hover:bg-black transition disabled:opacity-50"
          >
            <span className="font-semibold text-sm">
              {pending ? "Bezig..." : "Open Stripe portal"}
            </span>
            <span className="text-xs opacity-70">Facturen · betaalmethode · plan wijzigen · opzeggen</span>
          </button>
        )}

        {!hasSubscription && stripeReady && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startCheckout("monthly")}
              disabled={pending}
              className="bg-white border border-ink-200 hover:border-brand-400 hover:shadow-card text-ink-900 px-4 py-3 rounded-lg text-left transition disabled:opacity-50"
            >
              <div className="font-semibold text-sm">Start maandabonnement</div>
              <div className="text-[11px] text-ink-500 mt-0.5">14 dagen gratis trial. Daarna maandelijks opzegbaar.</div>
            </button>
            <button
              type="button"
              onClick={() => startCheckout("yearly")}
              disabled={pending}
              className="bg-brand-50 border-2 border-brand-300 hover:border-brand-500 hover:shadow-card text-ink-900 px-4 py-3 rounded-lg text-left transition disabled:opacity-50"
            >
              <div className="font-semibold text-sm">Start jaarabonnement <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">-20%</span></div>
              <div className="text-[11px] text-ink-700 mt-0.5">14 dagen gratis trial. Daarna jaarlijks gefactureerd.</div>
            </button>
          </div>
        )}

        {!stripeReady && (
          <Link
            href="/landing#pricing"
            className="block text-center bg-ink-900 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-black transition"
          >
            Bekijk pricing op landing-page →
          </Link>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-xs">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
