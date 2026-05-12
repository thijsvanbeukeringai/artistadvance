import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { readAccount, canAccessAdvancing } from "@/lib/account";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import { SECTION_LABELS, SHOW_TYPE_LABELS, TECH_SECTIONS } from "@/lib/data";
import HotelBlock from "@/components/booking/HotelBlock";
import DistancesBlock from "@/components/booking/DistancesBlock";
import VisaBlock from "@/components/booking/VisaBlock";
import { computeReadiness } from "@/lib/readiness";
import ReadinessPanel from "@/components/readiness/ReadinessPanel";
import TouringPartyTable from "@/components/booking/TouringPartyTable";
import TechItemsList from "@/components/tech/TechItemsList";
import SyncTechFromTemplateButton from "@/components/tech/SyncTechFromTemplateButton";
import ProgramTimeline from "@/components/program/ProgramTimeline";
import RoomAssignmentsEditor from "@/components/booking/RoomAssignmentsEditor";
import { findAdvancingDetail, loadSnapshot } from "@/lib/snapshot";
import AdvancingTabs, { type AdvancingTab } from "@/components/advancing/AdvancingTabs";
import FestivalPortalVisibility from "@/components/advancing/FestivalPortalVisibility";
import FlightsManager from "@/components/advancing/FlightsManager";

const ICON = {
  tech: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  transport: "M3 11l18-8-8 18-2-7-8-3z",
  crew: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  hospitality: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  hotel: "M2 18V8 M22 18v-6a3 3 0 00-3-3H10v8 M2 14h20 M6 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  flights: "M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z",
};

export default async function AdvancingDetailPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  if (!canAccessAdvancing(account.role)) {
    redirect("/");
  }
  const detail = findAdvancingDetail(snap, params.id);
  if (!detail) return notFound();

  const { advancing, booking, artist, festival, stage, sections, riders, flights } = detail;

  const today = new Date("2026-05-09");
  const readiness = computeReadiness(snap, advancing.id, today)!;

  const technicalRiders = riders.filter((r) => r.rider_type === "technical" || r.rider_type === "sfx_pyro");
  const hospitalityRiders = riders.filter((r) => r.rider_type === "hospitality");
  const techSections = sections.filter((s) => (TECH_SECTIONS as readonly string[]).includes(s.section_type));
  const groundTransfers = snap.groundTransfersByAdvancing?.[advancing.id] ?? [];

  const techItemCount = detail.tech_items.length;
  const crewCount = detail.booking_crew.length;
  const flightCount = flights.length;

  const tabs: AdvancingTab[] = [
    {
      id: "tech",
      label: "Techniek",
      iconPath: ICON.tech,
      badge: String(techItemCount),
      content: <TechTab detail={detail} technicalRiders={technicalRiders} techSections={techSections} />,
    },
    {
      id: "transport",
      label: "Transport",
      iconPath: ICON.transport,
      badge: flightCount ? String(flightCount) : undefined,
      content: <TransportTab detail={detail} groundTransfers={groundTransfers} today={today} />,
    },
    {
      id: "crew",
      label: "Crew",
      iconPath: ICON.crew,
      badge: String(crewCount),
      content: <CrewTab detail={detail} snap={snap} />,
    },
    {
      id: "hospitality",
      label: "Hospitality",
      iconPath: ICON.hospitality,
      content: <HospitalityTab detail={detail} hospitalityRiders={hospitalityRiders} />,
    },
    {
      id: "hotel",
      label: "Hotel",
      iconPath: ICON.hotel,
      content: <HotelTab detail={detail} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/advancings" className="hover:text-ink-700">Advancings</Link>
        <span>/</span>
        <span className="text-ink-700">{artist.name}</span>
      </div>

      {/* Header */}
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

      {/* Festival portal link + visibility toggles */}
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Festival portal (PLEASE CONFIRM)</div>
          <div className="font-mono text-xs text-ink-700 truncate mt-1">/festival/{advancing.portal_token}</div>
        </div>
        <Link
          href={`/festival/${advancing.portal_token}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          Open festival portal →
        </Link>
      </div>

      <FestivalPortalVisibility
        advancingId={advancing.id}
        initialHidden={(advancing.festival_portal_hidden ?? []) as any}
      />

      {/* Program timeline */}
      <ProgramTimeline
        events={snap.timelineByAdvancing[advancing.id] ?? []}
        scope={{ advancingId: advancing.id }}
        canEdit={true}
        source="backoffice"
        showDate={booking.show_date}
      />

      {/* Tabs */}
      <AdvancingTabs tabs={tabs} defaultTab="tech" />
    </div>
  );
}

// ─── Tab content components ────────────────────────────────────────────────

function TechTab({
  detail,
  technicalRiders,
  techSections,
}: {
  detail: NonNullable<ReturnType<typeof findAdvancingDetail>>;
  technicalRiders: typeof detail.riders;
  techSections: typeof detail.sections;
}) {
  const { advancing, technical, logistics } = detail;
  return (
    <>
      <div id="tech-items" className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-ink-900">Tech requirements (PLEASE CONFIRM)</h3>
          <SyncTechFromTemplateButton advancingId={advancing.id} />
        </div>
        <TechItemsList items={detail.tech_items} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-ink-900">Tech sub-secties</h3>
          <span className="text-xs text-ink-500">Klik een kaart voor specs en invul-velden</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {techSections.map((s) => {
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <h4 className="font-bold text-ink-900 mb-3">Technische details</h4>
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
          <h4 className="font-bold text-ink-900 mb-3">Logistiek (load-in / show / load-out)</h4>
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
      </section>

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Technische riders</div>
        {technicalRiders.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-400">Geen technische riders.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {technicalRiders.map((r) => (
              <RiderRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function TransportTab({
  detail,
  groundTransfers,
  today,
}: {
  detail: NonNullable<ReturnType<typeof findAdvancingDetail>>;
  groundTransfers: any[];
  today: Date;
}) {
  return (
    <>
      <FlightsManager
        advancingId={detail.advancing.id}
        flights={detail.flights}
        showDate={detail.booking.show_date}
      />

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Ground transfers</div>
        {groundTransfers.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-400">Nog geen ground transfers geregistreerd.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {groundTransfers.map((t) => (
              <li key={t.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold text-ink-900">{t.transfer_type?.replace(/_/g, " ")}</div>
                  <div className="text-xs text-ink-500">{t.pickup_time ? new Date(t.pickup_time).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }) : "geen tijd"} {t.notes ? `· ${t.notes}` : ""}</div>
                </div>
                <StatusPill tone={statusTone(t.status)}>{humanStatus(t.status)}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DistancesBlock distances={detail.distances} />

      <VisaBlock visa={detail.visa} crew={detail.visa_crew} today={today} />
    </>
  );
}

function CrewTab({ detail, snap }: { detail: NonNullable<ReturnType<typeof findAdvancingDetail>>; snap: any }) {
  const { advancing, booking, artist, artist_contacts, festival_contacts } = detail;
  return (
    <>
      <TouringPartyTable
        bookingId={booking.id}
        advancingId={advancing.id}
        crew={detail.booking_crew}
        flights={detail.flights}
        artistCrewPool={snap.artistCrew.filter((c: any) => c.artist_id === artist.id)}
      />

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
    </>
  );
}

function HospitalityTab({
  detail,
  hospitalityRiders,
}: {
  detail: NonNullable<ReturnType<typeof findAdvancingDetail>>;
  hospitalityRiders: typeof detail.riders;
}) {
  const { hospitality } = detail;
  return (
    <>
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <h4 className="font-bold text-ink-900 mb-3">Hospitality</h4>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-ink-500">Party size</dt><dd className="text-ink-900 font-medium">{hospitality.party_size ?? "-"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Warme maaltijd</dt><dd className="text-ink-900 font-medium">{hospitality.hot_meal_required ? "Ja" : "Nee"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Dressing rooms</dt><dd className="text-ink-900 font-medium">{hospitality.dressing_room_count ?? "-"}</dd></div>
        </dl>
        {hospitality.specific_requests && <p className="mt-3 text-xs italic text-ink-500">{hospitality.specific_requests}</p>}
      </section>

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200 font-bold text-ink-900">Hospitality rider</div>
        {hospitalityRiders.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-400">Geen hospitality rider gekoppeld.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {hospitalityRiders.map((r) => (
              <RiderRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function HotelTab({ detail }: { detail: NonNullable<ReturnType<typeof findAdvancingDetail>> }) {
  const { advancing, travel } = detail;
  return (
    <>
      <HotelBlock hotel={detail.hotel} />

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <h4 className="font-bold text-ink-900 mb-3">Check-in / Check-out</h4>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-ink-500">Hotel benodigd</dt><dd className="text-ink-900 font-medium">{travel.hotel_required ? "Ja" : "Nee"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Aantal kamers</dt><dd className="text-ink-900 font-medium">{travel.hotel_room_count ?? "-"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Check-in</dt><dd className="text-ink-900 font-medium">{travel.hotel_check_in ?? "-"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Check-out</dt><dd className="text-ink-900 font-medium">{travel.hotel_check_out ?? "-"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Aantal nachten</dt><dd className="text-ink-900 font-medium">{detail.hotel.hotel_nights ?? "-"}</dd></div>
        </dl>
      </section>

      {detail.hotel.hotel_required && (
        <RoomAssignmentsEditor
          advancingId={advancing.id}
          initial={detail.hotel.room_assignments ?? []}
          crew={detail.booking_crew}
          hotelName={detail.hotel.hotel_confirmed_name ?? detail.hotel.hotel_preference}
          roomCount={detail.hotel.hotel_room_count}
        />
      )}
    </>
  );
}

function RiderRow({ r }: { r: any }) {
  return (
    <li className="px-5 py-4">
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
  );
}
