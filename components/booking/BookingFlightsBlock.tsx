"use client";

import { useState, useTransition } from "react";
import { addBookingFlightAction, removeBookingFlightAction, updateBookingFlightAction } from "@/lib/actions";
import type { FlightInfo } from "@/lib/types";

export default function BookingFlightsBlock({
  bookingId,
  isConfirmed,
  flights,
}: {
  bookingId: string;
  isConfirmed: boolean;
  flights: FlightInfo[];
}) {
  const [adding, setAdding] = useState(false);

  if (!isConfirmed) {
    return (
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
          <h3 className="font-bold text-ink-900 text-sm">Vluchten</h3>
        </header>
        <div className="p-5 text-xs text-ink-500 italic">
          Bevestig de booking eerst om vluchten toe te voegen. Eenmaal toegevoegd zijn ze ook zichtbaar voor het advancing-team en op de kalender.
        </div>
      </section>
    );
  }

  const totalCost = flights.reduce((s, f) => s + (f.cost_amount ?? 0), 0);
  const totalRecharge = flights.filter((f) => f.recharge_to_buyer).reduce((s, f) => s + (f.cost_amount ?? 0), 0);

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink-900 text-sm">Vluchten</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Toegevoegde vluchten zijn meteen zichtbaar voor het advancing-team en op de kalender.</p>
        </div>
        {totalCost > 0 && (
          <div className="text-[11px] text-ink-600">
            <span className="tabular-nums">€ {totalCost.toLocaleString("nl-NL")} totaal</span>
            {totalRecharge > 0 && <span className="ml-2 text-emerald-700 font-semibold tabular-nums">€ {totalRecharge.toLocaleString("nl-NL")} doorbelast</span>}
          </div>
        )}
      </header>
      <div className="p-5 space-y-3">
        {flights.length === 0 && !adding && <div className="text-xs text-ink-500 italic">Nog geen vluchten toegevoegd.</div>}
        {flights.map((f) => <FlightRow key={f.id} flight={f} bookingId={bookingId} />)}
        {adding ? (
          <AddForm bookingId={bookingId} onClose={() => setAdding(false)} />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="text-xs font-semibold text-brand-600 hover:underline">+ Vlucht toevoegen</button>
        )}
      </div>
    </section>
  );
}

function FlightRow({ flight, bookingId }: { flight: FlightInfo; bookingId: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [costAmount, setCostAmount] = useState(flight.cost_amount?.toString() ?? "");
  const [paidBy, setPaidBy] = useState(flight.paid_by ?? "agency");
  const [recharge, setRecharge] = useState(!!flight.recharge_to_buyer);

  function saveCommercial() {
    start(async () => {
      await updateBookingFlightAction(bookingId, flight.id, {
        cost_amount: costAmount.trim() ? Number(costAmount) : null,
        paid_by: paidBy,
        recharge_to_buyer: recharge,
      });
      setEditing(false);
    });
  }

  function remove() {
    if (!confirm(`Verwijder vlucht ${flight.flight_number}?`)) return;
    start(async () => {
      await removeBookingFlightAction(bookingId, flight.id);
    });
  }

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${flight.direction === "inbound" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {flight.direction === "inbound" ? "Inbound" : "Outbound"}
            </span>
            <span className="font-semibold text-ink-900">{flight.airline} {flight.flight_number}</span>
            <span className="text-xs text-ink-500">{flight.departure_airport} → {flight.arrival_airport}</span>
          </div>
          <div className="text-[11px] text-ink-500 mt-1 tabular-nums">
            Vertrek {new Date(flight.departure_datetime).toLocaleString("nl-NL")} · Aankomst {new Date(flight.arrival_datetime).toLocaleString("nl-NL")}
          </div>
          {flight.passengers.length > 0 && (
            <div className="text-[11px] text-ink-500 mt-0.5">Passagiers: {flight.passengers.join(", ")}</div>
          )}
          {flight.booking_reference && <div className="text-[11px] text-ink-500 mt-0.5">PNR: {flight.booking_reference}</div>}
        </div>
        <button type="button" onClick={remove} disabled={pending} className="p-1.5 rounded text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
        </button>
      </div>
      {editing ? (
        <div className="mt-2 pt-2 border-t border-ink-200 grid grid-cols-1 md:grid-cols-3 gap-2">
          <label className="block">
            <span className="text-[10px] font-semibold text-ink-700 mb-0.5 block">Kosten (EUR)</span>
            <input type="number" step="0.01" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold text-ink-700 mb-0.5 block">Betaald door</span>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as "agency" | "promoter" | "artist")} className={inputCls}>
              <option value="agency">Agency</option>
              <option value="promoter">Promoter</option>
              <option value="artist">Artist</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-700 mt-5">
            <input type="checkbox" checked={recharge} onChange={(e) => setRecharge(e.target.checked)} />
            Doorbelasten aan buyer
          </label>
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
            <button type="button" onClick={saveCommercial} disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">{pending ? "..." : "Opslaan"}</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 pt-2 border-t border-ink-200 flex items-center justify-between text-[11px] text-ink-600">
          <div className="flex items-center gap-3 flex-wrap">
            {flight.cost_amount != null && <span className="tabular-nums font-semibold">€ {flight.cost_amount.toLocaleString("nl-NL")}</span>}
            {flight.paid_by && <span>betaald door <span className="font-semibold">{flight.paid_by}</span></span>}
            {flight.recharge_to_buyer && <span className="text-emerald-700 font-semibold">↪ doorbelast</span>}
          </div>
          <button type="button" onClick={() => setEditing(true)} className="text-brand-600 hover:underline">commercieel bewerken</button>
        </div>
      )}
    </div>
  );
}

function AddForm({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [airline, setAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [depAp, setDepAp] = useState("");
  const [arrAp, setArrAp] = useState("");
  const [dep, setDep] = useState("");
  const [arr, setArr] = useState("");
  const [passengers, setPassengers] = useState("");
  const [pnr, setPnr] = useState("");
  const [cost, setCost] = useState("");
  const [paidBy, setPaidBy] = useState<"agency" | "promoter" | "artist">("agency");
  const [recharge, setRecharge] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!airline || !flightNumber || !depAp || !arrAp || !dep || !arr) {
      setError("Vul minimaal airline, flight#, beide airports en beide tijden in.");
      return;
    }
    start(async () => {
      const result = await addBookingFlightAction(bookingId, {
        direction,
        flight_number: flightNumber,
        airline,
        departure_airport: depAp.toUpperCase(),
        arrival_airport: arrAp.toUpperCase(),
        departure_datetime: new Date(dep).toISOString(),
        arrival_datetime: new Date(arr).toISOString(),
        passengers: passengers.split(",").map((s) => s.trim()).filter(Boolean),
        booking_reference: pnr.trim() || undefined,
        cost_amount: cost.trim() ? Number(cost) : null,
        paid_by: paidBy,
        recharge_to_buyer: recharge,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="bg-brand-50 border-2 border-dashed border-brand-300 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select value={direction} onChange={(e) => setDirection(e.target.value as "inbound" | "outbound")} className={inputCls}>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <input value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Airline (bv. KLM)" className={inputCls} />
        <input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="Flight # (bv. KL1234)" className={inputCls} />
        <input value={depAp} onChange={(e) => setDepAp(e.target.value)} placeholder="From (AMS)" className={inputCls} />
        <input value={arrAp} onChange={(e) => setArrAp(e.target.value)} placeholder="To (BCN)" className={inputCls} />
        <input value={pnr} onChange={(e) => setPnr(e.target.value)} placeholder="PNR" className={inputCls} />
        <label className="block">
          <span className="text-[10px] font-semibold text-ink-700 block">Vertrek</span>
          <input type="datetime-local" value={dep} onChange={(e) => setDep(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold text-ink-700 block">Aankomst</span>
          <input type="datetime-local" value={arr} onChange={(e) => setArr(e.target.value)} className={inputCls} />
        </label>
        <input value={passengers} onChange={(e) => setPassengers(e.target.value)} placeholder="Passagiers (comma)" className={inputCls} />
        <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Kosten EUR" className={inputCls} />
        <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as "agency" | "promoter" | "artist")} className={inputCls}>
          <option value="agency">Betaald door agency</option>
          <option value="promoter">Betaald door promoter</option>
          <option value="artist">Betaald door artist</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-ink-700 mt-1">
          <input type="checkbox" checked={recharge} onChange={(e) => setRecharge(e.target.checked)} />
          Doorbelasten aan buyer
        </label>
      </div>
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">{pending ? "..." : "Vlucht toevoegen"}</button>
      </div>
    </form>
  );
}

const inputCls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
