"use client";

import { useMemo, useState } from "react";
import EventDetailsPopup from "./EventDetailsPopup";
import CalendarAgenda from "./CalendarAgenda";

export type CalEventType = "show" | "hotel" | "travel" | "interview" | "block" | "soundcheck";

export type CalEventMeta =
  | { kind: "show"; advancingId: string; artistName: string; festivalName: string; stageName: string; venueLocation?: string; showTime?: string; setDuration?: number; doorsTime?: string; curfewTime?: string; status: string; fee?: number; programmingSlot?: string; soundcheckSlot?: string; }
  | { kind: "hotel"; advancingId: string; artistName: string; hotelName?: string; preference?: string; starRating?: string; roomCount?: number; roomType?: string; nights?: number; nightsDescription?: string; checkIn?: string; checkOut?: string; lateCheckout?: boolean; partySize?: number; roomAssignments?: { label: string; occupants: string[] }[]; travelingCrew: string[]; }
  | { kind: "travel"; advancingId: string; artistName: string; flightNumber: string; airline: string; departureAirport: string; arrivalAirport: string; departureDatetime: string; arrivalDatetime: string; passengers: string[]; status?: string; bookingReference?: string; direction: "inbound" | "outbound"; notes?: string; }
  | { kind: "soundcheck"; advancingId: string; artistName: string; eventType: string; datetime: string; location?: string; responsibleContact?: string; notes?: string; };

export interface CalEvent {
  id: string;
  type: CalEventType;
  title: string;
  /** "18:00", "TBA", "All Day", "00:00" etc. */
  time?: string;
  /** Inclusive start date (YYYY-MM-DD) */
  startDate: string;
  /** Inclusive end date (YYYY-MM-DD). Equal to startDate voor 1-day events. */
  endDate: string;
  href?: string;
  /** Free-form subtitle bv. "fred- Hotel in Amsterdam" */
  subtitle?: string;
  /** Rich data voor popup. */
  meta?: CalEventMeta;
}

const TYPE_BG: Record<CalEventType, string> = {
  show:       "#E91E63",
  hotel:      "#FF9800",
  travel:     "#4CAF50",
  interview:  "#E91E63",
  block:      "#DC2626",
  soundcheck: "#8B5CF6",
};

function EventIcon({ type, size = 12 }: { type: CalEventType; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "opacity-95 flex-shrink-0" };
  switch (type) {
    case "travel":
      // Vliegtuig (gevulde silhouette, neus naar rechts)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className="opacity-95 flex-shrink-0">
          <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z" />
        </svg>
      );
    case "hotel":
      // Bed met hoofdeinde
      return (
        <svg {...common}>
          <path d="M2 18V8" />
          <path d="M22 18v-6a3 3 0 00-3-3H10v8" />
          <path d="M2 14h20" />
          <circle cx="6" cy="12" r="1.5" />
        </svg>
      );
    case "show":
      // Microfoon (zang/optreden)
      return (
        <svg {...common}>
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0014 0" />
          <path d="M12 18v3" />
          <path d="M9 21h6" />
        </svg>
      );
    case "soundcheck":
      // Speaker / luidspreker
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <circle cx="12" cy="14" r="3" />
          <circle cx="12" cy="7" r="1" />
        </svg>
      );
    case "interview":
      // Telefoon-handset
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 01-2.2 2 19 19 0 01-8.3-3 19 19 0 01-6-6A19 19 0 012.2 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012-.4c.9.3 1.8.5 2.7.6A2 2 0 0122 16.9z" />
        </svg>
      );
    case "block":
      // Ban / verboden cirkel
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M5 5l14 14" />
        </svg>
      );
  }
}

const MONTHS = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
const WEEKDAYS = ["Ma","Di","Wo","Do","Vr","Za","Zo"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function parseISO(s: string): Date {
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Maandag = 0, Zondag = 6 */
function dowMon0(d: Date): number {
  return (d.getDay() + 6) % 7;
}

interface PositionedEvent {
  event: CalEvent;
  /** Lane (0,1,2,...) waarop deze event ligt — bepaalt y-offset. */
  lane: number;
  /** Per week-row: dag-offset binnen die rij (0-6) + spanlengte. */
  segments: { weekIdx: number; startCol: number; span: number; isStart: boolean; isEnd: boolean }[];
}

function assignLanes(events: CalEvent[], gridStart: Date, gridEnd: Date): PositionedEvent[] {
  // Filter alleen events die binnen het zichtbare grid vallen
  const visible = events
    .map((e) => {
      const s = parseISO(e.startDate);
      const en = parseISO(e.endDate);
      const clampedStart = s < gridStart ? gridStart : s;
      const clampedEnd = en > gridEnd ? gridEnd : en;
      if (clampedEnd < gridStart || clampedStart > gridEnd) return null;
      return { event: e, start: clampedStart, end: clampedEnd, origStart: s, origEnd: en };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    // Sorteer: langer eerst, dan vroegere start
    .sort((a, b) => {
      const la = diffDays(a.start, a.end);
      const lb = diffDays(b.start, b.end);
      if (lb !== la) return lb - la;
      return a.start.getTime() - b.start.getTime();
    });

  // Greedy lane assignment per dag.
  const dayLanes: Map<number, Set<number>> = new Map(); // day offset -> set of used lanes
  const result: PositionedEvent[] = [];

  for (const v of visible) {
    const startOffset = diffDays(gridStart, v.start);
    const endOffset = diffDays(gridStart, v.end);

    let lane = 0;
    outer: while (true) {
      for (let day = startOffset; day <= endOffset; day++) {
        if (dayLanes.get(day)?.has(lane)) {
          lane++;
          continue outer;
        }
      }
      break;
    }

    for (let day = startOffset; day <= endOffset; day++) {
      if (!dayLanes.has(day)) dayLanes.set(day, new Set());
      dayLanes.get(day)!.add(lane);
    }

    // Splits in segmenten per week (rij).
    const segments: PositionedEvent["segments"] = [];
    let cur = startOffset;
    while (cur <= endOffset) {
      const weekIdx = Math.floor(cur / 7);
      const col = cur % 7;
      const endOfWeek = weekIdx * 7 + 6;
      const segEnd = Math.min(endOfWeek, endOffset);
      segments.push({
        weekIdx,
        startCol: col,
        span: segEnd - cur + 1,
        isStart: cur === startOffset,
        isEnd: segEnd === endOffset,
      });
      cur = segEnd + 1;
    }

    result.push({ event: v.event, lane, segments });
  }

  return result;
}

export default function MonthCalendar({
  events,
  initialMonth,
  emptyHint,
  onDayClick,
}: {
  events: CalEvent[];
  initialMonth?: { year: number; month: number };
  emptyHint?: string;
  onDayClick?: (dateStr: string) => void;
}) {
  const today = new Date();

  // Bepaal smart default: eerste maand vanaf vandaag die events bevat.
  // Als alle events in het verleden liggen, springen we naar de meest recente.
  const smartDefault = useMemo(() => {
    if (initialMonth) return initialMonth;
    if (events.length === 0) return { year: today.getFullYear(), month: today.getMonth() };
    const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const todayIso = toISO(today);
    const future = sorted.find((e) => e.startDate >= todayIso);
    const pick = future ?? sorted[sorted.length - 1];
    const d = parseISO(pick.startDate);
    return { year: d.getFullYear(), month: d.getMonth() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [year, setYear] = useState(smartDefault.year);
  const [month, setMonth] = useState(smartDefault.month);
  const [openEvent, setOpenEvent] = useState<CalEvent | null>(null);

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const gridStart = addDays(firstOfMonth, -dowMon0(firstOfMonth));
  // Vul tot complete weken, minimaal 6 weken voor consistente hoogte.
  const weeksNeeded = Math.max(6, Math.ceil((diffDays(gridStart, lastOfMonth) + 1) / 7));
  const gridEnd = addDays(gridStart, weeksNeeded * 7 - 1);

  const positioned = useMemo(() => assignLanes(events, gridStart, gridEnd), [events, gridStart.getTime(), gridEnd.getTime()]);

  // Per weekIdx een lijst van segmenten verzamelen.
  const segmentsByWeek: Map<number, { event: CalEvent; lane: number; startCol: number; span: number; isStart: boolean; isEnd: boolean }[]> = new Map();
  for (const p of positioned) {
    for (const seg of p.segments) {
      const arr = segmentsByWeek.get(seg.weekIdx) ?? [];
      arr.push({ event: p.event, lane: p.lane, ...seg });
      segmentsByWeek.set(seg.weekIdx, arr);
    }
  }

  const maxLane = positioned.reduce((m, p) => Math.max(m, p.lane), -1);
  const rowMinHeight = Math.max(108, 28 + (maxLane + 1) * 22);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }
  function jumpToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const isCurrent = (d: Date) => d.getMonth() === month && d.getFullYear() === year;
  const isToday = (d: Date) => toISO(d) === toISO(today);

  return (
    <>
      {/* Mobile agenda view */}
      <div className="md:hidden">
        <CalendarAgenda events={events} emptyHint={emptyHint} onDayClick={onDayClick} />
      </div>
      <section className="hidden md:block bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Vorige maand"
            className="w-8 h-8 grid place-items-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 className="text-base font-extrabold text-ink-900 tabular-nums min-w-[160px] text-center">
            {MONTHS[month]} {year}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Volgende maand"
            className="w-8 h-8 grid place-items-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            className="ml-2 text-xs font-semibold text-ink-700 hover:text-ink-900 hover:underline"
          >
            Vandaag
          </button>
        </div>
        <Legend />
      </header>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-ink-200 bg-ink-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-500 text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div>
        {Array.from({ length: weeksNeeded }).map((_, weekIdx) => {
          const weekSegments = segmentsByWeek.get(weekIdx) ?? [];
          return (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-ink-200 relative" style={{ minHeight: rowMinHeight }}>
              {Array.from({ length: 7 }).map((_, col) => {
                const d = addDays(gridStart, weekIdx * 7 + col);
                const cur = isCurrent(d);
                const todayFlag = isToday(d);
                const dateStr = toISO(d);
                return (
                  <div
                    key={col}
                    onClick={onDayClick ? () => onDayClick(dateStr) : undefined}
                    className={`relative border-r border-ink-200 px-2 pt-1.5 ${
                      cur ? "bg-white" : "bg-ink-50/60"
                    } ${col === 6 ? "border-r-0" : ""} ${onDayClick ? "cursor-pointer hover:bg-brand-50 group" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${
                        todayFlag ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink-900 text-white font-bold"
                        : cur ? "text-ink-700 font-semibold"
                        : "text-ink-400"
                      }`}>{d.getDate()}</div>
                      {onDayClick && (
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-brand-600 bg-white border border-brand-300 rounded px-1">
                          +
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Overlay pills voor deze week */}
              <div className="absolute inset-x-0 top-7 bottom-1 pointer-events-none">
                {weekSegments.map((seg, i) => (
                  <EventPill key={`${seg.event.id}-${i}`} seg={seg} onOpen={() => setOpenEvent(seg.event)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && emptyHint && (
        <div className="px-5 py-6 text-center text-sm text-ink-500 border-t border-ink-200">
          {emptyHint}
        </div>
      )}

      {openEvent && <EventDetailsPopup event={openEvent} onClose={() => setOpenEvent(null)} />}
    </section>
    </>
  );
}

function EventPill({
  seg,
  onOpen,
}: {
  seg: { event: CalEvent; lane: number; startCol: number; span: number; isStart: boolean; isEnd: boolean };
  onOpen: () => void;
}) {
  const { event, lane, startCol, span, isStart, isEnd } = seg;
  const bg = TYPE_BG[event.type] ?? TYPE_BG.block;
  const leftPct = (startCol / 7) * 100;
  const widthPct = (span / 7) * 100;
  const top = lane * 22;

  const radius =
    isStart && isEnd ? "rounded-md" :
    isStart ? "rounded-l-md rounded-r-none" :
    isEnd ? "rounded-r-md rounded-l-none" :
    "rounded-none";

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        top,
        height: 18,
      }}
      title={`${event.title}${event.subtitle ? ` · ${event.subtitle}` : ""}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`flex items-center gap-1.5 h-[18px] w-full px-1.5 ${radius} text-white text-[11px] font-bold leading-tight overflow-hidden hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1`}
        style={{ backgroundColor: bg }}
      >
        {isStart && event.time && (
          <span className="opacity-95 tabular-nums whitespace-nowrap">{event.time}</span>
        )}
        {isStart && <EventIcon type={event.type} size={12} />}
        <span className="truncate flex-1 text-left">{event.title}</span>
      </button>
    </div>
  );
}

function Legend() {
  const items: { type: CalEventType; label: string }[] = [
    { type: "show", label: "Show" },
    { type: "soundcheck", label: "Soundcheck" },
    { type: "travel", label: "Vlucht" },
    { type: "hotel", label: "Hotel" },
    { type: "interview", label: "Promo" },
    { type: "block", label: "Block" },
  ];
  return (
    <div className="hidden md:flex items-center gap-3 text-xs text-ink-500">
      {items.map((i) => (
        <span key={i.type} className="inline-flex items-center gap-1.5 text-ink-600">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm text-white" style={{ backgroundColor: TYPE_BG[i.type] }}>
            <EventIcon type={i.type} size={10} />
          </span>
          {i.label}
        </span>
      ))}
    </div>
  );
}
