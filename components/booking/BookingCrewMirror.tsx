import Link from "next/link";
import type { BookingCrew } from "@/lib/types";

export default function BookingCrewMirror({
  bookingId,
  crew,
  advancingId,
  advancingAccess,
}: {
  bookingId: string;
  crew: BookingCrew[];
  advancingId: string | null;
  advancingAccess: boolean;
}) {
  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink-900 text-sm">Crew die meekomt</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Aangemeld door het advancing-team — hier read-only zichtbaar zodat je weet wie er komt voor accreditatie/guestlist.</p>
        </div>
        {advancingAccess && advancingId && (
          <Link href={`/advancings/${advancingId}`} className="text-xs font-semibold text-brand-700 hover:underline">
            Beheer in advancing →
          </Link>
        )}
      </header>
      <div className="p-5">
        {!advancingId ? (
          <div className="text-xs text-ink-500 italic">Crew-aanmelding start zodra je de booking bevestigt.</div>
        ) : crew.length === 0 ? (
          <div className="text-xs text-ink-500 italic">Advancing-team heeft nog niemand aangemeld.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {crew.map((c) => (
              <div key={c.id} className="bg-ink-50 border border-ink-200 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-900 text-white">{c.role}</span>
                  <span className="font-semibold text-ink-900 text-sm truncate">{c.name}</span>
                </div>
                <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-2 flex-wrap">
                  {c.is_traveling && <span>✈ Reist mee</span>}
                  {c.needs_flight && <span>📋 Vlucht nodig</span>}
                  {c.flight_status && <span className="capitalize">· {c.flight_status}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
