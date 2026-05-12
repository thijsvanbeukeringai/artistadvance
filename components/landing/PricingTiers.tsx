"use client";

import { useState, useTransition } from "react";
import { createCheckoutSessionAction } from "@/lib/billing";

type Interval = "monthly" | "yearly";

const TIERS = [
  {
    name: "Starter",
    sub: "1-5 artiesten",
    monthly: 49,
    yearly: 470, // 49 * 12 * 0.80 ≈ 20% off
    bullets: ["Bookings + advancing", "Festivals CRM", "Financial dashboard", "Email support"],
    featured: false,
  },
  {
    name: "Agency",
    sub: "6-25 artiesten",
    monthly: 149,
    yearly: 1430,
    bullets: ["Alles van Starter", "Role-based teams", "Auto-contract generator", "Festival-portal", "Migratie vanaf sheet"],
    featured: true,
  },
  {
    name: "Group",
    sub: "25+ artiesten / multi-label",
    monthly: 399,
    yearly: 3830,
    bullets: ["Alles van Agency", "Multi-agency / super-admin", "Dedicated onboarding", "Custom integraties"],
    featured: false,
  },
];

export default function PricingTiers() {
  const [interval, setInterval] = useState<Interval>("yearly");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startCheckout() {
    setError(null);
    start(async () => {
      const result = await createCheckoutSessionAction(interval);
      if (result && result.ok === false) setError(result.error);
    });
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/15 bg-canvas-mid">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={[
              "text-xs font-semibold px-4 py-2 rounded-full transition",
              interval === "monthly" ? "bg-neon-amber text-canvas-deep shadow-cta-glow" : "text-white/65 hover:text-white",
            ].join(" ")}
          >
            Per maand
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={[
              "text-xs font-semibold px-4 py-2 rounded-full transition inline-flex items-center gap-2",
              interval === "yearly" ? "bg-neon-amber text-canvas-deep shadow-cta-glow" : "text-white/65 hover:text-white",
            ].join(" ")}
          >
            Per jaar
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {TIERS.map((t, i) => {
          const price = interval === "yearly" ? Math.round(t.yearly / 12) : t.monthly;
          const billed = interval === "yearly" ? `€ ${t.yearly.toLocaleString("nl-NL")} per jaar` : "per maand";
          return (
            <div
              key={i}
              className={[
                "rounded-2xl p-6 transition-all",
                t.featured
                  ? "bg-canvas-mid border-2 border-neon-amber shadow-cta-glow"
                  : "bg-canvas-mid border border-white/10 hover:border-neon-amber/30",
              ].join(" ")}
            >
              <div className="font-extrabold text-xl text-white">{t.name}</div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-white/45 mt-1">{t.sub}</div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tabular-nums text-white">€ {price}</span>
                  <span className="text-xs text-white/50">/maand</span>
                </div>
                <div className="text-[11px] text-white/45 mt-1">{billed}</div>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                {t.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-neon-amber mt-0.5">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={startCheckout}
                disabled={pending}
                className={[
                  "mt-6 block w-full text-center text-sm font-semibold py-2.5 rounded-lg transition",
                  t.featured
                    ? "bg-neon-amber hover:bg-neon-ember text-canvas-deep disabled:opacity-50"
                    : "bg-white/10 hover:bg-white/15 text-white disabled:opacity-50",
                ].join(" ")}
              >
                {pending ? "Bezig..." : "Start 14-dagen trial"}
              </button>
            </div>
          );
        })}
      </div>
      {error && (
        <div className="mt-6 max-w-md mx-auto bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}
      <p className="text-center mt-8 text-[11px] text-white/45">
        14 dagen gratis proberen — daarna opzegbaar per maand of jaar.
      </p>
    </div>
  );
}
