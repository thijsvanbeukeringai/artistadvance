import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import ConfirmBookingButton from "@/components/booking/ConfirmBookingButton";
import NewBookingForm from "@/components/booking/NewBookingForm";
import DeleteBookingButton from "@/components/booking/DeleteBookingButton";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import { buildCalendarEvents } from "@/lib/calendarEvents";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount, canAccessAdvancing } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function ArtistDetailPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const advancingAccess = canAccessAdvancing(account.role);
  const artist = snap.artists.find((a) => a.id === params.id);
  if (!artist) return notFound();
  const org = snap.organizations.find((o) => o.id === artist.organization_id);

  const aBookings = snap.bookings
    .filter((b) => b.artist_id === artist.id)
    .map((booking) => {
      const advancing = snap.advancings.find((adv) => adv.booking_id === booking.id);
      const festival = snap.festivals.find((f) => f.id === booking.festival_id)!;
      const stage = snap.stages.find((s) => s.id === booking.stage_id)!;
      return { booking, advancing, festival, stage };
    })
    .sort((a, b) => (a.booking.show_date < b.booking.show_date ? -1 : 1));

  const today = "2026-05-09";
  const upcoming = aBookings.filter((x) => x.booking.show_date >= today);
  const past = aBookings.filter((x) => x.booking.show_date < today);

  const drafts = upcoming.filter((x) => x.booking.status === "draft");
  const confirmed = upcoming.filter((x) => x.booking.status !== "draft");

  const calendarEvents = buildCalendarEvents(snap, new Set([artist.id]), account.mode);
  const isArtistMode = account.mode === "artist";

  return (
    <div className="space-y-6">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/artists" className="hover:text-ink-700">Artists</Link>
        <span>/</span>
        <span className="text-ink-700">{artist.name}</span>
      </div>

      {/* header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white text-3xl font-extrabold">
            {artist.name.slice(0, 1)}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-ink-900">{artist.name}</h2>
            <p className="text-sm text-ink-500 mt-1">
              {org?.name}
              {artist.dropbox_artist_folder ? (
                <span className="ml-2 font-mono text-[11px] text-ink-400">{artist.dropbox_artist_folder}</span>
              ) : (
                <span className="ml-2 text-amber-700">· Geen Dropbox folder</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/artists/${artist.id}/templates`}
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
          >
            Templates
          </Link>
          <Link
            href={`/artists/${artist.id}/settings`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.4 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.4h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
            </svg>
            Settings
          </Link>
          <Link
            href={org ? `/admin/companies/${org.id}` : "/admin/companies"}
            className="text-sm text-ink-700 hover:underline ml-2"
          >
            ← {org?.name ?? "Bedrijven"}
          </Link>
        </div>
      </header>

      {/* summary stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <div className="text-xs text-ink-400">Aankomend</div>
          <div className="text-3xl font-extrabold text-ink-900 tabular-nums mt-1">{upcoming.length}</div>
          <div className="text-[11px] text-ink-400 mt-1">shows ingepland</div>
        </div>
        <div className={`rounded-2xl shadow-card p-5 border ${drafts.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-ink-200"}`}>
          <div className={`text-xs ${drafts.length > 0 ? "text-amber-800" : "text-ink-400"}`}>Drafts open</div>
          <div className={`text-3xl font-extrabold tabular-nums mt-1 ${drafts.length > 0 ? "text-amber-800" : "text-ink-900"}`}>{drafts.length}</div>
          <div className={`text-[11px] mt-1 ${drafts.length > 0 ? "text-amber-700" : "text-ink-400"}`}>nog te bevestigen</div>
        </div>
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <div className="text-xs text-ink-400">Bevestigd</div>
          <div className="text-3xl font-extrabold text-ink-900 tabular-nums mt-1">{confirmed.length}</div>
          <div className="text-[11px] text-ink-400 mt-1">advancing actief</div>
        </div>
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <div className="text-xs text-ink-400">Eerdere shows</div>
          <div className="text-3xl font-extrabold text-ink-900 tabular-nums mt-1">{past.length}</div>
          <div className="text-[11px] text-ink-400 mt-1">historisch</div>
        </div>
      </section>

      {/* Calendar */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-ink-900">Kalender</h3>
            <p className="text-[11px] text-ink-500 mt-0.5">Alle shows, vluchten en hotels van {artist.name} op één tijdlijn.</p>
          </div>
          <Link
            href={`/artists/${artist.id}/calendar`}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Open volledig kalender-overzicht →
          </Link>
        </div>
        <MonthCalendar
          events={calendarEvents}
          emptyHint={`Nog geen events voor ${artist.name}. Maak hieronder een nieuwe boeking aan.`}
        />
      </section>

      {/* New booking + upcoming bookings */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-ink-900">Boekingen ({upcoming.length})</h3>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Maak een booking als <span className="font-semibold">draft</span>. Zodra je bevestigt start automatisch de advancing met crew + defaults vanuit settings.
            </p>
          </div>
          <NewBookingForm
            artistId={artist.id}
            festivals={snap.festivals}
            stages={snap.stages}
            festivalContacts={snap.festivalCrmContacts}
          />
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-10 text-center text-sm text-ink-500">
            Geen aankomende boekingen. Klik "Nieuwe booking" hierboven om er één toe te voegen.
          </div>
        ) : (
          <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50">
                  <th className="px-5 py-3 font-semibold">Datum / tijd</th>
                  <th className="px-5 py-3 font-semibold">Festival · Stage</th>
                  <th className="px-5 py-3 font-semibold">Show-type</th>
                  {!isArtistMode && <th className="px-5 py-3 font-semibold">Fee</th>}
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {upcoming.map(({ booking, advancing, festival, stage }) => (
                  <tr key={booking.id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-900 tabular-nums">{booking.show_date}</div>
                      <div className="text-xs text-ink-400 tabular-nums">
                        {booking.show_time ?? "—"}
                        {booking.set_duration_minutes ? ` · ${booking.set_duration_minutes} min` : ""}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-ink-900">{festival.name}</div>
                      <div className="text-xs text-ink-400">{stage.name} · {festival.location}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
                        {SHOW_TYPE_LABELS[booking.show_type]}
                      </span>
                    </td>
                    {!isArtistMode && (
                      <td className="px-5 py-4 text-ink-700 tabular-nums">
                        {booking.fee ? `€ ${booking.fee.toLocaleString("nl-NL")}` : "—"}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <StatusPill tone={statusTone(booking.status)}>{humanStatus(booking.status)}</StatusPill>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {advancing ? (
                          advancingAccess ? (
                            <Link
                              href={`/advancings/${advancing.id}`}
                              className="text-brand-600 font-semibold hover:underline text-xs"
                            >
                              Open advancing →
                            </Link>
                          ) : (
                            <span className="text-[11px] text-ink-400">overhandigd aan advancing-team</span>
                          )
                        ) : booking.status === "draft" ? (
                          <>
                            <ConfirmBookingButton bookingId={booking.id} label="Bevestig → start advancing" />
                            <DeleteBookingButton bookingId={booking.id} artistId={artist.id} />
                          </>
                        ) : advancingAccess ? (
                          <ConfirmBookingButton bookingId={booking.id} label="Start advancing" />
                        ) : (
                          <span className="text-[11px] text-ink-400">wacht op advancing-team</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* past shows */}
      {past.length > 0 && (
        <section>
          <h3 className="font-bold text-ink-900 mb-3">Eerdere shows ({past.length})</h3>
          <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
            <table className="w-full min-w-[640px] text-sm">
              <tbody className="divide-y divide-ink-200">
                {past.map(({ booking, advancing, festival, stage }) => (
                  <tr key={booking.id} className="text-ink-500 hover:bg-ink-50 transition-colors">
                    <td className="px-5 py-3 tabular-nums">{booking.show_date}</td>
                    <td className="px-5 py-3">{festival.name} · {stage.name}</td>
                    <td className="px-5 py-3"><StatusPill tone={statusTone(booking.status)}>{humanStatus(booking.status)}</StatusPill></td>
                    <td className="px-5 py-3 text-right">
                      {advancing && advancingAccess && <Link href={`/advancings/${advancing.id}`} className="text-brand-600 font-semibold text-xs hover:underline">Bekijk</Link>}
                    </td>
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
