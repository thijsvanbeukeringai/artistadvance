"use client";

import { useEffect, useRef, useState } from "react";
import MonthCalendar, { type CalEvent } from "./MonthCalendar";
import AgencyBookingPanel from "@/components/booking/AgencyBookingPanel";
import type { Festival, FestivalCRMContact, Stage } from "@/lib/types";

export default function AgencyCalendar({
  events,
  emptyHint,
  artists,
  festivals,
  stages,
  festivalContacts = [],
}: {
  events: CalEvent[];
  emptyHint?: string;
  artists: { id: string; name: string }[];
  festivals: Festival[];
  stages: Stage[];
  festivalContacts?: FestivalCRMContact[];
}) {
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Escape sluit dialog + focus terug naar trigger
  useEffect(() => {
    if (!pickedDate) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickedDate(null);
    }
    document.addEventListener("keydown", onKey);
    // Verschuif focus naar de close-knop bij openen
    setTimeout(() => dialogRef.current?.querySelector<HTMLButtonElement>("button[data-dialog-close]")?.focus(), 50);
    return () => document.removeEventListener("keydown", onKey);
  }, [pickedDate]);

  return (
    <>
      <MonthCalendar
        events={events}
        emptyHint={emptyHint}
        onDayClick={(dateStr) => setPickedDate(dateStr)}
      />

      {pickedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPickedDate(null); }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agency-cal-dialog-title"
            className="bg-white border border-ink-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 id="agency-cal-dialog-title" className="font-bold text-ink-900">Toevoegen op {pickedDate}</h3>
                <p className="text-[11px] text-ink-500 mt-0.5">Op de agency-kant maak je hier een nieuwe boeking aan.</p>
              </div>
              <button
                type="button"
                data-dialog-close
                onClick={() => setPickedDate(null)}
                aria-label="Sluit dialoog"
                className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                Sluiten
              </button>
            </header>
            <div className="p-5">
              <AgencyBookingPanel
                artists={artists}
                festivals={festivals}
                stages={stages}
                festivalContacts={festivalContacts}
                defaultDate={pickedDate}
                openByDefault
                onCreated={() => setPickedDate(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
