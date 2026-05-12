import type { AdvancingTechItem, TechCategory } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/data";

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
  requested: { bg: "bg-ink-100", text: "text-ink-700", label: "Pending" },
  confirmed: { bg: "bg-sky-50", text: "text-sky-700", label: "Confirmed" },
  not_available: { bg: "bg-amber-50", text: "text-amber-700", label: "Not available" },
  alternative_offered: { bg: "bg-amber-50", text: "text-amber-700", label: "Alternative" },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Accepted" },
  disputed: { bg: "bg-red-50", text: "text-red-700", label: "Disputed" },
};

export default function TechItemsList({ items }: { items: AdvancingTechItem[] }) {
  if (items.length === 0) {
    return (
      <section className="bg-white border border-dashed border-ink-200 rounded-2xl p-8 text-center">
        <h3 className="font-bold text-ink-900">Geen tech requirements</h3>
        <p className="text-sm text-ink-500 mt-1">Er zijn nog geen tech items voor deze advancing. Kloon ze vanuit de artist tech-template.</p>
      </section>
    );
  }

  // Groeperen per categorie
  const grouped: Record<TechCategory, AdvancingTechItem[]> = {
    dj_gear: [], monitors: [], audio: [], light: [], video: [], lasers: [],
    sfx_pyro: [], stage: [], ethernet: [], communication: [], power: [], backline: [],
  };
  for (const item of items) {
    grouped[item.category]?.push(item);
  }

  const total = items.length;
  const confirmed = items.filter((i) => i.status === "confirmed" || i.status === "accepted").length;
  const disputed = items.filter((i) => i.status === "disputed").length;
  const alternative = items.filter((i) => i.status === "alternative_offered" || i.status === "not_available").length;

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
        <div>
          <h3 className="font-bold text-ink-900">Tech requirements (PLEASE CONFIRM)</h3>
          <p className="text-xs text-ink-500 mt-0.5 tabular-nums">{confirmed}/{total} bevestigd · {alternative} alt/niet · {disputed} disputed</p>
        </div>
      </header>

      <div className="divide-y divide-ink-200">
        {Object.entries(grouped).map(([cat, list]) => {
          if (list.length === 0) return null;
          return (
            <div key={cat} className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  {SECTION_LABELS[cat as TechCategory] ?? cat} ({list.length})
                </h4>
              </div>
              <ul className="space-y-2">
                {list.map((item) => {
                  const tone = statusTone[item.status];
                  return (
                    <li key={item.id} className="flex items-start gap-3 text-sm">
                      <span
                        className={`inline-flex items-center justify-center min-w-[100px] px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tone.bg} ${tone.text}`}
                      >
                        {tone.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-medium text-ink-900">{item.item_description}</span>
                          {item.is_mandatory && (
                            <span className="text-[10px] font-bold uppercase text-red-600">mandatory</span>
                          )}
                        </div>
                        {item.artist_notes && (
                          <p className="text-xs text-ink-500 mt-0.5 italic">{item.artist_notes}</p>
                        )}
                        {item.alternative_description && (
                          <p className="text-xs text-amber-700 mt-0.5">↳ Alt: {item.alternative_description}</p>
                        )}
                        {item.festival_response && item.status !== "alternative_offered" && (
                          <p className="text-xs text-ink-500 mt-0.5">Festival: {item.festival_response}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
