import Link from "next/link";
import { redirect } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { computeReadiness } from "@/lib/readiness";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import { readAccount, scopedArtistIds, canAccessAdvancing } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";
import AdvancingsFilters from "@/components/advancing/AdvancingsFilters";

const MONTHS_NL = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function urgencyBadge(days: number) {
  if (days < 0) return { label: "past", cls: "bg-ink-100 text-ink-400" };
  if (days <= 7) return { label: `${days}d`, cls: "bg-red-100 text-red-800 font-bold" };
  if (days <= 30) return { label: `${days}d`, cls: "bg-amber-100 text-amber-800 font-semibold" };
  return { label: `${days}d`, cls: "bg-ink-100 text-ink-700" };
}

function readinessColor(score: number) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-400";
  if (score >= 30) return "bg-orange-400";
  return "bg-red-500";
}

export default async function AdvancingsPage({ searchParams }: { searchParams: { artist?: string; festival?: string; month?: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  if (!canAccessAdvancing(account.role)) redirect("/");
  const visibleIds = scopedArtistIds(account, snap.artists);
  const today = new Date("2026-05-09");

  const allRows = snap.advancings
    .flatMap((adv) => {
      const booking = snap.bookings.find((b) => b.id === adv.booking_id);
      if (!booking || !visibleIds.has(booking.artist_id)) return [];
      const artist = snap.artists.find((a) => a.id === booking.artist_id);
      const festival = snap.festivals.find((f) => f.id === booking.festival_id);
      const stage = snap.stages.find((s) => s.id === booking.stage_id);
      if (!artist || !festival || !stage) return [];
      const readiness = computeReadiness(snap, adv.id, today);
      if (!readiness) return [];
      const showDate = new Date(`${booking.show_date}T00:00:00`);
      const daysUntil = Math.ceil((showDate.getTime() - today.getTime()) / 86400000);
      const monthKey = booking.show_date.slice(0, 7); // YYYY-MM
      return [{ adv, booking, artist, festival, stage, readiness, daysUntil, monthKey }];
    });

  // Filter-opties (uit alle visible rows, vóór filtering)
  const artistOpts = Array.from(new Map(allRows.map((r) => [r.artist.id, r.artist.name])).entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const festivalOpts = Array.from(new Map(allRows.map((r) => [r.festival.id, r.festival.name])).entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const monthOpts = Array.from(new Set(allRows.map((r) => r.monthKey)))
    .sort()
    .map((m) => {
      const [y, mm] = m.split("-");
      return { id: m, name: `${MONTHS_NL[parseInt(mm, 10) - 1]} ${y}` };
    });

  // Apply filters
  const artistFilter = searchParams.artist ?? "";
  const festivalFilter = searchParams.festival ?? "";
  const monthFilter = searchParams.month ?? "";

  const rows = allRows
    .filter((r) => !artistFilter || r.artist.id === artistFilter)
    .filter((r) => !festivalFilter || r.festival.id === festivalFilter)
    .filter((r) => !monthFilter || r.monthKey === monthFilter)
    .sort((a, b) => b.readiness.attentionScore - a.readiness.attentionScore);

  const showArtistFilter = artistOpts.length > 1;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Advancings"
        title="Alle lopende voorbereidingen"
        description={`${rows.length}${rows.length !== allRows.length ? ` van ${allRows.length}` : ""} advancings — gesorteerd op urgency × openheid. Filter per artiest, festival of maand.`}
      />

      <AdvancingsFilters
        artists={showArtistFilter ? artistOpts : []}
        festivals={festivalOpts}
        months={monthOpts}
        selected={{ artist: artistFilter, festival: festivalFilter, month: monthFilter }}
      />

      {rows.length === 0 ? (
        <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center text-sm text-ink-500">
          Geen advancings die aan de filters voldoen.
        </div>
      ) : (
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50 border-b border-ink-200">
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Artiest</th>
                  <th className="px-4 py-3 font-semibold">Festival · Stage</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Readiness</th>
                  <th className="px-4 py-3 font-semibold">Bottleneck</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {rows.map(({ adv, booking, artist, festival, stage, readiness, daysUntil }) => {
                  const urgency = urgencyBadge(daysUntil);
                  return (
                    <tr key={adv.id} className="hover:bg-ink-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-900 tabular-nums whitespace-nowrap">{booking.show_date}</span>
                          <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${urgency.cls}`}>{urgency.label}</span>
                        </div>
                        <div className="text-xs text-ink-400 tabular-nums">{booking.show_time?.slice(0, 5) ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-900">{artist.name}</td>
                      <td className="px-4 py-3">
                        <div className="text-ink-900">{festival.name}</div>
                        <div className="text-xs text-ink-400">{stage.name}{festival.location ? ` · ${festival.location}` : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
                          {SHOW_TYPE_LABELS[booking.show_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                            <div className={`h-full ${readinessColor(readiness.score)}`} style={{ width: `${readiness.score}%` }} />
                          </div>
                          <span className="text-xs font-bold text-ink-900 tabular-nums w-9 text-right">{readiness.score}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600 max-w-[240px]">
                        {readiness.bottleneck.kind === "none" ? (
                          <span className="text-emerald-700">✓ klaar voor show</span>
                        ) : (
                          <span className={readiness.bottleneck.tone === "bad" ? "text-red-700" : "text-amber-700"}>
                            {readiness.bottleneck.reason}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={statusTone(adv.status)}>{humanStatus(adv.status)}</StatusPill>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/advancings/${adv.id}`}
                          className="text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
