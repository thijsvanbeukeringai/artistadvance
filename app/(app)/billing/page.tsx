import { readAccount } from "@/lib/account";
import { supabaseService } from "@/lib/supabase-service";
import { isStripeConfigured } from "@/lib/stripe";
import BillingActions from "@/components/billing/BillingActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  active: { label: "Actief", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  trialing: { label: "Trial", tone: "bg-brand-50 text-brand-700 border-brand-200" },
  past_due: { label: "Te laat", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  unpaid: { label: "Onbetaald", tone: "bg-red-50 text-red-800 border-red-200" },
  canceled: { label: "Geannuleerd", tone: "bg-ink-100 text-ink-700 border-ink-200" },
  incomplete: { label: "Incomplete", tone: "bg-amber-50 text-amber-800 border-amber-200" },
};

export default async function BillingPage() {
  const account = await readAccount();
  const canManage = account.role === "super_admin" || account.role === "agency_admin";
  const orgId = account.organizationId;

  let sub: any = null;
  if (orgId) {
    const svc = supabaseService();
    const { data } = await svc
      .from("organization_subscriptions")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();
    sub = data ?? null;
  }

  const stripeReady = isStripeConfigured();
  const status = sub?.status as string | undefined;
  const tone = status && STATUS_LABELS[status] ? STATUS_LABELS[status] : { label: status ?? "Geen abonnement", tone: "bg-ink-100 text-ink-700 border-ink-200" };

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Abonnement</div>
        <h2 className="text-2xl font-extrabold text-ink-900 mt-1">Billing — {account.label}</h2>
        <p className="text-sm text-ink-500 mt-1">Beheer je abonnement, bekijk facturen en pas je betaalmethode aan via Stripe.</p>
      </header>

      {!canManage && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-4 text-sm">
          Alleen <span className="font-semibold">agency_admin</span> of <span className="font-semibold">super_admin</span> rollen kunnen het abonnement beheren. Vraag een collega met de juiste rol.
        </div>
      )}

      {!stripeReady && (
        <div className="rounded-2xl bg-red-50 border border-red-200 text-red-900 p-4 text-sm">
          Stripe is nog niet geconfigureerd. Voeg <code className="font-mono bg-red-100 px-1 rounded">STRIPE_SECRET_KEY</code>, <code className="font-mono bg-red-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code>, <code className="font-mono bg-red-100 px-1 rounded">STRIPE_PRICE_MONTHLY</code> en <code className="font-mono bg-red-100 px-1 rounded">STRIPE_PRICE_YEARLY</code> toe aan je environment.
        </div>
      )}

      {/* Current status */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Huidige status</h3>
        </header>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500">Status</div>
              <span className={`inline-block mt-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${tone.tone}`}>
                {tone.label}
              </span>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500">Plan-interval</div>
              <div className="font-semibold text-ink-900 mt-1 capitalize">{sub?.interval ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500">Volgende afschrijving</div>
              <div className="font-semibold text-ink-900 mt-1 tabular-nums">
                {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("nl-NL") : "—"}
              </div>
            </div>
          </div>

          {sub?.trial_end && new Date(sub.trial_end).getTime() > Date.now() && (
            <div className="rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-xs text-brand-900">
              Trial loopt tot <span className="font-semibold tabular-nums">{new Date(sub.trial_end).toLocaleDateString("nl-NL")}</span>. Daarna start je gekozen plan automatisch.
            </div>
          )}

          {sub?.cancel_at_period_end && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              Abonnement loopt af op <span className="font-semibold tabular-nums">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("nl-NL") : "einde periode"}</span>. Reactiveer via de Stripe portal.
            </div>
          )}

          {!sub?.stripe_subscription_id && (
            <div className="rounded-lg bg-ink-50 border border-ink-200 px-3 py-2 text-xs text-ink-700">
              Nog geen actief abonnement. Start een trial via <Link href="/landing#pricing" className="font-semibold text-brand-600 underline">pricing</Link>.
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      {canManage && (
        <BillingActions
          hasSubscription={!!sub?.stripe_subscription_id}
          hasCustomer={!!sub?.stripe_customer_id}
          stripeReady={stripeReady}
        />
      )}
    </div>
  );
}
