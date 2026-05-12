import Link from "next/link";

type Step = { label: string; description?: string };

export default function PageIntro({
  eyebrow,
  title,
  description,
  steps,
  primaryCta,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  steps?: Step[];
  primaryCta?: { label: string; href: string };
}) {
  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-1">{eyebrow}</div>
          )}
          <h2 className="text-xl font-extrabold text-ink-900">{title}</h2>
          <p className="text-sm text-ink-500 mt-1">{description}</p>
        </div>
        {primaryCta && (
          <Link
            href={primaryCta.href}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
          >
            {primaryCta.label} →
          </Link>
        )}
      </div>
      {steps && steps.length > 0 && (
        <ol className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3 rounded-lg bg-ink-50 px-4 py-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs grid place-items-center tabular-nums">
                {i + 1}
              </span>
              <div>
                <div className="text-xs font-bold text-ink-900">{s.label}</div>
                {s.description && <div className="text-[11px] text-ink-500 mt-0.5">{s.description}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
