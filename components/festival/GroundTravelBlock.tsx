"use client";

import { useState, useTransition } from "react";
import {
  addGroundTransferAction,
  updateGroundTransferAction,
  removeGroundTransferAction,
} from "@/lib/actions";
import type { FlightInfo, GroundTransfer, GroundTransferType } from "@/lib/types";

const TRANSFER_TYPES: { value: GroundTransferType; label: string }[] = [
  { value: "airport_to_hotel", label: "Airport → Hotel" },
  { value: "hotel_to_venue",   label: "Hotel → Venue" },
  { value: "venue_to_hotel",   label: "Venue → Hotel" },
  { value: "hotel_to_airport", label: "Hotel → Airport" },
  { value: "other",            label: "Anders" },
];

const TYPE_LABEL = new Map(TRANSFER_TYPES.map((t) => [t.value, t.label]));

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-ink-100 text-ink-500",
};

function fmtDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  const TZ = "Europe/Amsterdam";
  return `${d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", timeZone: TZ })} ${d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}`;
}
function fmtDateTimeLocal(iso?: string) {
  if (!iso) return "";
  // YYYY-MM-DDTHH:MM voor datetime-local input
  const d = new Date(iso);
  const off = -d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() + off).toISOString().slice(0, 16);
}

export default function GroundTravelBlock({
  token,
  flights,
  transfers,
  showDate,
}: {
  token: string;
  flights: FlightInfo[];
  transfers: GroundTransfer[];
  showDate: string;
}) {
  const [adding, setAdding] = useState<GroundTransferType | null>(null);
  const [linkedFlightId, setLinkedFlightId] = useState<string | undefined>(undefined);

  // Sorteer flights chronologisch
  const sortedFlights = [...flights].sort((a, b) => a.departure_datetime.localeCompare(b.departure_datetime));
  const sortedTransfers = [...transfers].sort((a, b) => (a.pickup_datetime ?? "").localeCompare(b.pickup_datetime ?? ""));

  // Per vlucht: vind gerelateerde transfers
  const transfersForFlight = (flightId: string) =>
    sortedTransfers.filter((t) => t.linked_flight_id === flightId);

  // Transfers zonder flight-link (hotel↔venue meestal)
  const nonFlightTransfers = sortedTransfers.filter((t) => !t.linked_flight_id);

  function openAdd(type: GroundTransferType, flightId?: string) {
    setAdding(type);
    setLinkedFlightId(flightId);
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-ink-900">Ground travel schema</h3>
            <p className="text-xs text-ink-500 mt-1">
              Vluchten die management heeft geboekt staan hieronder. Vul per vlucht de ground travel in (pickup-tijd, voertuig, chauffeur) zodat het totaal travel-schema klopt.
            </p>
          </div>
        </div>
      </header>

      {sortedFlights.length === 0 && nonFlightTransfers.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-ink-500">
          Nog geen vluchten geboekt. Zodra management vluchten toevoegt, kun je hier per vlucht ground travel inplannen.
        </div>
      ) : (
        <div className="divide-y divide-ink-200">
          {sortedFlights.map((f) => (
            <FlightBlock
              key={f.id}
              flight={f}
              transfers={transfersForFlight(f.id)}
              onAdd={(type) => openAdd(type, f.id)}
              token={token}
            />
          ))}
        </div>
      )}

      {/* Hotel ↔ Venue transfers (niet aan een vlucht gekoppeld) */}
      <div className="border-t border-ink-200 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-bold text-ink-900">Hotel ↔ Venue</h4>
            <p className="text-[11px] text-ink-500 mt-0.5">Niet aan vlucht gekoppeld. Bv. showtime pickup of after-show return.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openAdd("hotel_to_venue")}
              className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
            >
              + Hotel → Venue
            </button>
            <button
              type="button"
              onClick={() => openAdd("venue_to_hotel")}
              className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
            >
              + Venue → Hotel
            </button>
          </div>
        </div>
        {nonFlightTransfers.length === 0 ? (
          <p className="text-xs text-ink-400">Nog niet ingepland.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {nonFlightTransfers.map((t) => (
              <TransferRow key={t.id} transfer={t} token={token} />
            ))}
          </ul>
        )}
      </div>

      {adding && (
        <TransferForm
          token={token}
          type={adding}
          linkedFlightId={linkedFlightId}
          flights={sortedFlights}
          showDate={showDate}
          onDone={() => { setAdding(null); setLinkedFlightId(undefined); }}
        />
      )}
    </section>
  );
}

function FlightBlock({
  flight,
  transfers,
  onAdd,
  token,
}: {
  flight: FlightInfo;
  transfers: GroundTransfer[];
  onAdd: (type: GroundTransferType) => void;
  token: string;
}) {
  const isInbound = flight.direction === "inbound";
  const nextType: GroundTransferType = isInbound ? "airport_to_hotel" : "hotel_to_airport";
  const hasNext = transfers.some((t) => t.transfer_type === nextType);

  return (
    <div className="px-5 py-4">
      {/* Flight summary */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
            isInbound ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"
          }`}>
            {isInbound ? "Inbound" : "Outbound"}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-ink-900 text-sm">{flight.airline} {flight.flight_number}</div>
            <div className="text-xs text-ink-500 mt-0.5">
              <span className="font-semibold text-ink-700">{flight.departure_airport} → {flight.arrival_airport}</span>
              <span className="ml-2">aankomst <span className="font-bold text-ink-900 tabular-nums">{fmtDateTime(flight.arrival_datetime)}</span></span>
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5">
              {flight.passengers.length} pax: <span className="text-ink-700">{flight.passengers.join(", ")}</span>
              {flight.booking_reference && <span className="ml-2 font-mono text-[10px]">· PNR {flight.booking_reference}</span>}
            </div>
          </div>
        </div>
        {!hasNext && (
          <button
            type="button"
            onClick={() => onAdd(nextType)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition whitespace-nowrap"
          >
            + {isInbound ? "Airport → Hotel" : "Hotel → Airport"}
          </button>
        )}
      </div>

      {/* Transfers gekoppeld aan deze vlucht */}
      {transfers.length > 0 && (
        <ul className="mt-3 space-y-2">
          {transfers.map((t) => (
            <TransferRow key={t.id} transfer={t} token={token} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TransferRow({ transfer, token }: { transfer: GroundTransfer; token: string }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li>
        <TransferForm
          token={token}
          type={transfer.transfer_type}
          linkedFlightId={transfer.linked_flight_id}
          existing={transfer}
          flights={[]}
          showDate={transfer.pickup_datetime ?? new Date().toISOString()}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className={`rounded-lg border border-ink-200 px-3 py-2 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase bg-ink-100 text-ink-700 px-1.5 py-0.5 rounded">{TYPE_LABEL.get(transfer.transfer_type)}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_TONE[transfer.status]}`}>{transfer.status}</span>
          </div>
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <div>
              <span className="text-ink-400">Pickup:</span>{" "}
              <span className="text-ink-900 font-semibold tabular-nums">{fmtDateTime(transfer.pickup_datetime)}</span>
              {transfer.pickup_location && <span className="text-ink-500"> · {transfer.pickup_location}</span>}
            </div>
            <div>
              <span className="text-ink-400">Dropoff:</span>{" "}
              <span className="text-ink-900 font-semibold tabular-nums">{fmtDateTime(transfer.dropoff_datetime)}</span>
              {transfer.dropoff_location && <span className="text-ink-500"> · {transfer.dropoff_location}</span>}
            </div>
            {(transfer.vehicle_type || transfer.vehicle_capacity) && (
              <div className="text-ink-700">
                <span className="text-ink-400">Voertuig:</span>{" "}
                {transfer.vehicle_type}
                {transfer.vehicle_capacity && <span className="text-ink-500"> ({transfer.vehicle_capacity} pax)</span>}
              </div>
            )}
            {transfer.driver_name && (
              <div className="text-ink-700">
                <span className="text-ink-400">Driver:</span>{" "}
                {transfer.driver_name}
                {transfer.driver_phone && <span className="text-ink-500"> · {transfer.driver_phone}</span>}
                {transfer.driver_company && <span className="text-ink-500"> · {transfer.driver_company}</span>}
              </div>
            )}
          </div>
          {transfer.passengers && transfer.passengers.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {transfer.passengers.map((p, i) => (
                <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">{p}</span>
              ))}
            </div>
          )}
          {transfer.notes && <div className="text-[11px] text-ink-500 italic mt-1">{transfer.notes}</div>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] font-semibold text-ink-700 hover:text-ink-900 hover:underline"
          >
            Bewerk
          </button>
          <span className="text-ink-300">·</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Transfer verwijderen?")) return;
              start(async () => { await removeGroundTransferAction({ id: transfer.id, token }); });
            }}
            className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
          >
            Verwijder
          </button>
        </div>
      </div>
    </li>
  );
}

function TransferForm({
  token,
  type,
  linkedFlightId,
  existing,
  flights,
  showDate,
  onDone,
}: {
  token: string;
  type: GroundTransferType;
  linkedFlightId?: string;
  existing?: GroundTransfer;
  flights: FlightInfo[];
  showDate: string;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [paxText, setPaxText] = useState(existing?.passengers?.join(", ") ?? "");

  const flight = linkedFlightId ? flights.find((f) => f.id === linkedFlightId) : null;
  const defaultPickup = existing?.pickup_datetime
    ?? (flight && (type === "airport_to_hotel")
          ? new Date(new Date(flight.arrival_datetime).getTime() + 45 * 60000).toISOString()
          : `${showDate}T16:00:00`);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const pickupLocal = String(fd.get("pickup_datetime") || "");
    const dropoffLocal = String(fd.get("dropoff_datetime") || "");
    const payload = {
      transfer_type: type,
      linked_flight_id: linkedFlightId,
      pickup_datetime: pickupLocal ? new Date(pickupLocal).toISOString() : undefined,
      dropoff_datetime: dropoffLocal ? new Date(dropoffLocal).toISOString() : undefined,
      pickup_location: String(fd.get("pickup_location") || "").trim() || undefined,
      dropoff_location: String(fd.get("dropoff_location") || "").trim() || undefined,
      vehicle_type: String(fd.get("vehicle_type") || "").trim() || undefined,
      vehicle_capacity: fd.get("vehicle_capacity") ? Number(fd.get("vehicle_capacity")) : undefined,
      driver_name: String(fd.get("driver_name") || "").trim() || undefined,
      driver_phone: String(fd.get("driver_phone") || "").trim() || undefined,
      driver_company: String(fd.get("driver_company") || "").trim() || undefined,
      passengers: paxText.split(",").map((s) => s.trim()).filter(Boolean),
      status: String(fd.get("status") || "pending") as any,
      notes: String(fd.get("notes") || "").trim() || undefined,
      created_by_role: "festival",
    };

    start(async () => {
      if (existing) {
        const r = await updateGroundTransferAction({ id: existing.id, token, patch: payload });
        if (r && !r.ok) { setErr(r.error ?? "Update mislukt"); return; }
      } else {
        const r = await addGroundTransferAction({ token, payload });
        if (r && !r.ok) { setErr(r.error ?? "Toevoegen mislukt"); return; }
      }
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="border border-emerald-100 bg-emerald-50/40 rounded-lg p-4 space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
        {existing ? "Bewerk" : "Nieuw"} - {TYPE_LABEL.get(type)}
        {flight && <span className="text-emerald-600 font-normal normal-case ml-2">(gekoppeld aan {flight.airline} {flight.flight_number})</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Pickup tijd">
          <input name="pickup_datetime" type="datetime-local" defaultValue={fmtDateTimeLocal(defaultPickup)} className={cls} />
        </Field>
        <Field label="Pickup locatie">
          <input name="pickup_location" defaultValue={existing?.pickup_location ?? (flight && type === "airport_to_hotel" ? flight.arrival_airport : "")} placeholder="Schiphol terminal 3" className={cls} />
        </Field>
        <Field label="Dropoff tijd">
          <input name="dropoff_datetime" type="datetime-local" defaultValue={fmtDateTimeLocal(existing?.dropoff_datetime)} className={cls} />
        </Field>
        <Field label="Dropoff locatie">
          <input name="dropoff_location" defaultValue={existing?.dropoff_location ?? ""} placeholder="Sir Adam Hotel" className={cls} />
        </Field>

        <Field label="Voertuig">
          <input name="vehicle_type" defaultValue={existing?.vehicle_type ?? ""} placeholder="Mercedes V-class, sprinter, ..." className={cls} />
        </Field>
        <Field label="Capaciteit">
          <input name="vehicle_capacity" type="number" min="1" defaultValue={existing?.vehicle_capacity ?? ""} placeholder="6" className={cls} />
        </Field>

        <Field label="Chauffeur naam">
          <input name="driver_name" defaultValue={existing?.driver_name ?? ""} placeholder="Naam chauffeur" className={cls} />
        </Field>
        <Field label="Chauffeur telefoon">
          <input name="driver_phone" defaultValue={existing?.driver_phone ?? ""} placeholder="+31 6 ..." className={cls} />
        </Field>

        <Field label="Chauffeur company">
          <input name="driver_company" defaultValue={existing?.driver_company ?? ""} placeholder="VIP Transport BV" className={cls} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={existing?.status ?? "pending"} className={cls}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      </div>

      <Field label="Passagiers (komma-gescheiden)">
        <input value={paxText} onChange={(e) => setPaxText(e.target.value)} placeholder={flight ? flight.passengers.join(", ") : "Robbert van de Corput, Sven, FOH"} className={cls} />
        {flight && flight.passengers.length > 0 && !paxText && (
          <button type="button" onClick={() => setPaxText(flight.passengers.join(", "))} className="text-[10px] text-emerald-700 hover:underline mt-1">
            Vul passagiers van vlucht ({flight.passengers.length})
          </button>
        )}
      </Field>

      <Field label="Notitie">
        <input name="notes" defaultValue={existing?.notes ?? ""} placeholder="Bijzonderheden, bagage, etc." className={cls} />
      </Field>

      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
          {pending ? "Bezig..." : (existing ? "Update transfer" : "Voeg toe")}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const cls = "w-full bg-white border border-emerald-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300";
