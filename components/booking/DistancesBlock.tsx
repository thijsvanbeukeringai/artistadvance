import type { Distances } from "@/lib/types";

export default function DistancesBlock({ distances }: { distances: Distances }) {
  const filled = Object.values(distances).filter((v) => v !== undefined && v !== null).length;
  const Row = ({ label, km, min }: { label: string; km?: number; min?: number }) => (
    <div className="flex items-center justify-between py-2 border-b border-ink-100 last:border-b-0">
      <span className="text-sm text-ink-700">{label}</span>
      <span className="text-sm font-semibold text-ink-900 tabular-nums">
        {km !== undefined ? `${km} km` : <span className="text-ink-300">- km</span>}
        <span className="text-ink-300 mx-2">·</span>
        {min !== undefined ? `${min} min` : <span className="text-ink-300">- min</span>}
      </span>
    </div>
  );
  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-ink-900">Afstanden</h3>
        <span className="text-[10px] text-ink-400">door festival ingevuld</span>
      </header>
      {filled === 0 ? (
        <p className="text-sm text-ink-500">Festival heeft afstanden nog niet doorgegeven.</p>
      ) : (
        <>
          <Row label="Airport ↔ Hotel" km={distances.airport_hotel_km} min={distances.airport_hotel_minutes} />
          <Row label="Hotel ↔ Venue" km={distances.hotel_venue_km} min={distances.hotel_venue_minutes} />
          <Row label="Venue ↔ Airport" km={distances.venue_airport_km} min={distances.venue_airport_minutes} />
        </>
      )}
    </section>
  );
}
