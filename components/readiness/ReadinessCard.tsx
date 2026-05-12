import Link from "next/link";
import type { ReadinessResult } from "@/lib/readiness";
import { humanStatus } from "@/components/StatusPill";

const fillFor = (tone: "ok" | "partial" | "empty") =>
  tone === "ok" ? "bg-emerald-500" : tone === "partial" ? "bg-amber-400" : "bg-ink-200";

const urgencyBg: Record<string, string> = {
  ok: "bg-ink-100 text-ink-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-ink-50 text-ink-400",
};

export default function ReadinessCard({
  href,
  artistName,
  festivalName,
  stageName,
  showDate,
  showTime,
  showType,
  advancingStatus,
  readiness,
}: {
  href: string;
  artistName: string;
  festivalName: string;
  stageName: string;
  showDate: string;
  showTime: string;
  showType?: string;
  advancingStatus: string;
  readiness: ReadinessResult;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-ink-200 rounded-2xl shadow-card p-5 transition-all duration-200 hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 block"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white font-bold flex-shrink-0">
            {artistName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink-900 truncate">{artistName}</span>
              {showType && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">
                  {showType}
                </span>
              )}
            </div>
            <div className="text-xs text-ink-400 truncate">{festivalName} · {stageName}</div>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${urgencyBg[readiness.urgency.tone]}`}>
          {readiness.urgency.label}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-3xl font-extrabold text-ink-900 tabular-nums">{readiness.score}</div>
        <div className="text-xs text-ink-400 mb-0.5">readiness · {showDate} {showTime}</div>
      </div>

      {/* Bucket bars - 6 (of 5 zonder visa) */}
      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${readiness.buckets.length}, 1fr)` }}>
        {readiness.buckets.map((b) => (
          <div key={b.bucket} className="space-y-1">
            <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div className={`h-full ${fillFor(b.tone)}`} style={{ width: `${b.percent}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-ink-400">
              <span className="font-semibold">{b.label}</span>
              <span className="tabular-nums">{b.percent}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tech items strip */}
      {readiness.techItems.total > 0 && (
        <div className="mt-3 flex items-center gap-2 text-[11px] flex-wrap">
          <span className="bg-ink-100 text-ink-700 rounded-full px-2 py-1 font-semibold tabular-nums">
            Tech items {readiness.techItems.confirmed + readiness.techItems.accepted}/{readiness.techItems.total}
          </span>
          {readiness.techItems.disputed > 0 && (
            <span className="bg-red-50 text-red-700 rounded-full px-2 py-1 font-semibold">{readiness.techItems.disputed} disputed</span>
          )}
          {readiness.techItems.alternative_offered > 0 && (
            <span className="bg-amber-50 text-amber-700 rounded-full px-2 py-1 font-semibold">{readiness.techItems.alternative_offered} alt</span>
          )}
        </div>
      )}

      {/* Rider strip */}
      <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
        {readiness.riders.items.map((r, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-semibold ${
              r.tone === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : r.tone === "bad"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {r.type === "technical" ? "Tech" : r.type === "hospitality" ? "Hosp." : "SFX/Pyro"} · {humanStatus(r.status)}
          </span>
        ))}
      </div>

      {/* Bottleneck callout */}
      <div
        className={`mt-4 px-3 py-2 rounded-lg text-xs font-medium ${
          readiness.bottleneck.tone === "bad"
            ? "bg-red-50 text-red-700"
            : readiness.bottleneck.tone === "warn"
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
        role="status"
      >
        <span className="font-bold mr-1">{readiness.bottleneck.kind === "none" ? "Klaar:" : "Blocker:"}</span>
        {readiness.bottleneck.reason}
      </div>
    </Link>
  );
}
