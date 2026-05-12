"use client";

import { useState, useTransition } from "react";
import { trialSignupAction } from "./actions";
import type { PricingTier } from "@/lib/stripe";

export default function SignupForm({
  tier,
  interval,
}: {
  tier: PricingTier;
  interval: "monthly" | "yearly";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("tier", tier);
    fd.set("interval", interval);
    start(async () => {
      const result = await trialSignupAction(fd);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Naam van je agency *</span>
        <input
          name="agency_name"
          type="text"
          required
          autoComplete="organization"
          placeholder="Bijv. Spinnin' Records Management"
          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Jouw naam *</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Voor- en achternaam"
          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Email *</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="naam@agency.com"
          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink-700">Wachtwoord *</span>
        <input
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="Min. 10 tekens"
          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>

      {error && (
        <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full mt-2 px-4 py-3 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-wait inline-flex items-center justify-center gap-2"
      >
        {pending ? "Bezig..." : (
          <>
            Naar betaling →
            <span className="text-[11px] font-normal opacity-80">(geen kosten in eerste 7 dagen)</span>
          </>
        )}
      </button>
    </form>
  );
}
