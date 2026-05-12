import Link from "next/link";

type Step = {
  num: number;
  done: boolean;
  title: string;
  description: string;
  cta: { label: string; href: string };
};

export default function GetStarted({
  steps,
  mode,
  onDismissable = true,
}: {
  steps: Step[];
  mode: "artist" | "agency";
  onDismissable?: boolean;
}) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completed === total;

  if (allDone) return null;

  const next = steps.find((s) => !s.done);

  return (
    <section className="bg-gradient-to-br from-brand-50 via-white to-ink-50 border border-brand-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-6 py-5 border-b border-brand-100 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Begin hier</div>
          <h2 className="text-xl font-extrabold text-ink-900 mt-1">
            {mode === "agency" ? "Zet je agency-workspace op" : "Zet de artiest klaar voor advancing"}
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {completed} van {total} stappen klaar - volgende: <span className="font-semibold text-ink-900">{next?.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 rounded-full bg-ink-100 overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${(completed / total) * 100}%` }} />
          </div>
          <span className="text-xs font-bold tabular-nums text-ink-700">{completed}/{total}</span>
        </div>
      </header>

      <ol className="divide-y divide-brand-100">
        {steps.map((step) => (
          <li
            key={step.num}
            className={`px-6 py-4 flex items-start gap-4 ${step.done ? "opacity-60" : ""}`}
          >
            <div
              className={[
                "flex-shrink-0 w-8 h-8 rounded-full grid place-items-center font-bold text-sm tabular-nums",
                step.done ? "bg-emerald-500 text-white" : step === next ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500",
              ].join(" ")}
            >
              {step.done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              ) : (
                step.num
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold ${step.done ? "text-ink-500 line-through" : "text-ink-900"}`}>{step.title}</div>
              <p className="text-xs text-ink-500 mt-0.5">{step.description}</p>
            </div>
            {!step.done && (
              <Link
                href={step.cta.href}
                className={[
                  "text-xs font-semibold px-3 py-2 rounded-md whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2",
                  step === next ? "bg-ink-900 text-white hover:bg-black" : "bg-white border border-ink-200 text-ink-700 hover:border-brand-400",
                ].join(" ")}
              >
                {step.cta.label} →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
