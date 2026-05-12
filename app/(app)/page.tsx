import Link from "next/link";
import ShowTile from "@/components/dashboard/ShowTile";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { computeReadiness } from "@/lib/readiness";
import { readAccount, canAccessAdvancing, type AccountRole } from "@/lib/account";
import { loadSnapshot, type Snapshot } from "@/lib/snapshot";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import AgencyCalendar from "@/components/calendar/AgencyCalendar";
import { buildCalendarEvents } from "@/lib/calendarEvents";
import { detectBookingConflicts } from "@/lib/bookingConflicts";
import AgencyBookingPanel from "@/components/booking/AgencyBookingPanel";
import ConfirmBookingButton from "@/components/booking/ConfirmBookingButton";
import DeleteBookingButton from "@/components/booking/DeleteBookingButton";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import ArtistFilter from "@/components/filters/ArtistFilter";

const TODAY = new Date("2026-05-09");
const TODAY_STR = "2026-05-09";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { artist?: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);

  const allScoped = new Set<string>(
    account.mode === "artist"
      ? account.artistId ? [account.artistId] : []
      : snap.artists.filter((a) => a.organization_id === account.organizationId).map((a) => a.id)
  );

  if (account.mode === "agency") {
    const filterArtist = searchParams.artist ?? "";
    const effective = filterArtist && allScoped.has(filterArtist) ? new Set([filterArtist]) : allScoped;
    return <AgencyDashboard snap={snap} scopedArtistIds={effective} allScopedIds={allScoped} accountLabel={account.label} role={account.role} />;
  }

  return <ArtistDashboard snap={snap} artistId={account.artistId!} accountLabel={account.label} role={account.role} />;
}

function daysBetween(target: string): number {
  return Math.ceil((new Date(target + "T00:00:00").getTime() - TODAY.getTime()) / 86400000);
}

function urgencyChip(days: number) {
  if (days < 0) return { label: "past", cls: "bg-ink-100 text-ink-400" };
  if (days <= 7) return { label: `${days}d`, cls: "bg-red-100 text-red-800 font-bold" };
  if (days <= 30) return { label: `${days}d`, cls: "bg-amber-100 text-amber-800 font-semibold" };
  if (days <= 90) return { label: `${days}d`, cls: "bg-ink-100 text-ink-700" };
  return { label: `${days}d`, cls: "bg-ink-50 text-ink-500" };
}

function AgencyDashboard({ snap, scopedArtistIds, allScopedIds, accountLabel, role }: { snap: Snapshot; scopedArtistIds: Set<string>; allScopedIds: Set<string>; accountLabel: string; role: AccountRole }) {
  const advancingAccess = canAccessAdvancing(role);
  const artists = snap.artists.filter((a) => scopedArtistIds.has(a.id));
  const allArtists = snap.artists
    .filter((a) => allScopedIds.has(a.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ id: a.id, name: a.name }));
  const allBookings = snap.bookings.filter((b) => scopedArtistIds.has(b.artist_id));
  const upcoming = allBookings.filter((b) => b.show_date >= TODAY_STR);
  const drafts = upcoming.filter((b) => b.status === "draft").sort((a, b) => (a.show_date < b.show_date ? -1 : 1));
  const confirmedActive = upcoming.filter((b) => b.status !== "draft");
  const next30 = upcoming.filter((b) => daysBetween(b.show_date) <= 30);
  const contractsPending = upcoming.filter((b) => !b.contract_status || b.contract_status === "pending" || b.contract_status === "sent").length;
  const staleDrafts = drafts.filter((b) => b.last_activity_at && (Date.now() - new Date(b.last_activity_at).getTime()) > 14 * 86400000).length;
  const conflictedBookings = upcoming.filter((b) => detectBookingConflicts(b, snap.bookings).length > 0);
  const calendarEvents = buildCalendarEvents(snap, scopedArtistIds);
  const artistOptions = artists.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      {/* Top header */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-ink-900 text-white">Bookings agency</span>
            <h2 className="text-2xl font-extrabold text-ink-900 mt-2">{accountLabel}</h2>
            <p className="text-sm text-ink-500 mt-1">
              {artists.length} artiest{artists.length === 1 ? "" : "en"} {scopedArtistIds.size < allScopedIds.size ? "(gefilterd)" : ""} · {upcoming.length} aankomende deal{upcoming.length === 1 ? "" : "s"}
            </p>
          </div>
          {allArtists.length > 1 && <ArtistFilter artists={allArtists} />}
        </div>

        {/* At-a-glance: bookings KPIs */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`rounded-xl p-3 border ${drafts.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-ink-200"}`}>
            <div className={`text-[10px] uppercase tracking-wider font-bold ${drafts.length > 0 ? "text-amber-800" : "text-ink-400"}`}>Drafts te confirmen</div>
            <div className={`text-2xl font-extrabold tabular-nums mt-1 ${drafts.length > 0 ? "text-amber-800" : "text-ink-900"}`}>{drafts.length}</div>
            <div className={`text-[10px] mt-0.5 ${drafts.length > 0 ? "text-amber-700" : "text-ink-400"}`}>
              {staleDrafts > 0 ? <span className="text-red-700 font-bold">{staleDrafts} stale (&gt;14 dgn)</span> : "actie nodig"}
            </div>
          </div>
          <div className="rounded-xl p-3 border bg-white border-ink-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Advancing actief</div>
            <div className="text-2xl font-extrabold text-ink-900 tabular-nums mt-1">{confirmedActive.length}</div>
            <div className="text-[10px] text-ink-400 mt-0.5">overhandigd aan productie</div>
          </div>
          <div className="rounded-xl p-3 border bg-white border-ink-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Komende 30 dagen</div>
            <div className="text-2xl font-extrabold text-ink-900 tabular-nums mt-1">{next30.length}</div>
            <div className="text-[10px] text-ink-400 mt-0.5">shows op de roll</div>
          </div>
          <div className="rounded-xl p-3 border bg-white border-ink-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Open contracten</div>
            <div className="text-2xl font-extrabold text-ink-900 tabular-nums mt-1">{contractsPending}</div>
            <div className="text-[10px] text-ink-400 mt-0.5">pending / sent</div>
          </div>
        </div>
      </section>

      {/* Conflicts banner */}
      {conflictedBookings.length > 0 && (
        <section className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="text-red-700 flex-shrink-0 mt-0.5">
              <path d="M12 9v4 M12 17h.01 M10.29 3.86l-8.18 14.18A2 2 0 003.83 21h16.34a2 2 0 001.72-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-900 text-sm">{conflictedBookings.length} boeking{conflictedBookings.length === 1 ? "" : "en"} met conflict</h3>
              <ul className="mt-2 space-y-1 text-xs text-red-800">
                {conflictedBookings.slice(0, 5).map((b) => {
                  const a = snap.artists.find((x) => x.id === b.artist_id);
                  const f = snap.festivals.find((x) => x.id === b.festival_id);
                  const conflicts = detectBookingConflicts(b, snap.bookings);
                  return (
                    <li key={b.id} className="flex items-center gap-2 flex-wrap">
                      <Link href={`/bookings/${b.id}`} className="font-semibold underline">
                        {a?.name ?? "Artiest"} · {f?.name ?? "Festival"} · {b.show_date}
                      </Link>
                      <span className="text-[11px]">— {conflicts[0].message}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Action needed: drafts */}
      {drafts.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h3 className="font-bold text-amber-900">Drafts wachten op confirm</h3>
              <p className="text-[11px] text-amber-800 mt-0.5">Zodra je bevestigt start automatisch de advancing met crew, riders en defaults voor die artiest.</p>
            </div>
            <span className="text-[11px] text-amber-700 tabular-nums">{drafts.length} draft{drafts.length === 1 ? "" : "s"}</span>
          </div>
          <div className="bg-white border border-amber-200 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <tbody className="divide-y divide-amber-100">
                {drafts.map((b) => {
                  const artist = snap.artists.find((a) => a.id === b.artist_id)!;
                  const festival = snap.festivals.find((f) => f.id === b.festival_id)!;
                  const stage = snap.stages.find((s) => s.id === b.stage_id)!;
                  const days = daysBetween(b.show_date);
                  const chip = urgencyChip(days);
                  return (
                    <tr key={b.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-3 w-16">
                        <span className={`text-[11px] px-2 py-0.5 rounded tabular-nums ${chip.cls}`}>{chip.label}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-900 font-medium whitespace-nowrap">{b.show_date}</td>
                      <td className="px-4 py-3">
                        <Link href={`/bookings/${b.id}`} className="block group">
                          <div className="font-semibold text-ink-900 group-hover:text-brand-700">{artist.name}</div>
                          <div className="text-[11px] text-ink-500">{festival.name} · {stage.name}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
                          {SHOW_TYPE_LABELS[b.show_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums">
                        {b.fee ? <span className="text-ink-900 font-semibold">€ {b.fee.toLocaleString("nl-NL")}</span> : <span className="text-ink-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        {b.contract_status
                          ? <span className="font-semibold text-ink-700 capitalize">{b.contract_status}</span>
                          : <span className="text-ink-400">geen contract</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/bookings/${b.id}`}
                            className="text-xs font-semibold text-brand-600 hover:underline"
                          >
                            Open
                          </Link>
                          <ConfirmBookingButton bookingId={b.id} label="Bevestig" />
                          <DeleteBookingButton bookingId={b.id} artistId={artist.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Calendar — all scoped artists */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-ink-900">Kalender</h3>
            <p className="text-[11px] text-ink-500 mt-0.5">Alle shows, vluchten en hotels van alle artiesten in {accountLabel}.</p>
          </div>
        </div>
        <AgencyCalendar
          events={calendarEvents}
          emptyHint={`Nog geen events voor ${accountLabel}. Klik op een dag om een boeking toe te voegen.`}
          artists={artistOptions}
          festivals={snap.festivals}
          stages={snap.stages}
          festivalContacts={snap.festivalCrmContacts}
        />
      </section>

      {/* Quick booking creator */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <AgencyBookingPanel
          artists={artistOptions}
          festivals={snap.festivals}
          stages={snap.stages}
          festivalContacts={snap.festivalCrmContacts}
        />
      </section>

      {/* Per-artist bookings */}
      <section>
        <h3 className="font-bold text-ink-900 mb-3">Bevestigde shows per artiest</h3>
        {artists.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-10 text-center text-sm text-ink-500">
            Geen artiesten in dit bedrijf. Voeg er één toe via super-admin → bedrijf detail.
          </div>
        ) : (
          <div className="space-y-4">
            {artists.map((artist) => (
              <ArtistBookingsBlock key={artist.id} artist={artist} snap={snap} advancingAccess={advancingAccess} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ArtistBookingsBlock({ artist, snap, advancingAccess }: { artist: { id: string; name: string }; snap: Snapshot; advancingAccess: boolean }) {
  const bookings = snap.bookings
    .filter((b) => b.artist_id === artist.id)
    .sort((a, b) => (a.show_date < b.show_date ? -1 : 1));
  const upcoming = bookings.filter((b) => b.show_date >= TODAY_STR && b.status !== "draft");
  const past = bookings.filter((b) => b.show_date < TODAY_STR);
  const totalFee = upcoming.reduce((s, b) => s + (b.fee ?? 0), 0);

  return (
    <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-ink-200 bg-ink-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white font-extrabold flex-shrink-0">
            {artist.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-ink-900 truncate">{artist.name}</div>
            <div className="text-[11px] text-ink-400">
              {upcoming.length} bevestigd · {past.length} historisch
              {totalFee > 0 ? ` · € ${totalFee.toLocaleString("nl-NL")} totaal` : ""}
            </div>
          </div>
        </div>
        <Link
          href={`/artists/${artist.id}`}
          className="text-xs font-semibold text-brand-600 hover:underline flex-shrink-0"
        >
          Open artist-page →
        </Link>
      </header>

      {upcoming.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-ink-500">
          Geen bevestigde boekingen. Drafts staan bovenaan in de "Acties nodig" sectie.
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-[10px] uppercase tracking-wider bg-white">
              <th className="px-5 py-2 font-semibold">T-min</th>
              <th className="px-5 py-2 font-semibold">Datum</th>
              <th className="px-5 py-2 font-semibold">Festival · Stage</th>
              <th className="px-5 py-2 font-semibold">Type</th>
              <th className="px-5 py-2 font-semibold">Fee</th>
              <th className="px-5 py-2 font-semibold">Contract</th>
              <th className="px-5 py-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {upcoming.map((booking) => {
              const festival = snap.festivals.find((f) => f.id === booking.festival_id)!;
              const stage = snap.stages.find((s) => s.id === booking.stage_id)!;
              const days = daysBetween(booking.show_date);
              const chip = urgencyChip(days);
              return (
                <tr key={booking.id} className="hover:bg-ink-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded tabular-nums ${chip.cls}`}>{chip.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink-900 tabular-nums whitespace-nowrap">{booking.show_date}</div>
                    <div className="text-[11px] text-ink-400 tabular-nums">{booking.show_time ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/bookings/${booking.id}`} className="block group">
                      <div className="text-ink-900 group-hover:text-brand-700">{festival.name}</div>
                      <div className="text-[11px] text-ink-400">{stage.name}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
                      {SHOW_TYPE_LABELS[booking.show_type]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs tabular-nums">
                    {booking.fee ? <span className="text-ink-900 font-semibold">€ {booking.fee.toLocaleString("nl-NL")}</span> : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-[11px]">
                    {booking.contract_status
                      ? <span className="font-semibold text-ink-700 capitalize">{booking.contract_status}</span>
                      : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/bookings/${booking.id}`} className="inline-flex items-center gap-1.5 text-[11px] text-brand-600 font-semibold hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

function ArtistDashboard({ snap, artistId, accountLabel, role }: { snap: Snapshot; artistId: string; accountLabel: string; role: AccountRole }) {
  const advancingAccess = canAccessAdvancing(role);
  const artistBookings = snap.bookings
    .filter((b) => b.artist_id === artistId)
    .filter((b) => b.show_date >= TODAY_STR)
    .sort((a, b) => (a.show_date < b.show_date ? -1 : 1));

  const tiles = artistBookings.map((b) => {
    const festival = snap.festivals.find((f) => f.id === b.festival_id)!;
    const stage = snap.stages.find((s) => s.id === b.stage_id)!;
    const advancing = snap.advancings.find((adv) => adv.booking_id === b.id);
    const readiness = advancing ? computeReadiness(snap, advancing.id, TODAY) : null;
    return { booking: b, festival, stage, advancing, readiness };
  });

  const calendarEvents = buildCalendarEvents(snap, new Set([artistId]));

  return (
    <div className="space-y-6">
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-brand-50 text-brand-700">Artist</span>
          <h2 className="text-2xl font-extrabold text-ink-900 mt-2">{accountLabel}</h2>
          <p className="text-sm text-ink-500 mt-1">
            {tiles.length} aankomende show{tiles.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-ink-900 mb-3">Kalender</h3>
        <MonthCalendar
          events={calendarEvents}
          emptyHint={`Nog geen events voor ${accountLabel}.`}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink-900">Aankomende shows</h3>
          <span className="text-xs text-ink-500 tabular-nums">{tiles.length} ingepland · gesorteerd op datum</span>
        </div>

        {tiles.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center">
            <p className="text-sm text-ink-500">Geen aankomende shows ingepland voor deze artiest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tiles.map(({ booking, festival, stage, advancing, readiness }) => (
              <ShowTile
                key={booking.id}
                href={advancing && advancingAccess ? `/advancings/${advancing.id}` : `/artists/${artistId}`}
                artistName=""
                showArtistName={false}
                festivalName={festival.name}
                stageName={stage.name}
                showDate={booking.show_date}
                showTime={booking.show_time}
                showType={SHOW_TYPE_LABELS[booking.show_type]}
                bookingStatus={booking.status}
                readiness={readiness}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
