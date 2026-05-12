"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import { CREW_ROLE_LABELS, SECTION_LABELS, SHOW_TYPE_LABELS, TECH_SECTIONS } from "@/lib/data";
import type { Booking, BookingCrew, ShowType, BookingStatus } from "@/lib/types";

type TrackerRow = {
  booking: Booking;
  artist: { id: string; name: string };
  festival: { id: string; name: string; country?: string };
  stage: { id: string; name: string };
  advancing: { id: string } | null;
  readinessScore: number | null;
  bottleneck: string | null;
  bottleneckTone: "ok" | "warn" | "bad" | "neutral" | null;
  ridersAccepted: number;
  ridersTotal: number;
  ridersDisputed: number;
  urgencyLevel: string | null;
  urgencyLabel: string | null;
  crew: BookingCrew[];
  sectionPercents: Record<string, number>;
  showMonth: string;
};

const PRIMARY_CREW_ROLES = ["pm", "tm", "ld", "vj", "foh", "sfx", "laser", "bl"] as const;

export default function TrackerTable({ rows, allMonths }: { rows: TrackerRow[]; allMonths: string[] }) {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [showTypeFilter, setShowTypeFilter] = useState<ShowType | "all">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "critical" | "urgent" | "soon" | "calm">("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.booking.status !== statusFilter) return false;
      if (showTypeFilter !== "all" && r.booking.show_type !== showTypeFilter) return false;
      if (urgencyFilter !== "all" && r.urgencyLevel !== urgencyFilter) return false;
      if (monthFilter !== "all" && r.showMonth !== monthFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.artist.name.toLowerCase().includes(q) &&
          !r.festival.name.toLowerCase().includes(q) &&
          !r.stage.name.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rows, statusFilter, showTypeFilter, urgencyFilter, monthFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek artiest / festival / stage…"
          className="flex-1 min-w-[200px] bg-ink-50 border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <FilterSelect label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as any)} options={[
          { value: "all", label: "Alle statussen" },
          { value: "draft", label: "Draft" },
          { value: "confirmed", label: "Confirmed" },
          { value: "advancing", label: "Advancing" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]} />
        <FilterSelect label="Type show" value={showTypeFilter} onChange={(v) => setShowTypeFilter(v as any)} options={[
          { value: "all", label: "Alle types" },
          ...Object.entries(SHOW_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
        ]} />
        <FilterSelect label="Urgency" value={urgencyFilter} onChange={(v) => setUrgencyFilter(v as any)} options={[
          { value: "all", label: "Alle urgenties" },
          { value: "critical", label: "Critical (<3d)" },
          { value: "urgent", label: "Urgent (<14d)" },
          { value: "soon", label: "Soon (<30d)" },
          { value: "calm", label: "Calm (>30d)" },
        ]} />
        <FilterSelect label="Maand" value={monthFilter} onChange={setMonthFilter} options={[
          { value: "all", label: "Alle maanden" },
          ...allMonths.map((m) => ({ value: m, label: m })),
        ]} />
        <span className="text-xs text-ink-500 tabular-nums ml-auto">{filtered.length}/{rows.length} shows</span>
        {(statusFilter !== "all" || showTypeFilter !== "all" || urgencyFilter !== "all" || monthFilter !== "all" || search) && (
          <button
            type="button"
            onClick={() => { setStatusFilter("all"); setShowTypeFilter("all"); setUrgencyFilter("all"); setMonthFilter("all"); setSearch(""); }}
            className="text-xs font-semibold text-ink-700 hover:text-ink-900 underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-x-auto">
        <table className="text-xs min-w-[1800px]">
          <thead>
            <tr className="text-left text-ink-400 text-[10px] uppercase tracking-wider bg-ink-50">
              <th className="px-3 py-3 sticky left-0 bg-ink-50 font-semibold min-w-[200px]">Show</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Score</th>
              <th className="px-3 py-3 font-semibold">Urg</th>
              {PRIMARY_CREW_ROLES.map((r) => (
                <th key={r} className="px-2 py-3 font-semibold text-center" title={CREW_ROLE_LABELS[r]}>{r.toUpperCase()}</th>
              ))}
              <th className="px-3 py-3 font-semibold">Programming</th>
              <th className="px-3 py-3 font-semibold">Soundcheck</th>
              <th className="px-3 py-3 font-semibold">Doors</th>
              <th className="px-3 py-3 font-semibold">Curfew</th>
              {TECH_SECTIONS.map((t) => (
                <th key={t} className="px-2 py-3 font-semibold text-center min-w-[80px]" title={SECTION_LABELS[t]}>{SECTION_LABELS[t]}</th>
              ))}
              <th className="px-3 py-3 font-semibold">Hotel</th>
              <th className="px-3 py-3 font-semibold">Visa</th>
              <th className="px-3 py-3 font-semibold">Riders</th>
              <th className="px-3 py-3 font-semibold">Bottleneck</th>
              <th className="px-3 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {filtered.map(({ booking, artist, festival, stage, advancing, readinessScore, bottleneck, bottleneckTone, ridersAccepted, ridersTotal, ridersDisputed, urgencyLabel, urgencyLevel, crew, sectionPercents }) => (
              <tr key={booking.id} className="hover:bg-ink-50 transition-colors">
                <td className="px-3 py-3 sticky left-0 bg-white">
                  <div className="font-semibold text-ink-900">{artist.name}</div>
                  <div className="text-[10px] text-ink-500">{festival.name} · {stage.name}</div>
                  <div className="text-[10px] text-ink-400 tabular-nums">{booking.show_date} {booking.show_time}</div>
                </td>
                <td className="px-3 py-3 text-[10px] font-bold uppercase">{SHOW_TYPE_LABELS[booking.show_type]}</td>
                <td className="px-3 py-3"><StatusPill tone={statusTone(booking.status)}>{humanStatus(booking.status)}</StatusPill></td>
                <td className="px-3 py-3 font-bold text-ink-900 tabular-nums">{readinessScore ?? "-"}</td>
                <td className="px-3 py-3">
                  {urgencyLabel ? (
                    <span className={`tabular-nums text-[10px] font-bold px-2 py-0.5 rounded ${
                      urgencyLevel === "critical" || urgencyLevel === "urgent" ? "bg-red-50 text-red-700" :
                      urgencyLevel === "soon" ? "bg-amber-50 text-amber-700" :
                      "bg-ink-100 text-ink-700"
                    }`}>{urgencyLabel}</span>
                  ) : <span className="text-ink-300">-</span>}
                </td>
                {PRIMARY_CREW_ROLES.map((r) => {
                  const c = crew.find((x) => x.role === r);
                  return (
                    <td key={r} className="px-2 py-3 text-center">
                      {c?.is_traveling ? (
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${c.flight_status === "confirmed" || c.flight_status === "booked" ? "bg-emerald-500" : c.flight_status === "pending" ? "bg-amber-500" : "bg-ink-300"}`} />
                          <span className="text-[10px] text-ink-700">{c.name.split(" ")[0]}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-300">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-[10px] text-ink-700">{booking.programming_slot ?? "-"}</td>
                <td className="px-3 py-3 text-[10px] text-ink-700">{booking.soundcheck_slot ?? "-"}</td>
                <td className="px-3 py-3 tabular-nums text-[10px]">{booking.doors_time ?? "-"}</td>
                <td className="px-3 py-3 tabular-nums text-[10px]">{booking.curfew_time ?? "-"}</td>
                {TECH_SECTIONS.map((t) => {
                  const p = sectionPercents[t] ?? 0;
                  const tone = p === 100 ? "bg-emerald-500" : p > 0 ? "bg-amber-400" : "bg-ink-200";
                  return (
                    <td key={t} className="px-2 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className={`w-3 h-3 rounded-sm ${tone}`} />
                        <span className="text-[9px] text-ink-500 tabular-nums">{p}%</span>
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-[10px]">
                  <span className={`px-2 py-0.5 rounded ${(sectionPercents.hotel ?? 0) === 100 ? "bg-emerald-50 text-emerald-700" : (sectionPercents.hotel ?? 0) > 0 ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-500"}`}>
                    {(sectionPercents.hotel ?? 0) === 100 ? "booked" : (sectionPercents.hotel ?? 0) > 0 ? "requested" : "-"}
                  </span>
                </td>
                <td className="px-3 py-3 text-[10px]">
                  <span className={`px-2 py-0.5 rounded ${(sectionPercents.visa ?? 0) === 100 ? "bg-emerald-50 text-emerald-700" : (sectionPercents.visa ?? 0) > 0 ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-500"}`}>
                    {(sectionPercents.visa ?? 0) === 100 ? "klaar" : (sectionPercents.visa ?? 0) > 0 ? "in progress" : "-"}
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums text-[10px]">
                  {ridersTotal > 0 ? (
                    <span className={ridersDisputed > 0 ? "text-red-700 font-bold" : ""}>
                      {ridersAccepted}/{ridersTotal}{ridersDisputed > 0 && " ⚠"}
                    </span>
                  ) : "-"}
                </td>
                <td className="px-3 py-3 text-[10px] max-w-[200px]">
                  <span className={bottleneckTone === "bad" ? "text-red-700" : bottleneckTone === "warn" ? "text-amber-700" : "text-emerald-700"}>
                    {bottleneck ?? "-"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {advancing ? (
                    <Link href={`/advancings/${advancing.id}`} className="text-brand-600 font-semibold text-[11px] hover:underline">Open</Link>
                  ) : (
                    <span className="text-ink-300 text-[11px]">-</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={30} className="px-5 py-12 text-center text-sm text-ink-500">
                  Geen shows die aan de filters voldoen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider font-bold text-ink-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ink-50 border border-ink-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
