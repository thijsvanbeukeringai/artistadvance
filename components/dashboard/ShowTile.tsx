import Link from "next/link";
import type { ReadinessResult } from "@/lib/readiness";
import ShowStageBar, { computeStages } from "./ShowStageBar";

const fillFor = (tone: "ok" | "partial" | "empty") =>
  tone === "ok" ? "bg-emerald-500" : tone === "partial" ? "bg-amber-400" : "bg-ink-200";

const urgencyBg: Record<string, string> = {
  ok: "bg-ink-100 text-ink-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-ink-50 text-ink-400",
};

const scoreColor = (score: number) =>
  score >= 90 ? "bg-emerald-500" : score >= 60 ? "bg-amber-400" : "bg-red-500";

export default function ShowTile({
  href,
  artistName,
  showArtistName = true,
  festivalName,
  stageName,
  showDate,
  showTime,
  showType,
  bookingStatus,
  readiness,
}: {
  href: string;
  artistName: string;
  showArtistName?: boolean;
  festivalName: string;
  stageName: string;
  showDate: string;
  showTime: string;
  showType: string;
  bookingStatus: string;
  readiness: ReadinessResult | null;
}) {
  const score = readiness?.score ?? 0;
  const stages = computeStages({ bookingStatus, readiness });

  return (
    <Link
      href={href}
      className="group bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden hover:border-brand-400 hover:shadow-md transition-all duration-200 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
    >
      {/* PROGRESSBAR BOVENAAN - verplicht volgens spec */}
      <div className="relative h-2 bg-ink-100" aria-label={`Readiness ${score}%`}>
        <div
          className={`h-full transition-all duration-300 ${scoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {showArtistName && (
                <span className="font-bold text-ink-900 truncate">{artistName}</span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">
                {showType}
              </span>
            </div>
            <div className="text-xs text-ink-500 mt-0.5 truncate">{festivalName} · {stageName}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-ink-900 tabular-nums leading-none">{score}</div>
            <div className="text-[9px] text-ink-400 uppercase tracking-wider mt-0.5">readiness</div>
          </div>
        </div>

        {/* Show date + urgency */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="text-sm tabular-nums">
            <span className="font-bold text-ink-900">{showDate}</span>
            <span className="text-ink-400 mx-1">·</span>
            <span className="text-ink-500">{showTime}</span>
          </div>
          {readiness && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${urgencyBg[readiness.urgency.tone]}`}>
              {readiness.urgency.label}
            </span>
          )}
        </div>

        {/* Stage-fasen indicator - bookkeeping flow */}
        <div className="mt-3">
          <ShowStageBar stages={stages} />
        </div>

        {/* Sectie-buckets dot strip */}
        {readiness && readiness.buckets.length > 0 && (
          <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${readiness.buckets.length}, 1fr)` }}>
            {readiness.buckets.map((b) => (
              <div key={b.bucket} className="space-y-0.5">
                <div className="h-1 rounded-full bg-ink-100 overflow-hidden">
                  <div className={`h-full ${fillFor(b.tone)}`} style={{ width: `${b.percent}%` }} />
                </div>
                <div className="text-[9px] text-ink-400 text-center font-semibold">{b.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Riders + tech items */}
        {readiness && (
          <div className="mt-3 flex items-center gap-2 text-[10px] flex-wrap">
            {readiness.riders.total > 0 && (
              <span className={`px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                readiness.riders.disputed > 0
                  ? "bg-red-50 text-red-700"
                  : readiness.riders.tone === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                R {readiness.riders.accepted + readiness.riders.signed}/{readiness.riders.total}
              </span>
            )}
            {readiness.techItems.total > 0 && (
              <span className={`px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                readiness.techItems.disputed > 0
                  ? "bg-red-50 text-red-700"
                  : "bg-ink-100 text-ink-700"
              }`}>
                T {readiness.techItems.confirmed + readiness.techItems.accepted}/{readiness.techItems.total}
              </span>
            )}
          </div>
        )}

        {/* Bottleneck */}
        {readiness && (
          <div className={`mt-auto pt-3 text-[11px] font-medium ${
            readiness.bottleneck.tone === "bad"
              ? "text-red-700"
              : readiness.bottleneck.tone === "warn"
              ? "text-amber-700"
              : "text-emerald-700"
          }`}>
            {readiness.bottleneck.kind === "none" ? "✓ Klaar voor show" : `↳ ${readiness.bottleneck.reason}`}
          </div>
        )}

        {!readiness && (
          <div className="mt-auto pt-3 text-[11px] text-ink-400 italic">Nog geen advancing aangemaakt.</div>
        )}
      </div>
    </Link>
  );
}
