import Link from "next/link";
import { notFound } from "next/navigation";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount } from "@/lib/account";
import { buildCalendarEvents } from "@/lib/calendarEvents";

export const dynamic = "force-dynamic";

export default async function ArtistCalendarPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const artist = snap.artists.find((a) => a.id === params.id);
  if (!artist) return notFound();
  const events = buildCalendarEvents(snap, new Set([artist.id]), account.mode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 font-bold">Kalender</div>
          <h1 className="text-2xl font-extrabold text-ink-900 mt-1">{artist.name}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {events.length} events op de kalender. Shows, hotels, travel en programming slots — alles in maandweergave.
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

      <MonthCalendar
        events={events}
        emptyHint={`Geen events ingepland voor ${artist.name}. Begin met een booking of voeg een hotel/vlucht toe aan een bestaande advancing.`}
      />
    </div>
  );
}
