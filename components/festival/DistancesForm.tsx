"use client";

import { useState, useTransition } from "react";
import { setDistancesAction } from "@/lib/actions";
import type { Distances } from "@/lib/types";

export default function DistancesForm({ token, distances }: { token: string; distances: Distances }) {
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<Distances>({ ...distances });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function handleChange(key: keyof Distances, value: string) {
    const v = value === "" ? undefined : Number(value);
    setData((prev) => ({ ...prev, [key]: v }));
  }

  function save() {
    startTransition(async () => {
      await setDistancesAction(token, data as Record<string, number | undefined>);
      setSavedAt(new Date().toLocaleTimeString("nl-NL"));
    });
  }

  const Cell = ({ kmKey, minKey, label }: { kmKey: keyof Distances; minKey: keyof Distances; label: string }) => (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-ink-100 last:border-b-0 flex-wrap">
      <span className="text-sm text-ink-700 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-ink-400">km</span>
          <input
            type="number"
            min={0}
            value={data[kmKey] ?? ""}
            onChange={(e) => handleChange(kmKey, e.target.value)}
            placeholder="-"
            className="w-20 bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-ink-400">min</span>
          <input
            type="number"
            min={0}
            value={data[minKey] ?? ""}
            onChange={(e) => handleChange(minKey, e.target.value)}
            placeholder="-"
            className="w-20 bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </label>
      </div>
    </div>
  );

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
        <div>
          <h3 className="font-bold text-ink-900">Afstanden invullen</h3>
          <p className="text-xs text-ink-500">Door festival - management ziet dit live in hun portal.</p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && <span className="text-[11px] text-emerald-700">Opgeslagen om {savedAt}</span>}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {pending ? "Bezig…" : "Opslaan"}
          </button>
        </div>
      </header>
      <div className="px-5 py-3">
        <Cell kmKey="airport_hotel_km" minKey="airport_hotel_minutes" label="Airport ↔ Hotel" />
        <Cell kmKey="hotel_venue_km" minKey="hotel_venue_minutes" label="Hotel ↔ Venue" />
        <Cell kmKey="venue_airport_km" minKey="venue_airport_minutes" label="Venue ↔ Airport" />
      </div>
    </section>
  );
}
