"use client";

import { useState, useTransition } from "react";
import { createFestivalAction } from "@/lib/actions";

export default function NewFestivalForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function submit(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await createFestivalAction(formData);
      if (result.ok) {
        setSavedAt(Date.now());
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        {savedAt && Date.now() - savedAt < 3000 && (
          <span className="text-[11px] text-emerald-700 font-semibold">✓ Festival toegevoegd</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-black transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
          Nieuw festival
        </button>
      </div>
    );
  }

  return (
    <form action={submit} className="bg-white border border-ink-200 rounded-2xl shadow-card p-5 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink-900 text-sm">Nieuw festival toevoegen aan CRM</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Voeg een nieuw festival + stages toe. Je kunt daarna direct contacten koppelen.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1 rounded">Sluiten</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Festivalnaam *</span>
          <input name="name" required placeholder="Bv. Mysteryland" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Locatie</span>
          <input name="location" placeholder="Haarlemmermeer" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Land</span>
          <input name="country" placeholder="Nederland" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Startdatum</span>
          <input type="date" name="start_date" className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Einddatum</span>
          <input type="date" name="end_date" className={inputCls} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Stages (comma- of regel-gescheiden)</span>
          <textarea name="stages" placeholder="Main Stage, Q-dance, Hangar, ..." className={`${inputCls} min-h-[60px]`} />
        </label>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">{error}</div>}

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">
          {pending ? "Aanmaken..." : "Festival aanmaken"}
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
