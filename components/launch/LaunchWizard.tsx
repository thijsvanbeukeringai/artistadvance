"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLaunchStepAction, commitLaunchAction } from "@/lib/actions";
import {
  RIDER_TYPES,
  RIDER_TYPE_LABELS,
  type ArtistRiderTemplate,
  type RiderType,
} from "@/lib/types";

type Step = 1 | 2;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Riders" },
  { id: 2, label: "Review & launch" },
];

export default function LaunchWizard({
  bookingId,
  artistName,
  festivalName,
  showDate,
  draftId,
  initialSelected,
  templates,
}: {
  bookingId: string;
  artistName: string;
  festivalName: string;
  showDate: string;
  draftId: string;
  initialSelected: RiderType[];
  templates: ArtistRiderTemplate[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<RiderType[]>(
    initialSelected.length > 0 ? initialSelected : ["technical", "hospitality"],
  );
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const available = useMemo(() => {
    const s = new Set<RiderType>();
    for (const t of templates) if (!t.show_type) s.add(t.rider_type);
    return s;
  }, [templates]);

  // Stable idempotency key per draft → dubbelklik is veilig.
  const idempotencyKey = useMemo(() => `launch_${draftId}`, [draftId]);

  function toggle(rt: RiderType) {
    setSelected((cur) => (cur.includes(rt) ? cur.filter((x) => x !== rt) : [...cur, rt]));
  }

  function next() {
    startTransition(async () => {
      await saveLaunchStepAction(bookingId, draftId, {
        current_step: 2,
        state: { selected_riders: selected },
      });
      setStep(2);
    });
  }

  function launch() {
    setErr(null);
    startTransition(async () => {
      const r = await commitLaunchAction(bookingId, draftId, idempotencyKey);
      if (!r.ok) {
        setErr(r.error ?? "Launch faalde");
        return;
      }
      router.push(`/advancings/${r.advancingId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${
                  active
                    ? "bg-brand-500 text-white"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-ink-100 text-ink-500"
                }`}
              >
                {done ? "✓" : s.id}
              </span>
              <span className={active ? "font-bold text-ink-900" : "text-ink-500"}>{s.label}</span>
              {i < STEPS.length - 1 && <span className="text-ink-300 mx-2">—</span>}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <header className="px-5 py-4 border-b border-ink-200">
            <h3 className="font-bold text-ink-900">Riders meesturen</h3>
            <p className="text-xs text-ink-500 mt-1">
              Kies welke riders het festival straks ziet en kan ondertekenen. Riders zonder PDF zijn
              uitgegrijsd — upload eerst in artist settings.
            </p>
          </header>
          <ul className="divide-y divide-ink-200">
            {RIDER_TYPES.map((rt) => {
              const has = available.has(rt);
              const checked = selected.includes(rt);
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
                  {!has && (
                    <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Geen PDF
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5 space-y-5">
          <header>
            <h3 className="font-bold text-ink-900">Klaar om te launchen</h3>
            <p className="text-xs text-ink-500 mt-1">
              Bij launch wordt de booking bevestigd, de advancing aangemaakt, riders + tech requirements
              geseed, en de Dropbox show-folder aangemaakt.
            </p>
          </header>

          <div className="bg-ink-50 border border-ink-200 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-ink-500">Show</span>
              <span className="font-bold text-ink-900 text-right">
                {artistName} @ {festivalName} — {showDate}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-500">Riders meesturen</span>
              <span className="font-bold text-ink-900 text-right">
                {selected.length === 0
                  ? "geen"
                  : selected.map((r) => RIDER_TYPE_LABELS[r]).join(", ")}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-500">Mail naar festival</span>
              <span className="text-ink-400 italic text-right">Komt later (handmatig)</span>
            </div>
          </div>

          {err && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>
          )}
        </section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(`/bookings/${bookingId}`)}
          className="text-xs px-3 py-2 rounded-md text-ink-500 hover:text-ink-900 transition"
        >
          ← Terug naar booking
        </button>
        <div className="flex items-center gap-2">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={pending}
              className="text-xs px-3 py-2 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold disabled:opacity-50"
            >
              ← Vorige
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              onClick={next}
              disabled={pending}
              className="text-xs px-4 py-2 rounded-md bg-ink-900 text-white hover:bg-black transition font-semibold disabled:opacity-50"
            >
              {pending ? "Opslaan..." : "Volgende →"}
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={launch}
              disabled={pending}
              className="text-sm px-5 py-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 transition font-bold disabled:opacity-50"
            >
              {pending ? "Bezig met launchen..." : "LAUNCH SHOW"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
