import type { ReadinessResult, BucketSignal, RiderSignal } from "@/lib/readiness";

const bucketDot: Record<BucketSignal["tone"], string> = {
  ok: "bg-emerald-500",
  partial: "bg-amber-400",
  empty: "bg-ink-200",
};

const riderToneBg: Record<RiderSignal["tone"], string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-400",
  bad: "bg-red-500",
};

const urgencyClass: Record<string, string> = {
  ok: "text-ink-500 bg-ink-100",
  warn: "text-amber-700 bg-amber-50",
  bad: "text-red-700 bg-red-50",
  neutral: "text-ink-400 bg-ink-50",
};

export default function ReadinessRow({
  readiness,
  size = "md",
  showBottleneck = true,
}: {
  readiness: ReadinessResult | null;
  size?: "sm" | "md";
  showBottleneck?: boolean;
}) {
  if (!readiness) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <span className="inline-flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-200" />
          ))}
        </span>
        <span>geen advancing</span>
      </div>
    );
  }

  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const pillPad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";

  const aria = `Voortgang per categorie: ${readiness.buckets.map((b) => `${b.label} ${b.percent}%`).join(", ")}`;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="inline-flex items-center gap-1" aria-label={aria}>
        {readiness.buckets.map((b) => (
          <span
            key={b.bucket}
            title={`${b.label} · ${b.percent}%${b.detail ? ` (${b.detail})` : ""}`}
            className={`${dotSize} rounded-full ${bucketDot[b.tone]}`}
          />
        ))}
      </div>

      <div className="inline-flex items-center gap-1">
        {readiness.riders.items.length === 0 ? (
          <span className="text-[10px] text-ink-300">geen riders</span>
        ) : (
          <span className={`inline-flex items-center gap-1 rounded-full ${pillPad} font-semibold tabular-nums ${
            readiness.riders.tone === "bad"
              ? "bg-red-50 text-red-700"
              : readiness.riders.tone === "warn"
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}>
            <span className={`${dotSize} rounded-full ${riderToneBg[readiness.riders.tone]}`} />
            R {readiness.riders.accepted + readiness.riders.signed}/{readiness.riders.total}
            {readiness.riders.disputed > 0 && <span className="ml-0.5 text-red-700 font-bold">!</span>}
          </span>
        )}
      </div>

      {readiness.techItems.total > 0 && (
        <span
          title={`Tech items: ${readiness.techItems.confirmed + readiness.techItems.accepted}/${readiness.techItems.total} bevestigd`}
          className={`inline-flex items-center gap-1 rounded-full ${pillPad} font-semibold tabular-nums ${
            readiness.techItems.disputed > 0
              ? "bg-red-50 text-red-700"
              : readiness.techItems.alternative_offered + readiness.techItems.not_available > 0
              ? "bg-amber-50 text-amber-700"
              : (readiness.techItems.confirmed + readiness.techItems.accepted) === readiness.techItems.total
              ? "bg-emerald-50 text-emerald-700"
              : "bg-ink-100 text-ink-700"
          }`}
        >
          T {readiness.techItems.confirmed + readiness.techItems.accepted}/{readiness.techItems.total}
        </span>
      )}

      <span className={`inline-flex items-center rounded-full font-bold tabular-nums ${pillPad} ${urgencyClass[readiness.urgency.tone]}`}>
        {readiness.urgency.label}
      </span>

      {showBottleneck && (
        <span
          className={`text-[11px] font-medium truncate ${
            readiness.bottleneck.tone === "bad"
              ? "text-red-700"
              : readiness.bottleneck.tone === "warn"
              ? "text-amber-700"
              : "text-emerald-700"
          }`}
          title={readiness.bottleneck.reason}
        >
          {readiness.bottleneck.kind === "none" ? "Klaar" : readiness.bottleneck.reason}
        </span>
      )}
    </div>
  );
}
