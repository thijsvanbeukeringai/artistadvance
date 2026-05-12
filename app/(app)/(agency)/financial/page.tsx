import Link from "next/link";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

const TODAY_STR = "2026-05-09";

export default async function FinancialPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const artistIds = scopedArtistIds(account, snap.artists);
  const bookings = snap.bookings.filter((b) => artistIds.has(b.artist_id));
  const confirmed = bookings.filter((b) => b.status !== "draft");

  const totalFeeGross = confirmed.reduce((s, b) => s + (b.fee ?? 0), 0);
  const totalCommission = confirmed.reduce((s, b) => s + (b.fee ?? 0) * ((b.commission_pct ?? 0) / 100), 0);
  const totalWithholding = confirmed.reduce((s, b) => s + (b.fee ?? 0) * ((b.withholding_tax_pct ?? 0) / 100), 0);
  const totalArtistNet = totalFeeGross - totalCommission - totalWithholding;

  const bookingIds = new Set(bookings.map((b) => b.id));
  const milestones = snap.bookingPaymentMilestones.filter((m) => bookingIds.has(m.booking_id));
  const paid = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + (m.amount ?? 0), 0);
  const invoiced = milestones.filter((m) => m.status === "invoiced").reduce((s, m) => s + (m.amount ?? 0), 0);
  const pending = milestones.filter((m) => m.status === "pending").reduce((s, m) => s + (m.amount ?? 0), 0);
  const overdue = milestones.filter((m) => m.status !== "paid" && m.due_date && m.due_date < TODAY_STR).reduce((s, m) => s + (m.amount ?? 0), 0);
  const outstanding = invoiced + pending;

  // Per-artist
  const perArtist = [...artistIds].map((artistId) => {
    const artist = snap.artists.find((a) => a.id === artistId);
    if (!artist) return null;
    const aBookings = confirmed.filter((b) => b.artist_id === artistId);
    const gross = aBookings.reduce((s, b) => s + (b.fee ?? 0), 0);
    const commission = aBookings.reduce((s, b) => s + (b.fee ?? 0) * ((b.commission_pct ?? 0) / 100), 0);
    const showCount = aBookings.length;
    return { artist, gross, commission, showCount };
  }).filter((x): x is NonNullable<typeof x> => !!x).sort((a, b) => b.gross - a.gross);

  // Per-buyer / festival
  const perFestival = new Map<string, { festivalName: string; bookingsCount: number; gross: number }>();
  for (const b of confirmed) {
    const f = snap.festivals.find((x) => x.id === b.festival_id);
    if (!f) continue;
    const prev = perFestival.get(f.id) ?? { festivalName: f.name, bookingsCount: 0, gross: 0 };
    prev.bookingsCount += 1;
    prev.gross += b.fee ?? 0;
    perFestival.set(f.id, prev);
  }
  const buyersList = [...perFestival.values()].sort((a, b) => b.gross - a.gross).slice(0, 10);

  // Outstanding rows
  const outstandingRows = milestones
    .filter((m) => m.status !== "paid")
    .sort((a, b) => (a.due_date ?? "9999") < (b.due_date ?? "9999") ? -1 : 1)
    .map((m) => {
      const booking = snap.bookings.find((b) => b.id === m.booking_id);
      const artist = booking ? snap.artists.find((a) => a.id === booking.artist_id) : null;
      const festival = booking ? snap.festivals.find((f) => f.id === booking.festival_id) : null;
      return { milestone: m, booking, artist, festival };
    });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Financieel</div>
        <h2 className="text-2xl font-extrabold text-ink-900 mt-1">Dashboard — {account.label}</h2>
        <p className="text-sm text-ink-500 mt-1">
          Overzicht van bevestigde deals, commissies en cashflow. Cijfers zijn EUR-gebaseerd en exclusief BTW.
        </p>
      </header>

      {/* Top KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Gross bookings" value={totalFeeGross} tone="ink" sub={`${confirmed.length} bevestigde deals`} />
        <Kpi label="Agency commissie" value={totalCommission} tone="brand" sub="totaal verdiend" />
        <Kpi label="Artist net" value={totalArtistNet} tone="ink" sub="na commissie & withholding" />
        <Kpi label="Withholding tax" value={totalWithholding} tone="ink" sub="ingehouden" />
      </section>

      {/* Cashflow */}
      <section>
        <h3 className="font-bold text-ink-900 mb-3">Cashflow status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Betaald" value={paid} tone="emerald" sub="binnen op rekening" />
          <Kpi label="Verstuurd / pending" value={outstanding} tone="amber" sub="open invoices" />
          <Kpi label="Te laat" value={overdue} tone="red" sub="actie nodig" />
          <Kpi label="Te factureren" value={pending} tone="ink" sub="nog niet verstuurd" />
        </div>
      </section>

      {/* Outstanding list */}
      {outstandingRows.length > 0 && (
        <section>
          <h3 className="font-bold text-ink-900 mb-3">Open betalingen — top {outstandingRows.length}</h3>
          <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-ink-400 text-[10px] uppercase tracking-wider bg-ink-50">
                  <th className="px-5 py-2 font-semibold">Due</th>
                  <th className="px-5 py-2 font-semibold">Status</th>
                  <th className="px-5 py-2 font-semibold">Artist · Festival</th>
                  <th className="px-5 py-2 font-semibold">Milestone</th>
                  <th className="px-5 py-2 font-semibold text-right">Bedrag</th>
                  <th className="px-5 py-2 font-semibold text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {outstandingRows.map(({ milestone, booking, artist, festival }) => {
                  if (!booking || !artist || !festival) return null;
                  const isOverdue = milestone.due_date && milestone.due_date < TODAY_STR;
                  return (
                    <tr key={milestone.id} className="hover:bg-ink-50">
                      <td className="px-5 py-3 tabular-nums text-sm">
                        <span className={isOverdue ? "text-red-700 font-bold" : "text-ink-700"}>
                          {milestone.due_date ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isOverdue ? "bg-red-100 text-red-800" :
                          milestone.status === "invoiced" ? "bg-amber-100 text-amber-800" : "bg-ink-100 text-ink-700"
                        }`}>
                          {isOverdue ? "Te laat" : milestone.status === "invoiced" ? "Verstuurd" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink-900">{artist.name}</div>
                        <div className="text-[11px] text-ink-500">{festival.name} · {booking.show_date}</div>
                      </td>
                      <td className="px-5 py-3 text-ink-700">{milestone.label}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-ink-900">
                        {milestone.amount != null ? `€ ${milestone.amount.toLocaleString("nl-NL")}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/bookings/${booking.id}`} className="text-xs font-semibold text-brand-600 hover:underline">
                          Open booking →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Per artist */}
      <section>
        <h3 className="font-bold text-ink-900 mb-3">Per artiest</h3>
        {perArtist.length === 0 ? (
          <div className="text-sm text-ink-500 italic">Nog geen bevestigde deals.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {perArtist.map(({ artist, gross, commission, showCount }) => (
              <Link key={artist.id} href={`/artists/${artist.id}`} className="bg-white border border-ink-200 rounded-2xl shadow-card p-4 hover:border-brand-400 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white font-extrabold">
                    {artist.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-ink-900 truncate">{artist.name}</div>
                    <div className="text-[11px] text-ink-400">{showCount} bevestigde show{showCount === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="bg-ink-50 rounded-lg p-2">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Gross</div>
                    <div className="font-extrabold text-ink-900 tabular-nums">€ {gross.toLocaleString("nl-NL")}</div>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-2">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700">Commissie</div>
                    <div className="font-extrabold text-brand-700 tabular-nums">€ {commission.toLocaleString("nl-NL")}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top buyers */}
      {buyersList.length > 0 && (
        <section>
          <h3 className="font-bold text-ink-900 mb-3">Top festivals / buyers</h3>
          <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-ink-400 text-[10px] uppercase tracking-wider bg-ink-50">
                  <th className="px-5 py-2 font-semibold">Festival</th>
                  <th className="px-5 py-2 font-semibold text-right">Bookings</th>
                  <th className="px-5 py-2 font-semibold text-right">Gross</th>
                  <th className="px-5 py-2 font-semibold text-right">Gem. fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {buyersList.map((b, i) => (
                  <tr key={i} className="hover:bg-ink-50">
                    <td className="px-5 py-3 font-semibold text-ink-900">{b.festivalName}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{b.bookingsCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">€ {b.gross.toLocaleString("nl-NL")}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-500">€ {Math.round(b.gross / b.bookingsCount).toLocaleString("nl-NL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, tone, sub }: { label: string; value: number; tone: "ink" | "brand" | "emerald" | "amber" | "red"; sub: string }) {
  const toneCls: Record<typeof tone, string> = {
    ink: "bg-white border-ink-200 text-ink-900",
    brand: "bg-brand-50 border-brand-200 text-brand-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneCls[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums mt-1">€ {value.toLocaleString("nl-NL")}</div>
      <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}
