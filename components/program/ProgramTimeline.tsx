"use client";

import { useState, useTransition } from "react";
import {
  addTimelineEventAction,
  removeTimelineEventAction,
  updateTimelineEventAction,
} from "@/lib/actions";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

const EVENT_TYPES: { value: TimelineEventType; label: string; tone: string }[] = [
  { value: "load_in",           label: "Load-in",                tone: "bg-ink-100 text-ink-700" },
  { value: "setup",             label: "Set-up",                 tone: "bg-ink-100 text-ink-700" },
  { value: "soundcheck",        label: "Soundcheck",             tone: "bg-emerald-50 text-emerald-700" },
  { value: "programming_led",   label: "Programming LED",        tone: "bg-violet-50 text-violet-700" },
  { value: "programming_laser", label: "Programming Laser",      tone: "bg-fuchsia-50 text-fuchsia-700" },
  { value: "programming_video", label: "Programming Video",      tone: "bg-sky-50 text-sky-700" },
  { value: "booth_time",        label: "Booth time",             tone: "bg-amber-50 text-amber-700" },
  { value: "doors",             label: "Doors",                  tone: "bg-emerald-50 text-emerald-700" },
  { value: "show",              label: "Show",                   tone: "bg-red-50 text-red-700" },
  { value: "encore",            label: "Encore",                 tone: "bg-red-50 text-red-700" },
  { value: "curfew",            label: "Curfew",                 tone: "bg-ink-900 text-white" },
  { value: "load_out",          label: "Load-out",               tone: "bg-ink-100 text-ink-700" },
  { value: "departure",         label: "Departure",              tone: "bg-ink-100 text-ink-700" },
  { value: "other",             label: "Anders",                 tone: "bg-ink-100 text-ink-700" },
];

const TYPE_META = new Map(EVENT_TYPES.map((t) => [t.value, t]));

const eventLabel = (t: TimelineEventType) => TYPE_META.get(t)?.label ?? t;
const eventTone = (t: TimelineEventType) => TYPE_META.get(t)?.tone ?? "bg-ink-100 text-ink-700";

export type ScopeKey = { advancingId?: string; token?: string };

export default function ProgramTimeline({
  events,
  scope,
  canEdit,
  source,
  showDate,
}: {
  events: TimelineEvent[];
  scope: ScopeKey;
  canEdit: boolean;
  source: "backoffice" | "portal" | "festival";
  showDate?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sort by datetime ascending.
  const sorted = [...events].sort((a, b) => a.datetime.localeCompare(b.datetime));

  const headerTone =
    source === "festival" ? "bg-emerald-900" :
    source === "portal" ? "bg-ink-900" :
    "bg-ink-900";

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-ink-900">Program timeline · Run-of-show</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Wat is afgesproken qua tijden: load-in, soundcheck, doors, show, programming slots. Zichtbaar voor management én festival.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-md font-semibold transition ${
              adding ? "bg-ink-100 text-ink-700" : `${headerTone} text-white hover:opacity-90`
            }`}
          >
            {adding ? "Annuleer" : "+ Moment toevoegen"}
          </button>
        )}
      </header>

      {adding && (
        <EventForm
          scope={scope}
          showDate={showDate}
          onDone={() => setAdding(false)}
          source={source}
        />
      )}

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="text-sm text-ink-500">
            Nog geen momenten vastgelegd.
          </div>
          {canEdit && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={`mt-3 text-xs px-3 py-1.5 rounded-md font-semibold ${headerTone} text-white hover:opacity-90 transition`}
            >
              Voeg eerste moment toe
            </button>
          )}
        </div>
      ) : (
        <ol className="relative">
          {sorted.map((ev, i) => (
            <TimelineRow
              key={ev.id}
              event={ev}
              isLast={i === sorted.length - 1}
              canEdit={canEdit}
              scope={scope}
              editing={editingId === ev.id}
              onEditOpen={() => setEditingId(ev.id)}
              onEditClose={() => setEditingId(null)}
              source={source}
              showDate={showDate}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function TimelineRow({
  event,
  isLast,
  canEdit,
  scope,
  editing,
  onEditOpen,
  onEditClose,
  source,
  showDate,
}: {
  event: TimelineEvent;
  isLast: boolean;
  canEdit: boolean;
  scope: ScopeKey;
  editing: boolean;
  onEditOpen: () => void;
  onEditClose: () => void;
  source: "backoffice" | "portal" | "festival";
  showDate?: string;
}) {
  const [pending, start] = useTransition();
  const dt = new Date(event.datetime);
  // Force Europe/Amsterdam zodat UI en PDF dezelfde tijd tonen
  const dateStr = dt.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", timeZone: "Europe/Amsterdam" });
  const timeStr = dt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

  return (
    <li className={`relative pl-16 pr-5 py-4 hover:bg-ink-50/40 transition ${pending ? "opacity-50" : ""}`}>
      {/* Dot + line */}
      <div className="absolute left-7 top-5 w-2.5 h-2.5 rounded-full bg-ink-900 border-2 border-white z-10" />
      {!isLast && <div className="absolute left-[33px] top-7 bottom-0 w-px bg-ink-200" />}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${eventTone(event.event_type)}`}>
              {eventLabel(event.event_type)}
            </span>
            <span className="text-sm font-bold text-ink-900 tabular-nums">{timeStr}</span>
            <span className="text-xs text-ink-400 tabular-nums">{dateStr}</span>
            {event.location && (
              <span className="text-xs text-ink-500">
                <span className="text-ink-400">·</span> {event.location}
              </span>
            )}
          </div>
          {(event.responsible_contact || event.notes) && (
            <div className="mt-1 text-xs text-ink-500 space-y-0.5">
              {event.responsible_contact && (
                <div>
                  <span className="text-ink-400">Wie:</span> {event.responsible_contact}
                </div>
              )}
              {event.notes && <div>{event.notes}</div>}
            </div>
          )}
        </div>
        {canEdit && !editing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEditOpen}
              className="text-[11px] font-semibold text-ink-700 hover:text-ink-900 hover:underline"
            >
              Bewerk
            </button>
            <span className="text-ink-300">·</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm(`${eventLabel(event.event_type)} op ${timeStr} verwijderen?`)) return;
                start(async () => {
                  await removeTimelineEventAction({ id: event.id, ...scope });
                });
              }}
              className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
            >
              Verwijder
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3">
          <EventForm
            scope={scope}
            existing={event}
            onDone={onEditClose}
            source={source}
            showDate={showDate}
          />
        </div>
      )}
    </li>
  );
}

function EventForm({
  scope,
  existing,
  onDone,
  source,
  showDate,
}: {
  scope: ScopeKey;
  existing?: TimelineEvent;
  onDone: () => void;
  source: "backoffice" | "portal" | "festival";
  showDate?: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Default datetime: gebruik existing of show_date + 16:00 als startpunt.
  // Fallback (geen showDate): vandaag in Amsterdam-TZ, NIET UTC.
  const todayLocal = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const defaultDate = existing?.datetime ?? (showDate ? `${showDate}T16:00:00` : `${todayLocal}T16:00:00`);
  const dtLocal = defaultDate.slice(0, 16); // YYYY-MM-DDTHH:MM voor datetime-local

  const tone =
    source === "festival" ? "border-emerald-100 bg-emerald-50/40"
    : "border-ink-200 bg-ink-50/40";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const event_type = String(fd.get("event_type") || "other") as TimelineEventType;
    const datetimeLocal = String(fd.get("datetime") || "");
    if (!datetimeLocal) { setErr("Datum + tijd verplicht"); return; }
    // Converteer naar ISO met lokale timezone offset.
    const datetime = new Date(datetimeLocal).toISOString();
    const payload = {
      event_type,
      datetime,
      location: String(fd.get("location") || "").trim() || undefined,
      responsible_contact: String(fd.get("responsible_contact") || "").trim() || undefined,
      notes: String(fd.get("notes") || "").trim() || undefined,
    };

    start(async () => {
      if (existing) {
        const r = await updateTimelineEventAction({ id: existing.id, ...scope, patch: payload });
        if (r && !r.ok) { setErr(r.error ?? "Update mislukt"); return; }
      } else {
        const r = await addTimelineEventAction({ ...scope, ...payload });
        if (r && !r.ok) { setErr(r.error ?? "Toevoegen mislukt"); return; }
      }
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className={`border ${tone} rounded-lg p-4 space-y-3`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700">Wat *</span>
          <select
            name="event_type"
            defaultValue={existing?.event_type ?? "soundcheck"}
            required
            className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold text-ink-700">Wanneer *</span>
          <input
            name="datetime"
            type="datetime-local"
            defaultValue={dtLocal}
            required
            className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700">Locatie</span>
          <input
            name="location"
            defaultValue={existing?.location ?? ""}
            placeholder="DJ booth, FOH, dressing room A"
            className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700">Verantwoordelijke</span>
          <input
            name="responsible_contact"
            defaultValue={existing?.responsible_contact ?? ""}
            placeholder="Naam + rol"
            className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700">Notitie</span>
          <input
            name="notes"
            defaultValue={existing?.notes ?? ""}
            placeholder="Bijzonderheden"
            className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
      </div>
      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50">
          {pending ? "Bezig..." : existing ? "Update moment" : "Voeg moment toe"}
        </button>
      </div>
    </form>
  );
}
