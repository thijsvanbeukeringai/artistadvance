import PageIntro from "@/components/PageIntro";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import AgencyCalendar from "@/components/calendar/AgencyCalendar";
import ArtistFilter from "@/components/filters/ArtistFilter";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { buildCalendarEvents } from "@/lib/calendarEvents";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: { artist?: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const allScoped = scopedArtistIds(account, snap.artists);
  const filterArtist = searchParams.artist ?? "";
  const effective = filterArtist && allScoped.has(filterArtist) ? new Set([filterArtist]) : allScoped;
  const events = buildCalendarEvents(snap, effective);

  const artistList = snap.artists
    .filter((a) => allScoped.has(a.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ id: a.id, name: a.name }));

  const scopeLabel = account.mode === "artist"
    ? `Kalender voor ${account.label}`
    : filterArtist
      ? `Kalender · ${snap.artists.find((a) => a.id === filterArtist)?.name ?? "gefilterd"}`
      : `Kalender · ${account.label} (${allScoped.size} artiesten)`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageIntro
          eyebrow="Kalender"
          title={scopeLabel}
          description={`${events.length} events in deze scope. Klik op een dag om een boeking toe te voegen.`}
        />
        {account.mode === "agency" && artistList.length > 1 && (
          <ArtistFilter artists={artistList} />
        )}
      </div>
      {account.mode === "agency" ? (
        <AgencyCalendar
          events={events}
          emptyHint="Geen events in deze scope. Klik op een dag om een boeking toe te voegen."
          artists={artistList}
          festivals={snap.festivals}
          stages={snap.stages}
          festivalContacts={snap.festivalCrmContacts}
        />
      ) : (
        <MonthCalendar
          events={events}
          emptyHint="Geen events in deze scope."
        />
      )}
    </div>
  );
}
