"use client";

import { useState, useTransition } from "react";
import { addFlightAction, removeFlightAction } from "@/lib/actions";
import type { FlightInfo } from "@/lib/types";

export default function FlightsBlock({ token, flights }: { token: string; flights: FlightInfo[] }) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Vluchten ({flights.length})</h3>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            Vlucht toevoegen
          </button>
        </header>
        {flights.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-500">Nog geen vluchten ingevoerd.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {flights.map((f) => (
              <li key={f.id} className="px-5 py-4 flex items-start gap-4">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider ${
                  f.direction === "inbound" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {f.direction}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink-900">{f.airline} {f.flight_number}</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {f.departure_airport} → {f.arrival_airport}
                  </div>
                  <div className="text-xs text-ink-500 tabular-nums mt-0.5">
                    {f.departure_datetime ? new Date(f.departure_datetime).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Amsterdam" }) : "-"}
                    {" · "}
                    {f.passengers.length} passagier{f.passengers.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => removeFlightAction(token, f.id))}
                  className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
                >
                  Verwijder
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding && (
        <form
          action={(fd) => {
            startTransition(async () => {
              await addFlightAction(token, fd);
              setAdding(false);
            });
          }}
          className="bg-white border border-brand-200 rounded-2xl shadow-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Field label="Richting">
            <select name="direction" className="input" defaultValue="inbound">
              <option value="inbound">Inbound (heen)</option>
              <option value="outbound">Outbound (terug)</option>
            </select>
          </Field>
          <Field label="Maatschappij">
            <input name="airline" className="input" placeholder="KLM" />
          </Field>
          <Field label="Vluchtnummer">
            <input name="flight_number" className="input" placeholder="KL1721" />
          </Field>
          <Field label="Boekingsreferentie">
            <input name="booking_reference" className="input" placeholder="ABC123" />
          </Field>
          <Field label="Vertrek luchthaven">
            <input name="departure_airport" className="input" placeholder="AMS" />
          </Field>
          <Field label="Aankomst luchthaven">
            <input name="arrival_airport" className="input" placeholder="LAX" />
          </Field>
          <Field label="Vertrek datum/tijd">
            <input type="datetime-local" name="departure_datetime" className="input" />
          </Field>
          <Field label="Aankomst datum/tijd">
            <input type="datetime-local" name="arrival_datetime" className="input" />
          </Field>
          <Field label="Passagiers (komma-gescheiden)">
            <input name="passengers" className="input" placeholder="Robbert, Sven (TM), FOH" />
          </Field>
          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-100 transition"
            >
              Annuleer
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-60"
            >
              {pending ? "Opslaan…" : "Vlucht opslaan"}
            </button>
          </div>

          <style>{`
            .input {
              width: 100%;
              background: white;
              border: 1px solid #e3e6eb;
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 14px;
              color: #0f1115;
              outline: none;
              transition: border-color 150ms, box-shadow 150ms;
            }
            .input:focus {
              border-color: #ffa66e;
              box-shadow: 0 0 0 3px rgba(255,166,110,0.35);
            }
          `}</style>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
