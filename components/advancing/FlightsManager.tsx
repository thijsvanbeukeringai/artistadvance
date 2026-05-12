"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAdvancingFlightAction, removeAdvancingFlightAction } from "@/lib/actions";
import type { FlightInfo } from "@/lib/types";
import { todayAmsterdamIso } from "@/lib/datetime";

const TZ = "Europe/Amsterdam";
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short", timeZone: TZ });

export default function FlightsManager({
  advancingId,
  flights,
  showDate,
}: {
  advancingId: string;
  flights: FlightInfo[];
  showDate?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
        <div>
          <h4 className="font-bold text-ink-900">Vluchten ({flights.length})</h4>
          <p className="text-[11px] text-ink-500 mt-0.5">Inbound + outbound. Klik onderaan om een vlucht toe te voegen.</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black inline-flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            Vlucht toevoegen
          </button>
        )}
      </header>

      {flights.length === 0 && !open ? (
        <div className="px-5 py-8 text-sm text-ink-400">Nog geen vluchten geregistreerd.</div>
      ) : (
        <ul className="divide-y divide-ink-200">
          {flights.map((f) => (
            <FlightRow key={f.id} flight={f} advancingId={advancingId} />
          ))}
        </ul>
      )}

      {open && (
        <div className="border-t border-ink-200 px-5 py-4 bg-ink-50/50">
          <AddForm advancingId={advancingId} showDate={showDate} onDone={() => setOpen(false)} />
        </div>
      )}
    </section>
  );
}

function FlightRow({ flight, advancingId }: { flight: FlightInfo; advancingId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm(`Vlucht ${flight.airline} ${flight.flight_number} verwijderen?`)) return;
    start(async () => {
      await removeAdvancingFlightAction(advancingId, flight.id);
      router.refresh();
    });
  }

  return (
    <li className="px-5 py-4 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
            {flight.direction}
          </span>
          <span className="font-bold text-ink-900">{flight.airline} {flight.flight_number}</span>
          {flight.booking_reference && <span className="text-[11px] text-ink-500">PNR {flight.booking_reference}</span>}
        </div>
        <div className="text-xs text-ink-500 mt-0.5 tabular-nums">
          {flight.departure_airport} {fmtDateTime(flight.departure_datetime)} → {flight.arrival_airport} {fmtDateTime(flight.arrival_datetime)}
        </div>
        {flight.passengers.length > 0 && (
          <div className="text-[11px] text-ink-500 mt-0.5">Passagiers: {flight.passengers.join(", ")}</div>
        )}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded disabled:opacity-50"
      >
        {pending ? "..." : "Verwijder"}
      </button>
    </li>
  );
}

function AddForm({ advancingId, showDate, onDone }: { advancingId: string; showDate?: string; onDone: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        const res = await addAdvancingFlightAction(advancingId, {
          direction: String(fd.get("direction")) as "inbound" | "outbound",
          flight_number: String(fd.get("flight_number") || "").trim(),
          airline: String(fd.get("airline") || "").trim(),
          departure_airport: String(fd.get("dep_ap") || "").trim().toUpperCase(),
          arrival_airport: String(fd.get("arr_ap") || "").trim().toUpperCase(),
          departure_datetime: new Date(String(fd.get("dep") || "")).toISOString(),
          arrival_datetime: new Date(String(fd.get("arr") || "")).toISOString(),
          passengers: String(fd.get("passengers") || "").split(",").map((s) => s.trim()).filter(Boolean),
          booking_reference: String(fd.get("pnr") || "").trim() || undefined,
        });
        if ("ok" in res && !res.ok) {
          setError(res.error);
          return;
        }
        onDone();
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const defaultDate = showDate ?? todayAmsterdamIso();

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select name="direction" defaultValue="inbound" className={cls}>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <input name="airline" placeholder="Airline (KLM)" className={cls} required />
        <input name="flight_number" placeholder="Flight # (KL1234)" className={cls} required />
        <input name="pnr" placeholder="PNR (optioneel)" className={cls} />
        <input name="dep_ap" placeholder="From (AMS)" className={cls} required />
        <input name="arr_ap" placeholder="To (BCN)" className={cls} required />
        <label className="block">
          <span className="text-[10px] font-semibold text-ink-700 block">Vertrek</span>
          <input type="datetime-local" name="dep" defaultValue={`${defaultDate}T08:00`} className={cls} required />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold text-ink-700 block">Aankomst</span>
          <input type="datetime-local" name="arr" defaultValue={`${defaultDate}T10:00`} className={cls} required />
        </label>
        <input name="passengers" placeholder="Passagiers (komma-gescheiden)" className={`${cls} md:col-span-2`} />
      </div>
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">
          {pending ? "..." : "Vlucht toevoegen"}
        </button>
      </div>
    </form>
  );
}

const cls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm bg-white focus:border-brand-500 focus:outline-none";
