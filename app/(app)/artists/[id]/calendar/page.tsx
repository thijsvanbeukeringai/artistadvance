import Link from "next/link";
import { notFound } from "next/navigation";
import AdvancingCalendar, { type AdvancingChoice } from "@/components/calendar/AdvancingCalendar";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount } from "@/lib/account";
import { buildCalendarEvents } from "@/lib/calendarEvents";

export const dynamic = "force-dynamic";

export default async function ArtistCalendarPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const artist = snap.artists.find((a) => a.id === params.id);
  if (!artist) return notFound();
  const events = buildCalendarEvents(snap, new Set([artist.id]), account.mode);

  // Lijst van advancings voor deze artiest — gebruiker kan kiezen bij day-click
  const advancings: AdvancingChoice[] = snap.advancings
    .flatMap((adv): AdvancingChoice[] => {
      const booking = snap.bookings.find((b) => b.id === adv.booking_id);
      if (!booking || booking.artist_id !== artist.id) return [];
      const festival = snap.festivals.find((f) => f.id === booking.festival_id);
      return [{
        id: adv.id,
        label: `${festival?.name ?? "?"} · ${booking.show_date}`,
        showDate: booking.show_date,
      }];
    })
    .sort((a, b) => (a.showDate ?? "").localeCompare(b.showDate ?? ""));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 font-bold">Kalender</div>
          <h1 className="text-2xl font-extrabold text-ink-900 mt-1">{artist.name}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {events.length} events. Klik op een dag om een vlucht, hotel, programma-item of reminder toe te voegen aan een show.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/artists/${artist.id}`}
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
          >
            Portfolio
          </Link>
          <Link
            href={`/artists/${artist.id}/templates`}
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
          >
            Templates
          </Link>
        </div>
      </div>

      <AdvancingCalendar
        events={events}
        advancings={advancings}
        emptyHint={`Geen events ingepland voor ${artist.name}. Begin met een booking of klik op een dag om een vlucht/hotel toe te voegen aan een bestaande advancing.`}
      />
    </div>
  );
}
