"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTechItemStatusAction } from "@/lib/actions";
import type { AdvancingTechItem, TechCategory, TechItemStatus } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/data";

const STATUS_BUTTONS: { status: TechItemStatus; label: string; tone: string }[] = [
  { status: "confirmed", label: "Confirm", tone: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { status: "alternative_offered", label: "Alternatief", tone: "bg-amber-500 text-white hover:bg-amber-600" },
  { status: "not_available", label: "Niet beschikbaar", tone: "bg-red-600 text-white hover:bg-red-700" },
];

const STATUS_TONE_PILL: Record<TechItemStatus, { bg: string; text: string; label: string }> = {
  requested: { bg: "bg-ink-100", text: "text-ink-700", label: "Pending" },
  confirmed: { bg: "bg-sky-50", text: "text-sky-700", label: "Confirmed" },
  not_available: { bg: "bg-amber-50", text: "text-amber-700", label: "Not avail" },
  alternative_offered: { bg: "bg-amber-50", text: "text-amber-700", label: "Alt offered" },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Accepted" },
  disputed: { bg: "bg-red-50", text: "text-red-700", label: "Disputed" },
};

export default function PleaseConfirmList({ items }: { items: AdvancingTechItem[] }) {
  const grouped: Record<TechCategory, AdvancingTechItem[]> = {
    dj_gear: [], monitors: [], audio: [], light: [], video: [], lasers: [],
    sfx_pyro: [], stage: [], ethernet: [], communication: [], power: [], backline: [],
  };
  for (const item of items) grouped[item.category]?.push(item);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, list]) => {
        if (list.length === 0) return null;
        const confirmed = list.filter((i) => i.status === "confirmed" || i.status === "accepted").length;
        return (
          <section key={cat} className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
              <h3 className="font-bold text-ink-900">{SECTION_LABELS[cat as TechCategory]} ({list.length})</h3>
              <span className="text-xs text-ink-500 tabular-nums">{confirmed}/{list.length} bevestigd</span>
            </header>
            <ul className="divide-y divide-ink-200">
              {list.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ItemRow({ item }: { item: AdvancingTechItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAltForm, setShowAltForm] = useState(false);
  const [altText, setAltText] = useState(item.alternative_description ?? "");

  const tone = STATUS_TONE_PILL[item.status];

  function handleStatus(status: TechItemStatus, alternative?: string) {
    startTransition(async () => {
      await setTechItemStatusAction(item.id, {
        status,
        alternative_description: alternative,
      });
      setShowAltForm(false);
      // Forceer hydratie van de server-component zodat de pill + counts updaten.
      router.refresh();
    });
  }

  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4">
        <span className={`min-w-[100px] inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tone.bg} ${tone.text}`}>
          {tone.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium text-ink-900">{item.item_description}</span>
            {item.is_mandatory && <span className="text-[10px] font-bold uppercase text-red-600">mandatory</span>}
          </div>
          {item.artist_notes && <p className="text-xs text-ink-500 mt-0.5 italic">Artist note: {item.artist_notes}</p>}
          {item.alternative_description && (
            <p className="text-xs text-amber-700 mt-0.5">↳ Alt: {item.alternative_description}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {STATUS_BUTTONS.map((btn) => (
          <button
            key={btn.status}
            type="button"
            disabled={pending}
            onClick={() => {
              if (btn.status === "alternative_offered") {
                setShowAltForm(true);
              } else {
                handleStatus(btn.status);
              }
            }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition disabled:opacity-50 ${btn.tone}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {showAltForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStatus("alternative_offered", altText);
          }}
          className="mt-3 flex items-end gap-2 bg-amber-50 p-3 rounded-lg"
        >
          <label className="flex-1">
            <span className="block text-xs font-semibold text-amber-800 mb-1">Welk alternatief bieden jullie?</span>
            <input
              required
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Bijv. DJM-A9 i.p.v. DJM-V10"
              className="w-full bg-white border border-amber-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-amber-700 transition disabled:opacity-50"
          >
            Verzenden
          </button>
          <button
            type="button"
            onClick={() => setShowAltForm(false)}
            className="text-xs text-ink-500 px-2 py-2 hover:text-ink-900"
          >
            Annuleer
          </button>
        </form>
      )}
    </li>
  );
}
