import Link from "next/link";
import StatusPill, { statusTone } from "@/components/StatusPill";
import ConfirmBookingButton from "@/components/booking/ConfirmBookingButton";
import DeleteBookingButton from "@/components/booking/DeleteBookingButton";
import ArtistFilter from "@/components/filters/ArtistFilter";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";
import LiveSync from "@/components/realtime/LiveSync";

export const dynamic = "force-dynamic";

function agencyBookingLabel(status: string): string {
  switch (status) {
    case "draft": return "Draft";
    case "confirmed": return "Bevestigd";
    case "advancing": return "Bevestigd";
    case "completed": return "Afgerond";
    case "cancelled": return "Geannuleerd";
    default: return status;
  }
}

export default async function BookingsPage({ searchParams }: { searchParams: { artist?: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const visibleIds = scopedArtistIds(account, snap.artists);
  const filterArtist = searchParams.artist ?? "";
  const effectiveIds = filterArtist && visibleIds.has(filterArtist) ? new Set([filterArtist]) : visibleIds;
  const artistList = snap.artists
    .filter((a) => visibleIds.has(a.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ id: a.id, name: a.name }));
  const rows = snap.bookings
    .filter((b) => effectiveIds.has(b.artist_id))
    .sort((a, b) => (a.show_date < b.show_date ? -1 : 1))
    .map((b) => {
      const artist = snap.artists.find((a) => a.id === b.artist_id)!;
      const festival = snap.festivals.find((f) => f.id === b.festival_id)!;
      const stage = snap.stages.find((s) => s.id === b.stage_id)!;
      return { booking: b, artist, festival, stage };
    });

  const liveArtistIds = Array.from(visibleIds).slice(0, 50);

  return (
    <div className="space-y-6">
      {liveArtistIds.length > 0 && <LiveSync scope={{ mode: "artist", ids: liveArtistIds }} debounce={500} />}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-ink-900">
            {account.mode === "artist" ? `Shows van ${account.label}` : `Boekingen · ${account.label}`}
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {rows.length} totaal · {rows.filter((r) => r.booking.status === "draft").length} draft{rows.filter((r) => r.booking.status === "draft").length === 1 ? "" : "s"} · {rows.filter((r) => r.booking.status !== "draft").length} bevestigd
          </p>
        </div>
        {account.mode === "agency" && artistList.length > 1 && (
          <ArtistFilter artists={artistList} />
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map(({ booking, artist, festival, stage }) => (
          <Link
            key={booking.id}
            href={`/bookings/${booking.id}`}
            className="block bg-white border border-ink-200 rounded-xl p-3 active:bg-ink-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white font-bold flex-shrink-0">
                {artist.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink-900 truncate">{artist.name}</span>
                  <StatusPill tone={statusTone(booking.status)}>{agencyBookingLabel(booking.status)}</StatusPill>
                </div>
                <div className="text-[12px] text-ink-500 truncate">{festival.name} · {stage.name}</div>
                <div className="text-[11px] text-ink-400 tabular-nums mt-0.5">
                  {booking.show_date}{booking.show_time ? ` · ${booking.show_time}` : ""}
                  {booking.fee ? ` · € ${booking.fee.toLocaleString("nl-NL")}` : ""}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-ink-200 rounded-2xl shadow-card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50">
              <th className="px-5 py-3 font-semibold">Artiest</th>
              <th className="px-5 py-3 font-semibold">Festival · Stage</th>
              <th className="px-5 py-3 font-semibold">Showdate</th>
              <th className="px-5 py-3 font-semibold">Fee</th>
              <th className="px-5 py-3 font-semibold">Contract</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Laatste activiteit</th>
              <th className="px-5 py-3 font-semibold text-right">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {rows.map(({ booking, artist, festival, stage }) => (
              <tr key={booking.id} className="hover:bg-ink-50 transition-colors">
                <td className="px-5 py-4">
                  <Link href={`/bookings/${booking.id}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white font-bold">
                      {artist.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink-900 group-hover:text-brand-700">{artist.name}</div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">
                        {SHOW_TYPE_LABELS[booking.show_type]}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink-900">{festival.name}</div>
                  <div className="text-xs text-ink-400">{stage.name} · {festival.location}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-ink-900 font-medium tabular-nums">{booking.show_date}</div>
                  <div className="text-xs text-ink-400 tabular-nums">{booking.show_time ?? "—"}</div>
                </td>
                <td className="px-5 py-4 text-xs tabular-nums">
                  {booking.fee ? <span className="text-ink-900 font-semibold">€ {booking.fee.toLocaleString("nl-NL")}</span> : <span className="text-ink-400">—</span>}
                </td>
                <td className="px-5 py-4 text-[11px]">
                  {booking.contract_status
                    ? <span className="font-semibold text-ink-700 capitalize">{booking.contract_status}</span>
                    : <span className="text-ink-400">—</span>}
                </td>
                <td className="px-5 py-4">
                  <StatusPill tone={statusTone(booking.status)}>{agencyBookingLabel(booking.status)}</StatusPill>
                </td>
                <td className="px-5 py-4">
                  <ActivityChip lastActivityAt={booking.last_activity_at} isDraft={booking.status === "draft"} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    {booking.status === "draft" ? (
                      <>
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          Open
                        </Link>
                        <ConfirmBookingButton bookingId={booking.id} label="Bevestig" />
                        <DeleteBookingButton bookingId={booking.id} artistId={artist.id} />
                      </>
                    ) : (
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Open →
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityChip({ lastActivityAt, isDraft }: { lastActivityAt?: string; isDraft: boolean }) {
  if (!lastActivityAt) return <span className="text-[11px] text-ink-300">—</span>;
  const diffMs = Date.now() - new Date(lastActivityAt).getTime();
  const days = Math.floor(diffMs / 86400000);
  const stale = isDraft && days > 14;
  let label: string;
  if (days === 0) label = "vandaag";
  else if (days === 1) label = "gister";
  else if (days < 7) label = `${days}d geleden`;
  else if (days < 30) label = `${Math.floor(days / 7)}w geleden`;
  else label = `${Math.floor(days / 30)}mnd geleden`;
  return (
    <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded ${
      stale ? "bg-red-100 text-red-800 font-bold" :
      days > 30 ? "bg-amber-50 text-amber-800" :
      "text-ink-500"
    }`}>
      {stale && "⚠ "}{label}
    </span>
  );
}
