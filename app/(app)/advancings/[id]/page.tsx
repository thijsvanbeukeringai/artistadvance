import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readAccount, canAccessAdvancing } from "@/lib/account";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import { SECTION_LABELS, SHOW_TYPE_LABELS } from "@/lib/data";
import HotelBlock from "@/components/booking/HotelBlock";
import DistancesBlock from "@/components/booking/DistancesBlock";
import VisaBlock from "@/components/booking/VisaBlock";
import DropboxTree from "@/components/booking/DropboxTree";
import { computeReadiness } from "@/lib/readiness";
import ReadinessPanel from "@/components/readiness/ReadinessPanel";
import TouringPartyTable from "@/components/booking/TouringPartyTable";
import TechItemsList from "@/components/tech/TechItemsList";
import ProgramTimeline from "@/components/program/ProgramTimeline";
import AdvancingCalendar from "@/components/calendar/AdvancingCalendar";
import { buildCalendarEvents } from "@/lib/calendarEvents";
import RoomAssignmentsEditor from "@/components/booking/RoomAssignmentsEditor";
import { findAdvancingDetail, loadSnapshot } from "@/lib/snapshot";

export default async function AdvancingDetailPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  if (!canAccessAdvancing(account.role)) {
    redirect("/");
  }
  const detail = findAdvancingDetail(snap, params.id);
  if (!detail) return notFound();

  const { advancing, booking, artist, festival, stage, sections, riders, artist_contacts, festival_contacts, flights, activity, technical, logistics, travel, hospitality } = detail;

  const today = new Date("2026-05-09");
  const readiness = computeReadiness(snap, advancing.id, today)!;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/advancings" className="hover:text-ink-700">Advancings</Link>
        <span>/</span>
        <span className="text-ink-700">{artist.name}</span>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white text-2xl font-extrabold">
            {artist.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-ink-900">{artist.name}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-ink-900 text-white">
                {SHOW_TYPE_LABELS[booking.show_type]}
              </span>
              {booking.is_looped && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-100 text-amber-800">
                  looped
                </span>
              )}
            </div>
            <p className="text-sm text-ink-500 mt-1">
              {festival.name} · {stage.name} · {booking.show_date} {booking.show_time}
              {booking.set_duration_minutes && ` · ${booking.set_duration_minutes} min`}
            </p>
            {(booking.programming_slot || booking.soundcheck_slot || booking.curfew_time || booking.doors_time) && (
              <div className="flex items-center gap-3 text-xs text-ink-500 mt-2 flex-wrap">
                {booking.doors_time && <span>Doors {booking.doors_time}</span>}
                {booking.curfew_time && <span>Curfew {booking.curfew_time}</span>}
                {booking.programming_slot && <span>Programming: {booking.programming_slot}</span>}
                {booking.soundcheck_slot && <span>Soundcheck: {booking.soundcheck_slot}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill tone={statusTone(advancing.status)}>{humanStatus(advancing.status)}</StatusPill>
          <a
            href={`/api/callsheet/${advancing.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 bg-white hover:bg-ink-100 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Download PDF
          </a>
          <Link
            href={`/callsheet/${advancing.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-xs font-medium text-ink-500 bg-white hover:bg-ink-100 transition"
          >
            Preview
          </Link>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black">
            Markeer compleet
          </button>
        </div>
      </header>

      {/* Readiness panel */}
      <ReadinessPanel
        readiness={readiness}
        showDate={booking.show_date}
        showTime={booking.show_time}
        portalToken={advancing.portal_token}
      />

      {/* Portal-links strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-brand-600">Management portal</div>
          <div className="font-mono text-xs text-ink-700 truncate mt-1">/portal/{advancing.portal_token}</div>
          <Link href={`/portal/${advancing.portal_token}`} className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline">Open management portal →</Link>
        </div>
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Festival portal (PLEASE CONFIRM)</div>
          <div className="font-mono text-xs text-ink-700 truncate mt-1">/festival/{advancing.portal_token}</div>
          <Link href={`/festival/${advancing.portal_token}`} className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline">Open festival portal →</Link>
        </div>
      </div>

      {/* Calendar voor advancing — klik op dag opent flight/program-slot popup */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-ink-900">Kalender</h3>
            <p className="text-[11px] text-ink-500 mt-0.5">Klik op een dag om snel een vlucht of programma-item toe te voegen.</p>
          </div>
        </div>
        <AdvancingCalendar
          events={buildCalendarEvents(snap, new Set([booking.artist_id]))}
          advancingId={advancing.id}
          emptyHint="Voeg vluchten of programma-items toe door op een dag te klikken."
        />
      </section>

      {/* Program timeline */}
      <ProgramTimeline
        events={snap.timelineByAdvancing[advancing.id] ?? []}
        scope={{ advancingId: advancing.id }}
        canEdit={true}
        source="backoffice"
        showDate={booking.show_date}
      />

      {/* Touring party */}
      <TouringPartyTable
        bookingId={booking.id}
        advancingId={advancing.id}
        crew={detail.booking_crew}
        flights={detail.flights}
        artistCrewPool={snap.artistCrew.filter((c) => c.artist_id === artist.id)}
      />

      {/* Kamer-indeling (alleen als hotel required) */}
      {detail.hotel.hotel_required && (
        <RoomAssignmentsEditor
          advancingId={advancing.id}
          initial={detail.hotel.room_assignments ?? []}
          crew={detail.booking_crew}
          hotelName={detail.hotel.hotel_confirmed_name ?? detail.hotel.hotel_preference}
          roomCount={detail.hotel.hotel_room_count}
        />
      )}

      {/* Tech items PLEASE CONFIRM */}
      <div id="tech-items" className="scroll-mt-20">
        <TechItemsList items={detail.tech_items} />
      </div>

      {/* Hotel / Distances / Visa */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HotelBlock hotel={detail.hotel} />
        <DistancesBlock distances={detail.distances} />
        <VisaBlock visa={detail.visa} crew={detail.visa_crew} today={today} />
      </section>

      {/* Dropbox structure */}
      <DropboxTree rootFolder={advancing.dropbox_show_folder} />

      {/* All 18 sections grid - elke kaart linkt door naar de portal section voor specs/edit */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-ink-900">Alle advancing secties</h3>
          <span className="text-xs text-ink-500">Klik een kaart voor specs en invul-velden</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sections.map((s) => {
            const tone = s.status === "complete" || s.status === "locked" ? "ok" : s.status === "in_progress" ? "info" : s.status === "n_a" ? "neutral" : "warn";
            return (
              <Link
                key={s.id}
                href={`/portal/${advancing.portal_token}/${s.section_type}`}
                className="group bg-white border border-ink-200 rounded-xl p-3 shadow-card hover:border-brand-400 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 block"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-ink-900 truncate">{SECTION_LABELS[s.section_type] ?? s.section_type}</div>
                  <span className="text-ink-300 group-hover:text-brand-500 transition flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${s.completion_percent}%` }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <StatusPill tone={tone as any}>{humanStatus(s.status)}</StatusPill>
                  <span className="font-bold text-ink-700 tabular-nums">{s.completion_percent}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Riders + flights */}
      <section id="riders" className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-20">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Getekende riders</div>
          <ul className="divide-y divide-ink-200">
            {riders.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-ink-900">
                      {r.rider_type === "technical" ? "Technische rider" : r.rider_type === "hospitality" ? "Hospitality rider" : "SFX/Pyro rider"}
                    </div>
                    {r.signed_by_name && (
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Getekend door <span className="font-bold">{r.signed_by_name}</span>
                        {r.signed_by_role && ` (${r.signed_by_role})`}
                        {r.signed_at && <span className="text-ink-500"> op {new Date(r.signed_at).toLocaleDateString("nl-NL")}</span>}
                      </div>
                    )}
                    {r.signed_url && (
                      <a href={r.signed_url} target="_blank" rel="noopener" className="text-xs font-semibold text-brand-600 hover:underline mt-1 inline-block">
                        Open getekende PDF →
                      </a>
                    )}
                    {r.dispute_notes && <div className="text-xs text-red-600 mt-1 italic">{r.dispute_notes}</div>}
                  </div>
                  <StatusPill tone={statusTone(r.status)}>{humanStatus(r.status)}</StatusPill>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Vluchten</div>
          {flights.length === 0 ? (
            <div className="px-5 py-8 text-sm text-ink-400">Nog geen vluchten geregistreerd.</div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {flights.map((f) => (
                <li key={f.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-brand-600 uppercase">{f.direction}</div>
                      <div className="font-bold text-ink-900">{f.airline} {f.flight_number}</div>
                      <div className="text-xs text-ink-500">
                        {f.departure_airport} → {f.arrival_airport}
                      </div>
                    </div>
                    <div className="text-right text-xs text-ink-500">
                      <div>{new Date(f.departure_datetime).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}</div>
                      <div>{f.passengers.length} passagiers</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Contacts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Contactpersonen artiest</div>
          {artist_contacts.length === 0 ? (
            <div className="px-5 py-8 text-sm text-ink-400">Nog geen contacten ingevuld.</div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {artist_contacts.map((c) => (
                <li key={c.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink-100 grid place-items-center text-ink-700 font-bold">
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-ink-900">{c.name}</div>
                    <div className="text-xs text-ink-500">{c.role}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </div>
                  {c.is_onsite && <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">on-site</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Contactpersonen festival</div>
          {festival_contacts.length === 0 ? (
            <div className="px-5 py-8 text-sm text-ink-400">Festival heeft nog geen contacten ingevuld.</div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {festival_contacts.map((c) => (
                <li key={c.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink-100 grid place-items-center text-ink-700 font-bold">
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-ink-900">{c.name}</div>
                    <div className="text-xs text-ink-500">{c.role}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Quick details */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <h4 className="font-bold text-ink-900 mb-3">Logistiek</h4>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-ink-500">Load-in</dt><dd className="text-ink-900 font-medium">{logistics.load_in_time ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Soundcheck</dt><dd className="text-ink-900 font-medium">{logistics.soundcheck_time ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Showtime</dt><dd className="text-ink-900 font-medium">{logistics.show_time ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Load-out</dt><dd className="text-ink-900 font-medium">{logistics.load_out_time ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Crew meekomend</dt><dd className="text-ink-900 font-medium">{logistics.crew_traveling ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Parking</dt><dd className="text-ink-900 font-medium">{logistics.parking_spots_needed ?? "-"}</dd></div>
          </dl>
          {logistics.notes && <p className="mt-3 text-xs italic text-ink-500">{logistics.notes}</p>}
        </div>

        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <h4 className="font-bold text-ink-900 mb-3">Technisch</h4>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-ink-500">FOH engineer</dt><dd className="text-ink-900 font-medium">{technical.foh_engineer_name ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Channel count</dt><dd className="text-ink-900 font-medium">{technical.channel_count ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Monitor setup</dt><dd className="text-ink-900 font-medium">{technical.monitor_setup ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Light setup</dt><dd className="text-ink-900 font-medium">{technical.light_setup_type ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Pyro</dt><dd className="text-ink-900 font-medium">{technical.pyro_required ? "Ja" : "Nee"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Stageplot</dt><dd className="text-ink-900 font-medium">{technical.stageplot_uploaded ? "Geüpload" : "Mist"}</dd></div>
          </dl>
        </div>

        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <h4 className="font-bold text-ink-900 mb-3">Hospitality & travel</h4>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-ink-500">Party size</dt><dd className="text-ink-900 font-medium">{hospitality.party_size ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Warme maaltijd</dt><dd className="text-ink-900 font-medium">{hospitality.hot_meal_required ? "Ja" : "Nee"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Dressing rooms</dt><dd className="text-ink-900 font-medium">{hospitality.dressing_room_count ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Hotel</dt><dd className="text-ink-900 font-medium">{travel.hotel_required ? `${travel.hotel_room_count ?? "-"} kamers` : "Geen"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Check-in</dt><dd className="text-ink-900 font-medium">{travel.hotel_check_in ?? "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Check-out</dt><dd className="text-ink-900 font-medium">{travel.hotel_check_out ?? "-"}</dd></div>
          </dl>
          {hospitality.specific_requests && <p className="mt-3 text-xs italic text-ink-500">{hospitality.specific_requests}</p>}
        </div>
      </section>

      {/* Activity */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Activity</div>
        {activity.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-400">Nog geen activiteit.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {activity.map((a) => (
              <li key={a.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink-900"><span className="font-semibold">{a.user_name}</span> - {a.details ?? humanStatus(a.action)}</div>
                  <div className="text-xs text-ink-400">{new Date(a.created_at).toLocaleString("nl-NL")}</div>
                </div>
                {a.section_type && <StatusPill tone="soft">{a.section_type}</StatusPill>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
