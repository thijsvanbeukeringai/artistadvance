"use client";

import { useMemo, useState } from "react";
import type { CalEvent, CalEventType } from "./MonthCalendar";
import EventDetailsPopup from "./EventDetailsPopup";

const TYPE_COLOR: Record<CalEventType, string> = {
  show: "bg-brand-500",
  hotel: "bg-blue-500",
  travel: "bg-emerald-500",
  interview: "bg-purple-500",
  block: "bg-red-500",
  soundcheck: "bg-amber-500",
  reminder: "bg-sky-500",
};

const TYPE_LABEL: Record<CalEventType, string> = {
  show: "Show",
  hotel: "Hotel",
  travel: "Travel",
  interview: "Interview",
  block: "Block",
  soundcheck: "Soundcheck",
  reminder: "Reminder",
};

const WEEKDAY = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function expandEventToDays(event: CalEvent): { iso: string; event: CalEvent }[] {
  // Parse YYYY-MM-DD direct uit numerieke onderdelen — vermijd Date+toISOString,
  // dat de datum verschuift bij UTC-conversie (lokale midnight = vorige dag UTC).
  const [sy, sm, sd] = event.startDate.split("-").map(Number);
  const [ey, em, ed] = event.endDate.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return [];
  const days: { iso: string; event: CalEvent }[] = [];
  const cursor = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);
  while (cursor <= last) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    days.push({ iso, event });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function CalendarAgenda({
  events,
  emptyHint,
  onDayClick,
}: {
  events: CalEvent[];
  emptyHint?: string;
  onDayClick?: (dateStr: string) => void;
}) {
  const [openEvent, setOpenEvent] = useState<CalEvent | null>(null);
  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });

  // Group events by ISO date, expand multi-day events
  const byDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      for (const { iso } of expandEventToDays(e)) {
        const arr = m.get(iso) ?? [];
        arr.push(e);
        m.set(iso, arr);
      }
    }
    return m;
  }, [events]);

  // Sort dates ascending, only days with events. Add month headers.
  const sortedDates = useMemo(() => [...byDate.keys()].sort(), [byDate]);

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white border border-ink-200 rounded-xl p-8 text-center text-sm text-ink-500">
        {emptyHint ?? "Geen events."}
      </div>
    );
  }

  // Build rows with month-headers
  type Row =
    | { type: "month"; label: string; isCurrentMonth: boolean }
    | { type: "day"; iso: string; events: CalEvent[] };
  const out: Row[] = [];
  let lastMonth = "";
  const todayMonthKey = (() => {
    const t = new Date(todayIso + "T00:00:00");
    return `${t.getFullYear()}-${t.getMonth()}`;
  })();
  for (const iso of sortedDates) {
    const d = new Date(iso + "T00:00:00");
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthKey !== lastMonth) {
      out.push({
        type: "month",
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        isCurrentMonth: monthKey === todayMonthKey,
      });
      lastMonth = monthKey;
    }
    out.push({ type: "day", iso, events: byDate.get(iso) ?? [] });
  }

  return (
    <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
      {out.map((row, i) => {
        if (row.type === "month") {
          return (
            <div key={`m-${i}`} className="sticky top-0 z-10 bg-ink-50 border-b border-ink-200 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-700 capitalize">{row.label}</span>
                {row.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`day-${todayIso}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-brand-600"
                  >
                    Vandaag
                  </button>
                )}
              </div>
            </div>
          );
        }
        const d = new Date(row.iso + "T00:00:00");
        const isToday = row.iso === todayIso;
        return (
          <div
            key={row.iso}
            id={`day-${row.iso}`}
            className={`flex items-stretch border-b border-ink-100 last:border-0 ${isToday ? "bg-brand-50/40" : ""}`}
          >
            {/* Date column */}
            <button
              type="button"
              onClick={() => onDayClick?.(row.iso)}
              className="flex-shrink-0 w-12 flex flex-col items-center justify-start py-3 border-r border-ink-100 group"
            >
              <div className={`text-lg font-extrabold tabular-nums leading-none ${
                isToday ? "text-brand-600" : "text-ink-900"
              }`}>{d.getDate()}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400 mt-1">{WEEKDAY[d.getDay()]}</div>
              {onDayClick && (
                <span className="opacity-0 group-hover:opacity-100 mt-2 text-[10px] font-bold text-brand-600 transition-opacity">+</span>
              )}
            </button>

            {/* Events column */}
            <div className="flex-1 min-w-0 py-1.5 px-2 space-y-1.5">
              {row.events.map((e, j) => (
                <button
                  key={`${e.id}-${j}`}
                  type="button"
                  onClick={() => setOpenEvent(e)}
                  className="w-full text-left bg-white border border-ink-200 rounded-lg overflow-hidden hover:border-ink-300 hover:shadow-sm transition flex"
                >
                  <span className={`w-1 flex-shrink-0 ${TYPE_COLOR[e.type] ?? "bg-ink-400"}`} />
                  <div className="flex-1 min-w-0 px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <EventTypeIcon type={e.type} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{TYPE_LABEL[e.type]}</span>
                      {e.startDate !== e.endDate && (
                        <span className="text-[10px] text-ink-400">multi-day</span>
                      )}
                    </div>
                    <div className="font-semibold text-ink-900 text-sm truncate">{e.title}</div>
                    {e.subtitle && (
                      <div className="text-[11px] text-ink-500 truncate">{e.subtitle}</div>
                    )}
                    {e.time && (
                      <div className="text-[11px] text-ink-500 mt-0.5 tabular-nums">{e.time}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {openEvent && <EventDetailsPopup event={openEvent} onClose={() => setOpenEvent(null)} />}
    </div>
  );
}

function EventTypeIcon({ type }: { type: CalEventType }) {
  const cls = "w-3 h-3";
  if (type === "show") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3" /><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
    );
  }
  if (type === "hotel") return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 22V8a2 2 0 012-2h16a2 2 0 012 2v14 M2 22h20" /></svg>;
  if (type === "travel") return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>;
  if (type === "interview") return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4 M8 23h8" /></svg>;
  if (type === "soundcheck") return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3-9 4 18 3-9h5" /></svg>;
  return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>;
}
