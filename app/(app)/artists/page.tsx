import Link from "next/link";
import { redirect } from "next/navigation";
import { computeReadiness } from "@/lib/readiness";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

export default async function ArtistsPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);

  // Artist-modus: spring direct naar de artiest's portfolio
  if (account.mode === "artist" && account.artistId) {
    redirect(`/artists/${account.artistId}`);
  }

  const today = new Date("2026-05-09");
  const visibleIds = scopedArtistIds(account, snap.artists);
  const visibleArtists = snap.artists.filter((a) => visibleIds.has(a.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-ink-900">Artists in agency</h2>
          <p className="text-sm text-ink-500 mt-1">{visibleArtists.length} artiesten in {account.label} - klik door voor portfolio.</p>
        </div>
        <Link href="/admin/companies" className="text-sm font-semibold text-brand-600 hover:underline">+ Nieuwe artiest via bedrijf</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleArtists.map((a) => {
          const org = snap.organizations.find((o) => o.id === a.organization_id);
          const aBookings = snap.bookings.filter((b) => b.artist_id === a.id);
          const aAdvancings = snap.advancings.filter((adv) => aBookings.some((b) => b.id === adv.booking_id));
          const readinessList = aAdvancings.map((adv) => computeReadiness(snap, adv.id, today)).filter((r): r is NonNullable<typeof r> => !!r);
          const avgScore = readinessList.length
            ? Math.round(readinessList.reduce((s, x) => s + x.score, 0) / readinessList.length)
            : null;
          const disputed = readinessList.reduce((s, x) => s + x.riders.disputed, 0);
          return (
            <Link
              key={a.id}
              href={`/artists/${a.id}`}
              className="bg-white border border-ink-200 rounded-2xl shadow-card p-5 hover:border-brand-400 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white text-xl font-extrabold flex-shrink-0">
                    {a.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-ink-900 truncate">{a.name}</div>
                    <div className="text-xs text-ink-500 truncate">{org?.name}</div>
                  </div>
                </div>
                {avgScore !== null && (
                  <div className="text-right">
                    <div className="text-[10px] text-ink-400 uppercase tracking-wider font-semibold">Readiness</div>
                    <div className="text-2xl font-extrabold text-ink-900 tabular-nums">{avgScore}</div>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-ink-100 px-3 py-2">
                  <div className="text-ink-400">Bookings</div>
                  <div className="font-bold text-ink-900 tabular-nums">{aBookings.length}</div>
                </div>
                <div className="rounded-lg bg-ink-100 px-3 py-2">
                  <div className="text-ink-400">Advancings</div>
                  <div className="font-bold text-ink-900 tabular-nums">{aAdvancings.length}</div>
                </div>
                <div className={`rounded-lg px-3 py-2 ${disputed > 0 ? "bg-red-50" : "bg-ink-100"}`}>
                  <div className={disputed > 0 ? "text-red-700" : "text-ink-400"}>Disputed</div>
                  <div className={`font-bold tabular-nums ${disputed > 0 ? "text-red-700" : "text-ink-900"}`}>{disputed}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
