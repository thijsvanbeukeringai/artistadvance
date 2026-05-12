import type { HotelInfo } from "@/lib/types";

export default function HotelBlock({ hotel }: { hotel: HotelInfo }) {
  if (!hotel.hotel_required) {
    return (
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <h3 className="font-bold text-ink-900">Hotel</h3>
        <p className="text-sm text-ink-500 mt-1">Geen hotel benodigd voor deze show.</p>
      </section>
    );
  }

  const Stat = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
    if (value === undefined || value === null || value === "") return null;
    return (
      <div className="flex justify-between gap-3 text-sm py-1">
        <dt className="text-ink-500">{label}</dt>
        <dd className="text-ink-900 font-medium tabular-nums text-right">{typeof value === "boolean" ? (value ? "Ja" : "Nee") : value}</dd>
      </div>
    );
  };

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
      <header className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-ink-900">Hotel</h3>
        {hotel.hotel_star_rating && (
          <span className="text-[11px] font-bold bg-ink-100 text-ink-700 px-2 py-1 rounded-md">
            {hotel.hotel_star_rating}
          </span>
        )}
      </header>
      <dl className="divide-y divide-ink-100">
        <Stat label="Voorkeur / hotel" value={hotel.hotel_confirmed_name ?? hotel.hotel_preference} />
        <Stat label="Aantal kamers" value={hotel.hotel_room_count} />
        <Stat label="Kamertype" value={hotel.hotel_room_type} />
        <Stat label="Aantal nachten" value={hotel.hotel_nights} />
        <Stat label="Nachten omschrijving" value={hotel.hotel_nights_description} />
        <Stat label="Check-in" value={hotel.hotel_check_in} />
        <Stat label="Check-out" value={hotel.hotel_check_out} />
        <Stat label="Late check-out" value={hotel.hotel_late_checkout} />
      </dl>
      {hotel.hotel_options_from_festival && (
        <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700">
          <span className="font-semibold">Opties van festival:</span> {hotel.hotel_options_from_festival}
        </div>
      )}
    </section>
  );
}
