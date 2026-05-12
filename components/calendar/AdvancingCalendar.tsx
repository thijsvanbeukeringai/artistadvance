"use client";

import { useState, useTransition } from "react";
import MonthCalendar, { type CalEvent } from "./MonthCalendar";
import { addAdvancingFlightAction, addTimelineEventAction } from "@/lib/actions";

type Mode = "menu" | "flight" | "timeline";

const TIMELINE_TYPES = [
  { v: "load_in", l: "Load-in" },
  { v: "setup", l: "Set-up" },
  { v: "soundcheck", l: "Soundcheck" },
  { v: "programming_led", l: "LED programming" },
  { v: "programming_laser", l: "Laser programming" },
  { v: "programming_video", l: "Video programming" },
  { v: "booth_time", l: "Booth time" },
  { v: "show", l: "Show" },
  { v: "load_out", l: "Load-out" },
  { v: "departure", l: "Departure" },
];

export default function AdvancingCalendar({
  events,
  advancingId,
  emptyHint,
}: {
  events: CalEvent[];
  advancingId: string;
  emptyHint?: string;
}) {
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("menu");

  function close() {
    setPickedDate(null);
    setMode("menu");
  }

  return (
    <>
      <MonthCalendar
        events={events}
        emptyHint={emptyHint}
        onDayClick={(dateStr) => {
          setPickedDate(dateStr);
          setMode("menu");
        }}
      />

      {pickedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white border border-ink-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink-900">Toevoegen op {pickedDate}</h3>
                <p className="text-[11px] text-ink-500 mt-0.5">Voeg een vlucht of programma-item toe voor het advancing-team.</p>
              </div>
              <button type="button" onClick={close} className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1 rounded">Sluiten</button>
            </header>
            <div className="p-5">
              {mode === "menu" && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("flight")}
                    className="bg-white border-2 border-ink-200 rounded-xl p-4 hover:border-brand-400 hover:bg-brand-50 transition text-left"
                  >
                    <div className="text-2xl mb-1">✈</div>
                    <div className="font-bold text-ink-900">Vlucht</div>
                    <div className="text-[11px] text-ink-500 mt-1">Inbound of outbound vlucht met PNR, passagiers, kosten.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("timeline")}
                    className="bg-white border-2 border-ink-200 rounded-xl p-4 hover:border-brand-400 hover:bg-brand-50 transition text-left"
                  >
                    <div className="text-2xl mb-1">🕓</div>
                    <div className="font-bold text-ink-900">Program slot</div>
                    <div className="text-[11px] text-ink-500 mt-1">Load-in, soundcheck, programming, show, departure...</div>
                  </button>
                </div>
              )}

              {mode === "flight" && <FlightForm date={pickedDate} advancingId={advancingId} onDone={close} />}
              {mode === "timeline" && <TimelineForm date={pickedDate} advancingId={advancingId} onDone={close} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FlightForm({ date, advancingId, onDone }: { date: string; advancingId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        await addAdvancingFlightAction(advancingId, {
          direction: String(fd.get("direction")) as "inbound" | "outbound",
          flight_number: String(fd.get("flight_number") || ""),
          airline: String(fd.get("airline") || ""),
          departure_airport: String(fd.get("dep_ap") || "").toUpperCase(),
          arrival_airport: String(fd.get("arr_ap") || "").toUpperCase(),
          departure_datetime: new Date(String(fd.get("dep") || "")).toISOString(),
          arrival_datetime: new Date(String(fd.get("arr") || "")).toISOString(),
          passengers: String(fd.get("passengers") || "").split(",").map((s) => s.trim()).filter(Boolean),
          booking_reference: String(fd.get("pnr") || "") || undefined,
        });
        onDone();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select name="direction" defaultValue="inbound" className={inputCls}>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <input name="airline" placeholder="Airline (KLM)" className={inputCls} required />
        <input name="flight_number" placeholder="Flight # (KL1234)" className={inputCls} required />
        <input name="pnr" placeholder="PNR" className={inputCls} />
        <input name="dep_ap" placeholder="From (AMS)" className={inputCls} required />
        <input name="arr_ap" placeholder="To (BCN)" className={inputCls} required />
        <label className="block">
          <span className="text-[10px] font-semibold text-ink-700 block">Vertrek</span>
          <input type="datetime-local" name="dep" defaultValue={`${date}T08:00`} className={inputCls} required />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold text-ink-700 block">Aankomst</span>
          <input type="datetime-local" name="arr" defaultValue={`${date}T10:00`} className={inputCls} required />
        </label>
        <input name="passengers" placeholder="Passagiers (comma)" className={`${inputCls} md:col-span-2`} />
      </div>
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">{pending ? "..." : "Vlucht toevoegen"}</button>
      </div>
    </form>
  );
}

function TimelineForm({ date, advancingId, onDone }: { date: string; advancingId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const time = String(fd.get("time") || "12:00");
    start(async () => {
      try {
        await addTimelineEventAction({
          advancingId,
          event_type: String(fd.get("type")) as any,
          datetime: new Date(`${date}T${time}`).toISOString(),
          notes: String(fd.get("notes") || "") || undefined,
        });
        onDone();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select name="type" defaultValue="load_in" className={inputCls}>
          {TIMELINE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        <input name="time" type="time" defaultValue="12:00" className={inputCls} required />
        <input name="duration" type="number" placeholder="Duur (min)" className={inputCls} />
        <input name="label" placeholder="Label (optioneel)" className={inputCls} />
      </div>
      <textarea name="notes" placeholder="Notities" className={`${inputCls} min-h-[60px]`} />
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">{pending ? "..." : "Programma-item toevoegen"}</button>
      </div>
    </form>
  );
}

const inputCls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
