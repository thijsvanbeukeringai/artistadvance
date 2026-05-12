import type { ReadinessResult } from "@/lib/readiness";

type Stage = { key: string; label: string; done: boolean; current: boolean };

export function computeStages(args: {
  bookingStatus: string;
  readiness: ReadinessResult | null;
}): Stage[] {
  const { bookingStatus, readiness } = args;

  const confirmed = bookingStatus !== "draft";
  const advancingStarted = !!readiness && readiness.score > 0;
  const techDone = !!readiness && readiness.techItems.total > 0 &&
    (readiness.techItems.confirmed + readiness.techItems.accepted) === readiness.techItems.total &&
    readiness.techItems.disputed === 0;
  const ridersOk = !!readiness && readiness.riders.total > 0 &&
    (readiness.riders.accepted + readiness.riders.signed) === readiness.riders.total &&
    readiness.riders.disputed === 0;
  const locked = bookingStatus === "completed" || bookingStatus === "cancelled";

  const stages: Stage[] = [
    { key: "booking", label: "Booking", done: confirmed, current: !confirmed },
    { key: "advancing", label: "Advancing", done: advancingStarted, current: confirmed && !advancingStarted },
    { key: "tech", label: "Tech", done: techDone, current: advancingStarted && !techDone },
    { key: "riders", label: "Riders", done: ridersOk, current: techDone && !ridersOk },
    { key: "ready", label: locked ? "Locked" : "Ready", done: locked || (ridersOk && techDone), current: ridersOk && techDone && !locked },
  ];

  return stages;
}

export default function ShowStageBar({ stages }: { stages: Stage[] }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Voortgang per fase">
      {stages.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1 flex-1">
          <div
            className={[
              "flex items-center gap-1.5 flex-1 px-2 py-1 rounded-md transition",
              s.done
                ? "bg-emerald-50 text-emerald-700"
                : s.current
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                : "bg-ink-50 text-ink-400",
            ].join(" ")}
            title={`${s.label} - ${s.done ? "klaar" : s.current ? "huidige stap" : "wachtend"}`}
          >
            <span className={[
              "w-3.5 h-3.5 rounded-full grid place-items-center text-[8px] font-bold flex-shrink-0",
              s.done ? "bg-emerald-500 text-white" : s.current ? "bg-brand-500 text-white" : "bg-ink-200 text-ink-500",
            ].join(" ")}>
              {s.done ? (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider truncate">{s.label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
