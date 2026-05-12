import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-canvas-deep text-white grid place-items-center px-5">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 grid place-items-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Trial gestart</h1>
        <p className="mt-3 text-white/65">
          14 dagen gratis toegang tot alle features. Daarna start je abonnement automatisch. Je kunt op elk moment opzeggen via Settings → Billing.
        </p>
        <Link href="/" className="mt-8 inline-block bg-neon-amber hover:bg-neon-ember text-canvas-deep font-semibold px-5 py-3 rounded-lg shadow-cta-glow transition">
          Open je dashboard →
        </Link>
      </div>
    </main>
  );
}
