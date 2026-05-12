import Link from "next/link";
import type { AttentionItem } from "@/lib/readiness";
import ReadinessRow from "./ReadinessRow";

const urgencyAccent: Record<string, string> = {
  bad: "border-l-red-500",
  warn: "border-l-amber-500",
  ok: "border-l-ink-200",
  neutral: "border-l-ink-200",
};

export default function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="font-bold text-ink-900">Aandacht nodig</h3>
        </div>
        <p className="text-sm text-emerald-700 mt-1">Niets dringend. Alle lopende advancings zijn op schema.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <h3 className="font-bold text-ink-900">Aandacht nodig</h3>
          <span className="text-xs text-ink-400 ml-1">top {items.length}</span>
        </div>
        <Link href="/advancings" className="text-xs font-semibold text-brand-700 hover:underline">Bekijk alles</Link>
      </header>
      <ul className="divide-y divide-ink-200">
        {items.map((item) => (
          <li key={item.advancing.id} className={`flex items-center gap-4 px-5 py-3 border-l-4 ${urgencyAccent[item.readiness.urgency.tone] ?? "border-l-ink-200"}`}>
            <span className="inline-flex items-center justify-center min-w-[44px] h-7 rounded-md bg-ink-100 text-xs font-bold tabular-nums text-ink-700">
              {item.readiness.urgency.label}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-ink-900 truncate">{item.artistName}</span>
                <span className="text-ink-300">·</span>
                <span className="text-xs text-ink-500 truncate">{item.festivalName}</span>
              </div>
              <div className="mt-1.5">
                <ReadinessRow readiness={item.readiness} size="sm" />
              </div>
            </div>
            <Link
              href={`/advancings/${item.advancing.id}`}
              className="text-brand-600 text-sm font-semibold hover:underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded"
            >
              Open →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
