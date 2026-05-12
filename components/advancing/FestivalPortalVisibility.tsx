"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFestivalPortalVisibilityAction } from "@/lib/actions";

type SectionKey = "tech" | "program" | "hotel" | "distances" | "travel" | "documents" | "riders";

const SECTIONS: { key: SectionKey; label: string; group: string; desc: string }[] = [
  { key: "program", label: "Run of show", group: "Run of show", desc: "Schedule: load-in, soundcheck, doors, show, load-out." },
  { key: "tech", label: "Tech requirements", group: "Technical", desc: "PLEASE CONFIRM lijst met alle tech items per categorie." },
  { key: "travel", label: "Vluchten + transfers", group: "Transport", desc: "Inbound/outbound vluchten en ground-transfers airport ↔ hotel ↔ venue." },
  { key: "distances", label: "Distances", group: "Transport", desc: "Afstanden in km/minuten tussen airport, hotel en venue." },
  { key: "hotel", label: "Hotel proposals", group: "Hotel", desc: "Hotel-opties die het festival voorstelt." },
  { key: "documents", label: "Festival documents", group: "Documents", desc: "Plek waar festival hun tech pack / parking map kan uploaden." },
  { key: "riders", label: "Signed riders", group: "Riders", desc: "Technische + hospitality rider tekenen of uploaden." },
];

export default function FestivalPortalVisibility({
  advancingId,
  initialHidden,
}: {
  advancingId: string;
  initialHidden: SectionKey[];
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<SectionKey>>(new Set(initialHidden));
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  function toggle(key: SectionKey) {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHidden(next);
    setFeedback(null);
  }

  function save() {
    start(async () => {
      const res = await setFestivalPortalVisibilityAction(advancingId, Array.from(hidden));
      if (!res.ok) {
        setFeedback({ tone: "err", msg: res.error });
        return;
      }
      setFeedback({ tone: "ok", msg: "Opgeslagen. Festival-portal toont nu alleen de aangevinkte secties." });
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="font-bold text-ink-900">Festival-portal weergave</h3>
          <p className="text-xs text-ink-500 mt-1 max-w-2xl">
            Vink uit wat het festival voor deze show NIET hoeft te zien. Standaard is alles zichtbaar.
            Wijziging is alleen voor deze advancing — andere shows blijven onveranderd.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50"
        >
          {pending ? "Bezig..." : "Opslaan"}
        </button>
      </div>

      <ul className="divide-y divide-ink-200 border-y border-ink-200">
        {SECTIONS.map((s, i) => {
          const visible = !hidden.has(s.key);
          const showGroupLabel = i === 0 || SECTIONS[i - 1].group !== s.group;
          return (
            <li key={s.key} className="py-3 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggle(s.key)}
                  className="w-4 h-4 rounded border-ink-300 text-emerald-600 focus:ring-emerald-400"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-900">{s.label}</span>
                    {showGroupLabel && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-ink-100 text-ink-500 px-1.5 py-0.5 rounded">
                        {s.group}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500">{s.desc}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                  visible ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
                }`}>
                  {visible ? "Zichtbaar" : "Verborgen"}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {feedback && (
        <p
          role="status"
          className={`text-xs mt-3 ${feedback.tone === "ok" ? "text-emerald-700" : "text-red-700"}`}
        >
          {feedback.msg}
        </p>
      )}
    </section>
  );
}
