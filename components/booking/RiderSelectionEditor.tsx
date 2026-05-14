"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBookingSelectedRidersAction } from "@/lib/actions";
import { RIDER_TYPES, RIDER_TYPE_LABELS, type ArtistRiderTemplate, type RiderType } from "@/lib/types";

export default function RiderSelectionEditor({
  bookingId,
  selected,
  templates,
}: {
  bookingId: string;
  selected: RiderType[];
  templates: ArtistRiderTemplate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<RiderType[]>(selected);

  // Welke rider-types heeft de artist daadwerkelijk geüpload?
  const availableTypes = new Set<RiderType>();
  for (const t of templates) {
    if (!t.show_type) availableTypes.add(t.rider_type);
  }

  function toggle(rt: RiderType) {
    const next = current.includes(rt) ? current.filter((x) => x !== rt) : [...current, rt];
    setCurrent(next);
    startTransition(async () => {
      await setBookingSelectedRidersAction(bookingId, next);
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Riders voor dit show</h3>
        <p className="text-xs text-ink-500 mt-1">
          Welke riders moeten naar het festival portal? Alleen rider-types met een geüploade PDF kun je
          aanvinken.
        </p>
      </header>
      <ul className="divide-y divide-ink-200">
        {RIDER_TYPES.map((rt) => {
          const has = availableTypes.has(rt);
          const checked = current.includes(rt);
          return (
            <li
              key={rt}
              className={`px-5 py-2.5 flex items-center justify-between gap-3 ${
                has ? "hover:bg-ink-50 cursor-pointer" : "opacity-50"
              }`}
              onClick={() => has && !pending && toggle(rt)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!has || pending}
                  onChange={() => has && toggle(rt)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-300"
                />
                <span className="text-sm text-ink-900">{RIDER_TYPE_LABELS[rt]}</span>
              </div>
              {!has && <span className="text-[10px] font-bold uppercase text-ink-400">Geen PDF</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
