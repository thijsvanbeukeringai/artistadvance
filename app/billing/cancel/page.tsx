import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-canvas-deep text-white grid place-items-center px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-extrabold">Checkout afgebroken</h1>
        <p className="mt-3 text-white/65">Geen abonnement gestart. Probeer het opnieuw of plan een gesprek met de bouwer.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/landing#pricing" className="bg-neon-amber hover:bg-neon-ember text-canvas-deep font-semibold px-5 py-3 rounded-lg shadow-cta-glow transition">
            Terug naar pricing
          </Link>
          <a href="mailto:hello@artistadvance.app" className="text-sm text-white/70 hover:text-white px-5 py-3 rounded-lg border border-white/15 transition">
            Praat met de bouwer
          </a>
        </div>
      </div>
    </main>
  );
}
