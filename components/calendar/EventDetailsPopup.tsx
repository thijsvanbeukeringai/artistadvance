"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CalEvent, CalEventMeta } from "./MonthCalendar";

const HEADER_BG: Record<CalEvent["type"], string> = {
  show: "bg-[#E91E63]",
  hotel: "bg-[#FF9800]",
  travel: "bg-[#4CAF50]",
  interview: "bg-[#E91E63]",
  block: "bg-[#DC2626]",
  soundcheck: "bg-[#8B5CF6]",
  reminder: "bg-[#0EA5E9]",
};

const HEADER_LABEL: Record<CalEvent["type"], string> = {
  show: "Show",
  hotel: "Hotel",
  travel: "Vlucht",
  interview: "Promo",
  block: "Block",
  soundcheck: "Soundcheck / programming",
  reminder: "Reminder",
};

const TZ = "Europe/Amsterdam";
function fmtDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("nl-NL", { weekday: "short", day: "2-digit", month: "long", year: "numeric", timeZone: TZ });
}
function fmtTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export default function EventDetailsPopup({
  event,
  onClose,
}: {
  event: CalEvent;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured header strip */}
        <div className={`${HEADER_BG[event.type]} text-white px-6 py-4 flex items-start justify-between gap-3`}>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">{HEADER_LABEL[event.type]}</div>
            <h2 className="text-xl font-extrabold leading-tight mt-0.5">{event.title}</h2>
            {event.subtitle && (
              <p className="text-sm opacity-90 mt-0.5">{event.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluit"
            className="w-8 h-8 rounded-md grid place-items-center bg-white/15 hover:bg-white/25 transition flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <Body event={event} />
        </div>

        {event.href && (
          <div className="px-6 py-3 border-t border-ink-200 bg-ink-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-sm font-semibold text-ink-700 hover:bg-ink-100 transition"
            >
              Sluit
            </button>
            <Link
              href={event.href}
              className="px-3 py-1.5 rounded-md text-sm font-semibold bg-ink-900 text-white hover:bg-black transition inline-flex items-center gap-1.5"
            >
              Open advancing
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Body({ event }: { event: CalEvent }) {
  const meta = event.meta;
  if (!meta) {
    return <div className="text-sm text-ink-500">Geen extra info beschikbaar.</div>;
  }
  switch (meta.kind) {
    case "show":      return <ShowBody m={meta} />;
    case "hotel":     return <HotelBody m={meta} />;
    case "travel":    return <TravelBody m={meta} />;
    case "soundcheck":return <TimelineBody m={meta} />;
    case "reminder":  return <ReminderBody m={meta} />;
  }
}

function ReminderBody({ m }: { m: CalEventMeta & { kind: "reminder" } }) {
  return (
    <div className="space-y-3">
      <KV label="Artist">{m.artistName}</KV>
      <KV label="Wanneer">{fmtDate(m.datetime)} · {fmtTime(m.datetime)}</KV>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Reminder</div>
        <div className="text-lg font-bold text-ink-900 mt-0.5">{m.title}</div>
      </div>
      {m.notes && (
        <div className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700 whitespace-pre-wrap">{m.notes}</div>
      )}
    </div>
  );
}

function ShowBody({ m }: { m: CalEventMeta & { kind: "show" } }) {
  return (
    <div className="space-y-4">
      <KV label="Artist">{m.artistName}</KV>
      <KV label="Festival · stage">{m.festivalName} · {m.stageName}{m.venueLocation && <span className="text-ink-500"> · {m.venueLocation}</span>}</KV>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Show" value={m.showTime?.slice(0,5) ?? "-"} sub={`${m.setDuration ?? "-"} min`} />
        <Stat label="Doors" value={m.doorsTime?.slice(0,5) ?? "-"} />
        <Stat label="Curfew" value={m.curfewTime?.slice(0,5) ?? "-"} />
        <Stat label="Status" value={m.status} pill />
      </div>

      {(m.programmingSlot || m.soundcheckSlot) && (
        <div className="space-y-1">
          {m.programmingSlot && <KV label="Programming slot">{m.programmingSlot}</KV>}
          {m.soundcheckSlot && <KV label="Soundcheck slot">{m.soundcheckSlot}</KV>}
        </div>
      )}

      {m.fee != null && (
        <KV label="Fee"><span className="font-mono">€{m.fee.toLocaleString("nl-NL")}</span></KV>
      )}
    </div>
  );
}

function HotelBody({ m }: { m: CalEventMeta & { kind: "hotel" } }) {
  const totalAssigned = m.roomAssignments?.reduce((s, r) => s + r.occupants.length, 0) ?? 0;
  return (
    <div className="space-y-4">
      <KV label="Artist">{m.artistName}</KV>
      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Hotel</div>
        <div className="text-lg font-bold text-ink-900 mt-0.5">
          {m.hotelName ?? m.preference ?? "Nog niet bevestigd"}
          {m.starRating && <span className="ml-2 text-sm text-ink-500">{m.starRating}</span>}
        </div>
        {!m.hotelName && m.preference && (
          <div className="text-xs text-amber-700 mt-0.5">Voorkeur, nog niet bevestigd</div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Kamers" value={m.roomCount?.toString() ?? "-"} sub={m.roomType} />
        <Stat label="Nachten" value={m.nights?.toString() ?? "-"} sub={m.nightsDescription} />
        <Stat label="Check-in" value={m.checkIn?.slice(5) ?? "-"} sub={m.checkIn ? new Date(m.checkIn).toLocaleDateString("nl-NL", { weekday: "short" }) : ""} />
        <Stat label="Check-out" value={m.checkOut?.slice(5) ?? "-"} sub={m.checkOut ? new Date(m.checkOut).toLocaleDateString("nl-NL", { weekday: "short" }) : ""} />
      </div>

      {m.lateCheckout && (
        <div className="text-xs px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold inline-block">
          ✓ Late check-out geregeld
        </div>
      )}

      {/* Kamer-indeling */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Kamer-indeling</div>
          {m.roomAssignments && m.roomAssignments.length > 0 && (
            <div className="text-[10px] tabular-nums text-ink-500">{totalAssigned} pers in {m.roomAssignments.length} kamers</div>
          )}
        </div>
        {m.roomAssignments && m.roomAssignments.length > 0 ? (
          <ul className="space-y-2">
            {m.roomAssignments.map((r, i) => (
              <li key={i} className="rounded-lg border border-ink-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-900">{r.label}</span>
                  <span className="text-[10px] tabular-nums text-ink-500">{r.occupants.length} pers</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.occupants.length === 0 ? (
                    <span className="text-xs text-ink-400">Leeg</span>
                  ) : r.occupants.map((p, j) => (
                    <span key={j} className="text-xs bg-ink-100 text-ink-700 px-2 py-0.5 rounded font-medium">{p}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-ink-200 px-3 py-3 text-xs text-ink-500">
            Nog geen kamer-indeling.
            {m.travelingCrew.length > 0 && (
              <>
                {" "}Touring party ({m.travelingCrew.length}):{" "}
                <span className="text-ink-700">{m.travelingCrew.join(", ")}</span>
              </>
            )}
            {" "}Wijs toe via de Advancing-page.
          </div>
        )}
      </div>
    </div>
  );
}

function TravelBody({ m }: { m: CalEventMeta & { kind: "travel" } }) {
  return (
    <div className="space-y-4">
      <KV label="Artist">{m.artistName}</KV>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{m.direction === "inbound" ? "Inbound" : "Outbound"}</div>
          <div className="text-xl font-extrabold text-ink-900 mt-0.5">{m.airline} {m.flightNumber}</div>
        </div>
        {m.bookingReference && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">PNR</div>
            <div className="font-mono font-bold text-ink-900 mt-0.5">{m.bookingReference}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-ink-100 p-3">
          <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Vertrek</div>
          <div className="text-2xl font-extrabold text-ink-900 mt-1 tabular-nums">{fmtTime(m.departureDatetime)}</div>
          <div className="text-xs text-ink-500 mt-0.5">{fmtDate(m.departureDatetime)}</div>
          <div className="text-xs font-bold text-ink-700 mt-1">{m.departureAirport}</div>
        </div>
        <div className="rounded-lg bg-ink-100 p-3">
          <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Aankomst</div>
          <div className="text-2xl font-extrabold text-ink-900 mt-1 tabular-nums">{fmtTime(m.arrivalDatetime)}</div>
          <div className="text-xs text-ink-500 mt-0.5">{fmtDate(m.arrivalDatetime)}</div>
          <div className="text-xs font-bold text-ink-700 mt-1">{m.arrivalAirport}</div>
        </div>
      </div>

      {m.status && (
        <KV label="Status">
          <StatusPill status={m.status} />
        </KV>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500 mb-1">Passagiers ({m.passengers.length})</div>
        {m.passengers.length === 0 ? (
          <div className="text-xs text-ink-400">Nog niet ingevuld.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {m.passengers.map((p, i) => (
              <li key={i} className="text-sm text-ink-700 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-ink-400" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>

      {m.notes && (
        <KV label="Notitie">{m.notes}</KV>
      )}
    </div>
  );
}

function TimelineBody({ m }: { m: CalEventMeta & { kind: "soundcheck" } }) {
  const dt = new Date(m.datetime);
  return (
    <div className="space-y-4">
      <KV label="Artist">{m.artistName}</KV>

      <div className="rounded-lg bg-ink-100 p-3">
        <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Wanneer</div>
        <div className="text-2xl font-extrabold text-ink-900 mt-1 tabular-nums">
          {dt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}
        </div>
        <div className="text-xs text-ink-500 mt-0.5">{fmtDate(m.datetime)}</div>
      </div>

      {m.location && <KV label="Locatie">{m.location}</KV>}
      {m.responsibleContact && <KV label="Verantwoordelijke">{m.responsibleContact}</KV>}
      {m.notes && <KV label="Notitie">{m.notes}</KV>}
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">{label}</div>
      <div className="text-sm text-ink-900 mt-0.5">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, pill = false }: { label: string; value: string; sub?: string; pill?: boolean }) {
  return (
    <div className="rounded-lg bg-ink-100 px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider font-bold text-ink-500">{label}</div>
      <div className="mt-0.5">
        {pill ? <StatusPill status={value} /> : <span className="text-lg font-extrabold text-ink-900 tabular-nums">{value}</span>}
      </div>
      {sub && <div className="text-[10px] text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  complete: "bg-emerald-50 text-emerald-700",
  locked: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-sky-50 text-sky-700",
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  booked: "bg-sky-50 text-sky-700",
  "n/a": "bg-ink-100 text-ink-500",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_TONE[status] ?? "bg-ink-100 text-ink-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
