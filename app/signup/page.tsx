import SignupForm from "./SignupForm";
import type { PricingTier } from "@/lib/stripe";

export const metadata = { title: "Start 7-dagen trial · ArtistAdvance" };
export const dynamic = "force-dynamic";

const TIER_COPY: Record<PricingTier, { name: string; monthly: number; yearly: number; bullets: string[] }> = {
  starter: {
    name: "Starter",
    monthly: 49,
    yearly: 470,
    bullets: ["1-5 artiesten", "Bookings + advancing", "Festivals CRM", "Email support"],
  },
  agency: {
    name: "Agency",
    monthly: 149,
    yearly: 1430,
    bullets: ["6-25 artiesten", "Role-based teams", "Auto-contracten", "Festival-portal"],
  },
  group: {
    name: "Group",
    monthly: 399,
    yearly: 3830,
    bullets: ["25+ artiesten", "Multi-agency", "Dedicated onboarding", "Custom integraties"],
  },
};

function asTier(v?: string): PricingTier {
  return v === "starter" || v === "group" ? v : "agency";
}
function asInterval(v?: string): "monthly" | "yearly" {
  return v === "monthly" ? "monthly" : "yearly";
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: { tier?: string; interval?: string };
}) {
  const tier = asTier(searchParams.tier);
  const interval = asInterval(searchParams.interval);
  const copy = TIER_COPY[tier];
  const pricePerMonth = interval === "yearly" ? Math.round(copy.yearly / 12) : copy.monthly;
  const billedAs = interval === "yearly"
    ? `€ ${copy.yearly.toLocaleString("nl-NL")} per jaar (factuur na trial)`
    : `€ ${copy.monthly.toLocaleString("nl-NL")} per maand (factuur na trial)`;

  return (
    <div className="min-h-screen bg-ink-100 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-ink-900 text-white grid place-items-center font-extrabold">A</div>
          <span className="font-extrabold tracking-tight text-ink-900 text-lg">ArtistAdvance</span>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* Form */}
          <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-7">
            <h1 className="text-2xl font-extrabold text-ink-900">Start je 7-dagen trial</h1>
            <p className="text-sm text-ink-500 mt-1">
              Vul je gegevens in + creditcard. Eerste 7 dagen gratis — daarna wordt automatisch afgeschreven, opzegbaar via je dashboard.
            </p>

            <SignupForm tier={tier} interval={interval} />

            <p className="text-[11px] text-ink-400 mt-5">
              Door door te gaan ga je akkoord met onze voorwaarden. Je betaalgegevens worden veilig opgeslagen door Stripe — wij zien nooit je kaartgegevens.
            </p>
          </div>

          {/* Plan summary */}
          <aside className="bg-white border border-ink-200 rounded-2xl shadow-card p-6 h-fit">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Jouw plan</div>
            <div className="font-extrabold text-xl text-ink-900 mt-1">{copy.name}</div>
            <div className="text-[11px] text-ink-500 capitalize">{interval === "yearly" ? "Per jaar (-20%)" : "Per maand"}</div>

            <div className="mt-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums text-ink-900">€ {pricePerMonth}</span>
                <span className="text-xs text-ink-500">/maand</span>
              </div>
              <div className="text-[11px] text-ink-400 mt-1">{billedAs}</div>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-ink-700">
              {copy.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-5 border-t border-ink-200 text-[11px] text-ink-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>7 dagen gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Op elk moment opzegbaar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Geen kosten tijdens trial</span>
              </div>
            </div>
          </aside>
        </div>

        <p className="text-center mt-6 text-xs text-ink-500">
          Al een account? <a href="/login" className="font-semibold text-ink-900 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}
