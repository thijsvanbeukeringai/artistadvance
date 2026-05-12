"use client";

import { useMemo, useState, useTransition } from "react";
import type { ArtistCrew, BookingCrew, CrewRole, FlightInfo, FlightStatus } from "@/lib/types";
import { CREW_ROLE_LABELS } from "@/lib/data";
import {
  updateBookingCrewAction,
  addBookingCrewAction,
  removeBookingCrewAction,
  addAdvancingFlightAction,
  removeAdvancingFlightAction,
} from "@/lib/actions";

const flightStatusTone: Record<string, string> = {
  "n/a": "bg-ink-100 text-ink-500",
  pending: "bg-amber-50 text-amber-700",
  booked: "bg-sky-50 text-sky-700",
  confirmed: "bg-emerald-50 text-emerald-700",
};

const FLIGHT_STATUSES: FlightStatus[] = ["n/a", "pending", "booked", "confirmed"];

export default function TouringPartyTable({
  bookingId,
  advancingId,
  crew,
  flights,
  artistCrewPool,
}: {
  bookingId: string;
  advancingId: string;
  crew: BookingCrew[];
  flights: FlightInfo[];
  artistCrewPool: ArtistCrew[];
}) {
  const [editing, setEditing] = useState(false);

  if (crew.length === 0 && flights.length === 0) {
    return (
      <section className="bg-white border border-dashed border-ink-200 rounded-2xl p-8 text-center">
        <h3 className="font-bold text-ink-900">Touring party nog niet vastgelegd</h3>
        <p className="text-sm text-ink-500 mt-1">Geen crew gekoppeld aan deze booking. Voeg crew leden van de artiest toe.</p>
      </section>
    );
  }

  const traveling = crew.filter((c) => c.is_traveling).length;
  const needFlights = crew.filter((c) => c.needs_flight).length;
  const flightsBooked = crew.filter((c) => c.needs_flight && (c.flight_status === "booked" || c.flight_status === "confirmed")).length;

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
        <div>
          <h3 className="font-bold text-ink-900">Touring party</h3>
          <p className="text-xs text-ink-500 mt-0.5 tabular-nums">
            {traveling} reizen mee · {flightsBooked}/{needFlights} vluchten geregeld · {flights.length} flight booking{flights.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded-md font-semibold transition ${
            editing
              ? "bg-ink-900 text-white hover:bg-black"
              : "border border-ink-200 text-ink-700 hover:bg-ink-100"
          }`}
        >
          {editing ? "Klaar met bewerken" : "Crew bewerken"}
        </button>
      </header>

      <CrewTable crew={crew} advancingId={advancingId} editing={editing} />

      {editing && (
        <AddCrewPanel
          bookingId={bookingId}
          advancingId={advancingId}
          alreadyAddedArtistCrewIds={new Set(crew.map((c) => c.artist_crew_id).filter(Boolean) as string[])}
          artistCrewPool={artistCrewPool}
        />
      )}

      <FlightsBlock
        advancingId={advancingId}
        crew={crew}
        flights={flights}
        editing={editing}
      />
    </section>
  );
}

// ============================================================================
// Crew table - read-only of editable
// ============================================================================

function CrewTable({ crew, advancingId, editing }: { crew: BookingCrew[]; advancingId: string; editing: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50">
            <th className="px-5 py-3 font-semibold">Rol</th>
            <th className="px-5 py-3 font-semibold">Naam</th>
            <th className="px-5 py-3 font-semibold">Reist mee</th>
            <th className="px-5 py-3 font-semibold">Vlucht</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Notities</th>
            {editing && <th className="px-3 py-3 font-semibold"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200">
          {crew.map((c) => (
            <CrewRow key={c.id} crew={c} advancingId={advancingId} editing={editing} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrewRow({ crew, advancingId, editing }: { crew: BookingCrew; advancingId: string; editing: boolean }) {
  const [pending, start] = useTransition();
  const [local, setLocal] = useState({
    is_traveling: crew.is_traveling,
    needs_flight: crew.needs_flight,
    flight_status: crew.flight_status,
    notes: crew.notes ?? "",
  });

  function patch(p: Partial<typeof local>) {
    const merged = { ...local, ...p };
    setLocal(merged);
    start(async () => {
      await updateBookingCrewAction(crew.id, advancingId, p);
    });
  }

  return (
    <tr className={`hover:bg-ink-50 transition-colors ${!local.is_traveling ? "opacity-60" : ""} ${pending ? "opacity-50" : ""}`}>
      <td className="px-5 py-3 whitespace-nowrap">
        <span className="text-[10px] font-bold uppercase bg-ink-100 text-ink-700 px-1.5 py-0.5 rounded mr-2">
          {crew.role.toUpperCase()}
        </span>
        <span className="text-xs text-ink-500">{CREW_ROLE_LABELS[crew.role]}</span>
      </td>
      <td className="px-5 py-3 font-medium text-ink-900">{crew.name}</td>
      <td className="px-5 py-3">
        {editing ? (
          <button
            type="button"
            onClick={() => patch({ is_traveling: !local.is_traveling })}
            disabled={pending}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              local.is_traveling ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${local.is_traveling ? "bg-emerald-500" : "bg-ink-300"}`} />
            {local.is_traveling ? "Ja" : "Nee"}
          </button>
        ) : (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${local.is_traveling ? "text-emerald-700" : "text-ink-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${local.is_traveling ? "bg-emerald-500" : "bg-ink-300"}`} />
            {local.is_traveling ? "Ja" : "Nee"}
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        {editing ? (
          <button
            type="button"
            onClick={() => patch({ needs_flight: !local.needs_flight })}
            disabled={pending}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
              local.needs_flight ? "bg-sky-50 text-sky-700 hover:bg-sky-100" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            }`}
          >
            {local.needs_flight ? "Ja" : "Nee"}
          </button>
        ) : (
          <span className={`text-[11px] font-semibold ${local.needs_flight ? "text-ink-900" : "text-ink-400"}`}>
            {local.needs_flight ? "Ja" : "Nee"}
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        {editing ? (
          <select
            value={local.flight_status}
            onChange={(e) => patch({ flight_status: e.target.value as FlightStatus })}
            disabled={pending}
            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border-0 cursor-pointer ${flightStatusTone[local.flight_status] ?? flightStatusTone["n/a"]}`}
          >
            {FLIGHT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${flightStatusTone[local.flight_status] ?? flightStatusTone["n/a"]}`}>
            {local.flight_status}
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-xs text-ink-500 min-w-[140px]">
        {editing ? (
          <input
            type="text"
            value={local.notes}
            onChange={(e) => setLocal({ ...local, notes: e.target.value })}
            onBlur={() => patch({ notes: local.notes })}
            placeholder="-"
            className="w-full bg-transparent border-b border-ink-200 focus:border-brand-500 focus:outline-none text-xs py-0.5"
          />
        ) : (
          local.notes || "-"
        )}
      </td>
      {editing && (
        <td className="px-3 py-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`${crew.name} verwijderen uit deze touring party?`)) return;
              start(async () => { await removeBookingCrewAction(crew.id, advancingId); });
            }}
            className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
            title="Verwijder uit touring party"
          >
            ✕
          </button>
        </td>
      )}
    </tr>
  );
}

// ============================================================================
// Add crew panel - pick uit artist defaults of voeg ad-hoc toe
// ============================================================================

const ROLES: CrewRole[] = ["pm", "tm", "tm2", "foh", "ld", "vj", "bl", "media1", "media2", "vi", "sfx", "laser", "makeup", "mgmt", "artist", "other"];

function AddCrewPanel({
  bookingId,
  advancingId,
  alreadyAddedArtistCrewIds,
  artistCrewPool,
}: {
  bookingId: string;
  advancingId: string;
  alreadyAddedArtistCrewIds: Set<string>;
  artistCrewPool: ArtistCrew[];
}) {
  const [mode, setMode] = useState<"closed" | "pool" | "adhoc">("closed");
  const available = artistCrewPool.filter((c) => !alreadyAddedArtistCrewIds.has(c.id));

  return (
    <div className="border-t border-ink-200 bg-ink-50/40">
      <div className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-ink-500">
          Crew toevoegen voor deze show.
          {" "}
          <span className="font-semibold text-ink-700">{available.length}</span> beschikbaar in artist defaults
          {artistCrewPool.length > available.length && (
            <span className="text-ink-400"> ({alreadyAddedArtistCrewIds.size} al toegevoegd)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={available.length === 0}
            onClick={() => setMode(mode === "pool" ? "closed" : "pool")}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition ${
              mode === "pool" ? "bg-ink-100 text-ink-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {mode === "pool" ? "Sluit lijst" : `+ Uit artist defaults (${available.length})`}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "adhoc" ? "closed" : "adhoc")}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition ${
              mode === "adhoc" ? "bg-ink-100 text-ink-700" : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-100"
            }`}
          >
            {mode === "adhoc" ? "Annuleer" : "+ Eenmalig (alleen deze show)"}
          </button>
        </div>
      </div>

      {mode === "pool" && (
        <PoolPicker bookingId={bookingId} advancingId={advancingId} available={available} />
      )}

      {mode === "adhoc" && (
        <AdhocForm bookingId={bookingId} advancingId={advancingId} onDone={() => setMode("closed")} />
      )}
    </div>
  );
}

function PoolPicker({
  bookingId,
  advancingId,
  available,
}: {
  bookingId: string;
  advancingId: string;
  available: ArtistCrew[];
}) {
  const [pending, start] = useTransition();
  const [pickingId, setPickingId] = useState<string | null>(null);

  function pick(member: ArtistCrew) {
    setPickingId(member.id);
    start(async () => {
      await addBookingCrewAction(bookingId, advancingId, {
        artist_crew_id: member.id,
        role: member.role,
        name: member.name,
        is_traveling: true,
        needs_flight: true,
      });
      setPickingId(null);
    });
  }

  if (available.length === 0) {
    return (
      <div className="px-5 pb-4 text-xs text-ink-500">
        Alle artist-defaults zijn al toegevoegd. Voeg via "Artist defaults" page nieuwe vaste crew toe, of gebruik "+ Eenmalig".
      </div>
    );
  }

  return (
    <div className="px-5 pb-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {available.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              disabled={pending}
              onClick={() => pick(m)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-ink-200 hover:border-emerald-400 hover:shadow-sm transition disabled:opacity-50 ${
                pickingId === m.id ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <span className="text-[10px] font-bold uppercase bg-ink-900 text-white px-1.5 py-0.5 rounded w-10 text-center flex-shrink-0">{m.role.toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-ink-900 block truncate">{m.name}</span>
                <span className="text-[10px] text-ink-500 block truncate">{CREW_ROLE_LABELS[m.role]}{m.is_default && " · default"}</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 flex-shrink-0">+</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdhocForm({ bookingId, advancingId, onDone }: { bookingId: string; advancingId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      role: String(fd.get("role") || "tm") as CrewRole,
      name: String(fd.get("name") || "").trim(),
      is_traveling: true,
      needs_flight: fd.get("needs_flight") === "on",
    };
    start(async () => {
      const r = await addBookingCrewAction(bookingId, advancingId, payload);
      if (r && !r.ok) { setErr(r.error ?? "Toevoegen mislukt"); return; }
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="px-5 pb-4 space-y-3">
      <p className="text-[11px] text-ink-500">
        Eenmalig crew lid (bv. freelance FOH). Komt niet in artist defaults, alleen in deze touring party.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Rol *</span>
          <select name="role" required defaultValue="tm" className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none">
            {ROLES.map((r) => <option key={r} value={r}>{r.toUpperCase()} - {CREW_ROLE_LABELS[r]}</option>)}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Naam *</span>
          <input name="name" required placeholder="Voor- en achternaam" className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="needs_flight" defaultChecked className="rounded" />
        Heeft een vlucht nodig
      </label>
      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50">
          {pending ? "Bezig..." : "Voeg toe"}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Flights overview - geboekte vluchten voor dit advancing
// ============================================================================

function FlightsBlock({
  advancingId,
  crew,
  flights,
  editing,
}: {
  advancingId: string;
  crew: BookingCrew[];
  flights: FlightInfo[];
  editing: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const crewNames = useMemo(() => new Set(crew.filter((c) => c.is_traveling).map((c) => c.name)), [crew]);
  const inbound = flights.filter((f) => f.direction === "inbound");
  const outbound = flights.filter((f) => f.direction === "outbound");

  return (
    <div className="border-t border-ink-200">
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-ink-900 text-sm">Vluchtoverzicht</h4>
          <p className="text-xs text-ink-500 mt-0.5 tabular-nums">
            {inbound.length} inbound · {outbound.length} outbound · {flights.reduce((s, f) => s + f.passengers.length, 0)} passenger seat{flights.reduce((s, f) => s + f.passengers.length, 0) === 1 ? "" : "s"}
          </p>
        </div>
        {editing && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white font-semibold hover:bg-black transition"
          >
            {adding ? "Annuleer" : "+ Vlucht toevoegen"}
          </button>
        )}
      </div>

      {flights.length === 0 && !adding && (
        <div className="px-5 pb-5 text-xs text-ink-500">
          Geen vluchten geboekt voor deze show. {editing ? "Klik op 'Vlucht toevoegen' om een vlucht in te voeren." : "Klik 'Crew bewerken' om vluchten toe te voegen."}
        </div>
      )}

      {flights.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50/60">
                <th className="px-5 py-2.5 font-semibold">Richting</th>
                <th className="px-5 py-2.5 font-semibold">Vlucht</th>
                <th className="px-5 py-2.5 font-semibold">Route</th>
                <th className="px-5 py-2.5 font-semibold">Vertrek</th>
                <th className="px-5 py-2.5 font-semibold">Aankomst</th>
                <th className="px-5 py-2.5 font-semibold">Passagiers</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                {editing && <th className="px-5 py-2.5 font-semibold" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {[...inbound, ...outbound].map((f) => (
                <FlightRow key={f.id} flight={f} advancingId={advancingId} crewNames={crewNames} editing={editing} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <AddFlightForm
          advancingId={advancingId}
          crew={crew}
          onDone={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function FlightRow({ flight, advancingId, crewNames, editing }: { flight: FlightInfo; advancingId: string; crewNames: Set<string>; editing: boolean }) {
  const [pending, start] = useTransition();
  return (
    <tr className={`hover:bg-ink-50 transition-colors ${pending ? "opacity-50" : ""}`}>
      <td className="px-5 py-2.5">
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
          flight.direction === "inbound" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"
        }`}>
          {flight.direction === "inbound" ? "in" : "uit"}
        </span>
      </td>
      <td className="px-5 py-2.5 font-mono text-xs text-ink-900">
        <div>{flight.airline} {flight.flight_number}</div>
        {flight.booking_reference && (
          <div className="text-[10px] text-ink-500 mt-0.5">PNR: <span className="font-bold text-ink-900">{flight.booking_reference}</span></div>
        )}
      </td>
      <td className="px-5 py-2.5 text-xs text-ink-700 whitespace-nowrap">
        {flight.departure_airport} → {flight.arrival_airport}
      </td>
      <td className="px-5 py-2.5 text-xs text-ink-700 tabular-nums whitespace-nowrap">
        {fmtDate(flight.departure_datetime)}
      </td>
      <td className="px-5 py-2.5 text-xs text-ink-700 tabular-nums whitespace-nowrap">
        {fmtDate(flight.arrival_datetime)}
      </td>
      <td className="px-5 py-2.5 text-xs">
        <div className="flex flex-wrap gap-1 max-w-xs">
          {flight.passengers.length === 0 ? (
            <span className="text-ink-400">-</span>
          ) : (
            flight.passengers.map((p, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  crewNames.has(p) ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-700"
                }`}
                title={crewNames.has(p) ? "Crew lid" : "Niet gekoppeld aan crew"}
              >
                {p}
              </span>
            ))
          )}
        </div>
        {flight.notes && <div className="text-[10px] text-ink-500 mt-1 italic">{flight.notes}</div>}
      </td>
      <td className="px-5 py-2.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${flightStatusTone[flight.status ?? "pending"] ?? flightStatusTone["n/a"]}`}>
          {flight.status ?? "pending"}
        </span>
      </td>
      {editing && (
        <td className="px-5 py-2.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Vlucht ${flight.airline} ${flight.flight_number} verwijderen?`)) return;
              start(async () => { await removeAdvancingFlightAction(advancingId, flight.id); });
            }}
            className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
          >
            Verwijder
          </button>
        </td>
      )}
    </tr>
  );
}

function AddFlightForm({
  advancingId,
  crew,
  onDone,
}: {
  advancingId: string;
  crew: BookingCrew[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [selectedPax, setSelectedPax] = useState<Set<string>>(new Set());

  function togglePax(name: string) {
    setSelectedPax((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const passengersExtra = String(fd.get("passengers_extra") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const passengers = [...selectedPax, ...passengersExtra];

    start(async () => {
      const result = await addAdvancingFlightAction(advancingId, {
        direction: String(fd.get("direction") || "inbound") as "inbound" | "outbound",
        flight_number: String(fd.get("flight_number") || ""),
        airline: String(fd.get("airline") || ""),
        departure_airport: String(fd.get("departure_airport") || ""),
        arrival_airport: String(fd.get("arrival_airport") || ""),
        departure_datetime: String(fd.get("departure_datetime") || ""),
        arrival_datetime: String(fd.get("arrival_datetime") || ""),
        passengers,
        booking_reference: String(fd.get("booking_reference") || "").trim() || undefined,
        notes: String(fd.get("notes") || "").trim() || undefined,
        status: (String(fd.get("status") || "pending") as "pending" | "booked" | "confirmed"),
      });
      if (result && !result.ok) setErr("Vlucht toevoegen mislukt");
      else {
        setSelectedPax(new Set());
        onDone();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="px-5 py-4 bg-ink-50/40 border-t border-ink-200 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Richting">
          <select name="direction" required className={inputCls}>
            <option value="inbound">inbound (heen)</option>
            <option value="outbound">outbound (terug)</option>
          </select>
        </Field>
        <Field label="Airline">
          <input name="airline" placeholder="KLM" required className={inputCls} />
        </Field>
        <Field label="Vluchtnummer">
          <input name="flight_number" placeholder="KL1208" required className={inputCls} />
        </Field>
        <Field label="Vertrek vliegveld">
          <input name="departure_airport" placeholder="LAX" required className={inputCls} />
        </Field>
        <Field label="Aankomst vliegveld">
          <input name="arrival_airport" placeholder="AMS" required className={inputCls} />
        </Field>
        <Field label="Status">
          <select name="status" className={inputCls} defaultValue="pending">
            <option value="pending">pending</option>
            <option value="booked">booked</option>
            <option value="confirmed">confirmed</option>
          </select>
        </Field>
        <Field label="Vertrek datum + tijd">
          <input name="departure_datetime" type="datetime-local" required className={inputCls} />
        </Field>
        <Field label="Aankomst datum + tijd">
          <input name="arrival_datetime" type="datetime-local" required className={inputCls} />
        </Field>
        <Field label="Booking reference / PNR">
          <input name="booking_reference" placeholder="bv. ABC123" className={inputCls} />
        </Field>
        <Field label="Notitie">
          <input name="notes" placeholder="Bagage, stoelen, ..." className={inputCls} />
        </Field>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-ink-700">Passagiers uit crew (klik om toe te voegen)</label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {crew.filter((c) => c.is_traveling).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => togglePax(c.name)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                selectedPax.has(c.name)
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-ink-200 text-ink-700 hover:border-emerald-400"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          name="passengers_extra"
          placeholder="Extra passagiers (komma-gescheiden)"
          className={`${inputCls} mt-2`}
        />
      </div>

      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-2 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50"
        >
          {pending ? "Bezig..." : "Vlucht opslaan"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-2 rounded-md border border-ink-200 text-ink-700 text-xs font-semibold hover:bg-ink-100 transition"
        >
          Annuleer
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-xs focus:border-brand-500 focus:outline-none";

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
