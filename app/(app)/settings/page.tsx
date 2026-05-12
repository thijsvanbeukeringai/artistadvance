import { supabase, supabaseStatus } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function fetchCounts() {
  const client = supabase();
  if (!client) return null;
  const tables = [
    "organizations", "artists", "festivals", "stages", "bookings",
    "advancings", "advancing_tech_items", "signed_riders",
    "hotel_proposals", "festival_documents", "advancing_activity",
  ];
  const results: Record<string, number | string> = {};
  for (const t of tables) {
    const { count, error } = await client.from(t).select("*", { count: "exact", head: true });
    results[t] = error ? `err: ${error.message}` : (count ?? 0);
  }
  return results;
}

export default async function SettingsPage() {
  const status = supabaseStatus();
  const counts = status.configured ? await fetchCounts() : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900">Settings</h2>
        <p className="text-sm text-ink-500 mt-1">Organisatie- en integratie-instellingen.</p>
      </div>

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-ink-900">Supabase integratie</h3>
            <p className="text-sm text-ink-500 mt-1">Database voor productie-data. Replaces in-memory store wanneer pagina migraties gemigreerd zijn.</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
            status.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.configured ? "bg-emerald-500" : "bg-amber-500"}`} />
            {status.configured ? "Verbonden" : "Niet geconfigureerd"}
          </span>
        </div>
        {status.configured && (
          <div className="mt-3 space-y-1 text-xs text-ink-500">
            <div>Project ID: <span className="font-mono text-ink-900">{status.project_id}</span></div>
            <div>URL: <span className="font-mono text-ink-900">{status.url}</span></div>
            <div>Tier: <span className="font-semibold text-ink-900">Micro ($10/maand)</span></div>
            <div>Regio: <span className="font-semibold text-ink-900">eu-central-1 (Frankfurt)</span></div>
          </div>
        )}
        {!status.configured && (
          <p className="mt-3 text-xs text-amber-700">
            Zet <code className="font-mono bg-ink-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> en <code className="font-mono bg-ink-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in `.env.local` en herstart de dev-server.
          </p>
        )}
      </section>

      {counts && (
        <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <header className="px-5 py-4 border-b border-ink-200">
            <h3 className="font-bold text-ink-900">Database snapshot</h3>
            <p className="text-xs text-ink-500 mt-0.5">Live row-counts uit Postgres. Demo data is geseed via migratie 007.</p>
          </header>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink-200">
              {Object.entries(counts).map(([table, count]) => (
                <tr key={table}>
                  <td className="px-5 py-2 font-mono text-xs text-ink-700">{table}</td>
                  <td className="px-5 py-2 text-right font-bold tabular-nums text-ink-900">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-ink-900">Dropbox integratie</h3>
        <p className="text-sm text-ink-500 mt-1">Koppel Dropbox per organisatie zodat templates en festival-documenten auto-syncen.</p>
        <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition">Connect Dropbox</button>
      </section>

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-ink-900">Anthropic Claude API</h3>
        <p className="text-sm text-ink-500 mt-1">Voor rider-PDF parsing op `/artists/[id]/templates`. Zet <code className="font-mono bg-ink-100 px-1 rounded">ANTHROPIC_API_KEY</code> in `.env.local`.</p>
      </section>
    </div>
  );
}
