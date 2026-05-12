"use client";

import { useTransition } from "react";
import { switchToArtistAction } from "@/lib/actions";
import type { ReadinessResult } from "@/lib/readiness";

const fillFor = (tone: "ok" | "partial" | "empty") =>
  tone === "ok" ? "bg-emerald-500" : tone === "partial" ? "bg-amber-400" : "bg-ink-200";

const scoreColor = (score: number) =>
  score >= 90 ? "bg-emerald-500" : score >= 60 ? "bg-amber-400" : "bg-red-500";

export type RosterSummary = {
  artistId: string;
  artistName: string;
  showsTotal: number;
  showsUpcoming: number;
  avgReadiness: number | null;
  ridersDisputed: number;
  techDisputed: number;
  nextShow: {
    festival: string;
    stage: string;
    date: string;
    time: string;
    daysLabel: string;
    daysTone: "ok" | "warn" | "bad" | "neutral";
    readiness: ReadinessResult | null;
    bottleneck: string | null;
    bottleneckTone: "ok" | "warn" | "bad" | "neutral" | null;
  } | null;
};

const urgencyBg: Record<string, string> = {
  ok: "bg-ink-100 text-ink-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-ink-50 text-ink-400",
};

export default function ArtistRosterCard({ data }: { data: RosterSummary }) {
  const [pending, startTransition] = useTransition();
  const score = data.avgReadiness ?? 0;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await switchToArtistAction(data.artistId); })}
      className="text-left group bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden hover:border-brand-400 hover:shadow-md transition-all duration-200 flex flex-col disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
    >
      {/* PROGRESSBAR BOVENAAN - avg readiness */}
      <div className="relative h-2 bg-ink-100" aria-label={`Avg readiness ${score}%`}>
        <div className={`h-full transition-all duration-300 ${scoreColor(score)}`} style={{ width: `${score}%` }} />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white text-xl font-extrabold flex-shrink-0">
            {data.artistName.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink-900 truncate text-base">{data.artistName}</div>
            <div className="text-xs text-ink-500 tabular-nums mt-0.5">
              {data.showsUpcoming} aankomend · {data.showsTotal} totaal
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-ink-900 tabular-nums leading-none">{data.avgReadiness ?? "-"}</div>
            <div className="text-[9px] text-ink-400 uppercase tracking-wider mt-0.5">avg score</div>
          </div>
        </div>

        {/* Issues */}
        {(data.ridersDisputed > 0 || data.techDisputed > 0) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {data.ridersDisputed > 0 && (
              <span className="text-[11px] font-semibold bg-red-50 text-red-700 rounded-full px-2 py-0.5 tabular-nums">
                {data.ridersDisputed} rider disputed
              </span>
            )}
            {data.techDisputed > 0 && (
              <span className="text-[11px] font-semibold bg-red-50 text-red-700 rounded-full px-2 py-0.5 tabular-nums">
                {data.techDisputed} tech disputed
              </span>
            )}
          </div>
        )}

        {/* Next show */}
        {data.nextShow ? (
          <div className="mt-4 rounded-xl bg-ink-50 px-4 py-3 border border-ink-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-ink-500">Volgende show</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${urgencyBg[data.nextShow.daysTone]}`}>
                {data.nextShow.daysLabel}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-ink-900 truncate">{data.nextShow.festival}</div>
            <div className="text-[11px] text-ink-500 tabular-nums">{data.nextShow.stage} · {data.nextShow.date} {data.nextShow.time}</div>
            {data.nextShow.readiness && (
              <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${data.nextShow.readiness.buckets.length}, 1fr)` }}>
                {data.nextShow.readiness.buckets.map((b) => (
                  <div key={b.bucket} className="h-1 rounded-full bg-ink-100 overflow-hidden" title={`${b.label} · ${b.percent}%`}>
                    <div className={`h-full ${fillFor(b.tone)}`} style={{ width: `${b.percent}%` }} />
                  </div>
                ))}
              </div>
            )}
            {data.nextShow.bottleneck && (
              <div className={`mt-2 text-[11px] font-medium ${
                data.nextShow.bottleneckTone === "bad"
                  ? "text-red-700"
                  : data.nextShow.bottleneckTone === "warn"
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}>
                ↳ {data.nextShow.bottleneck}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-500 text-center">
            Geen aankomende shows ingepland.
          </div>
        )}

        {/* CTA hint */}
        <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
          <span className="text-xs text-ink-500">Open volledige artist-workspace</span>
          <span className="text-brand-600 group-hover:translate-x-1 transition-transform text-sm font-bold">→</span>
        </div>
      </div>
    </button>
  );
}
