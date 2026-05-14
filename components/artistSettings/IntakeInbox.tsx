"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptIntakeAction, declineIntakeAction } from "@/lib/actions";
import type { BookingIntake } from "@/lib/types";

export default function IntakeInbox({
  artistId,
  intakes,
}: {
  artistId: string;
  intakes: BookingIntake[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept(id: string) {
    startTransition(async () => {
      const r = await acceptIntakeAction(id, artistId);
      if (r.ok) router.push(`/bookings/${r.bookingId}/launch`);
    });
  }

  function decline(id: string) {
    if (!confirm("Aanvraag weigeren?")) return;
    startTransition(async () => {
      await declineIntakeAction(id, artistId);
      router.refresh();
    });
  }

  const pendingIntakes = intakes.filter((i) => i.status === "pending");

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">
          Show-aanvragen
          {pendingIntakes.length > 0 && (
            <span className="ml-2 text-[10px] font-bold uppercase bg-brand-500 text-white px-1.5 py-0.5 rounded">
              {pendingIntakes.length} nieuw
            </span>
          )}
        </h3>
        <p className="text-xs text-ink-500 mt-1">Aanvragen via je intake-link. Accepteer = booking aanmaken (advance-only).</p>
      </header>
      {pendingIntakes.length === 0 ? (
        <div className="px-5 py-8 text-sm text-ink-400">Geen openstaande aanvragen.</div>
      ) : (
        <ul className="divide-y divide-ink-200">
          {pendingIntakes.map((i) => (
            <li key={i.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900">{i.festival_name}</div>
                <div className="text-xs text-ink-500 mt-0.5">
                  {i.show_date}{i.show_time ? ` om ${i.show_time}` : ""}
                  {i.venue_city ? ` · ${i.venue_city}` : ""}
                  {i.stage_name ? ` · ${i.stage_name}` : ""}
                  {i.fee ? ` · €${i.fee}` : ""}
                </div>
                <div className="text-xs text-ink-700 mt-2">
                  <span className="font-semibold">{i.promoter_name}</span>
                  {i.promoter_company ? ` (${i.promoter_company})` : ""}
                  {" — "}<a href={`mailto:${i.promoter_email}`} className="text-brand-700 hover:underline">{i.promoter_email}</a>
                  {i.promoter_phone ? ` · ${i.promoter_phone}` : ""}
                </div>
                {i.notes && (
                  <div className="text-xs text-ink-500 mt-2 italic">{i.notes}</div>
                )}
                <div className="text-[10px] text-ink-400 mt-2 tabular-nums">
                  Ontvangen {new Date(i.created_at).toLocaleString("nl-NL")}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => decline(i.id)}
                  className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold disabled:opacity-50"
                >
                  Weiger
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => accept(i.id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
                >
                  Accepteer →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
