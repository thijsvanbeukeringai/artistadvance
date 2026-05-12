import { redirect } from "next/navigation";
import { computeReadiness } from "@/lib/readiness";
import TrackerTable from "@/components/tracker/TrackerTable";
import PageIntro from "@/components/PageIntro";
import { readAccount, scopedArtistIds, canAccessAdvancing } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

export default async function TrackerPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  if (!canAccessAdvancing(account.role)) redirect("/");
  const visibleIds = scopedArtistIds(account, snap.artists);
  const today = new Date("2026-05-09");
  const rows = snap.bookings
    .filter((b) => visibleIds.has(b.artist_id))
    .sort((a, b) => (a.show_date < b.show_date ? -1 : 1))
    .map((b) => {
      const artist = snap.artists.find((a) => a.id === b.artist_id)!;
      const festival = snap.festivals.find((f) => f.id === b.festival_id)!;
      const stage = snap.stages.find((s) => s.id === b.stage_id)!;
      const advancing = snap.advancings.find((adv) => adv.booking_id === b.id);
      const readiness = advancing ? computeReadiness(snap, advancing.id, today) : null;
      const crew = snap.bookingCrew.filter((c) => c.booking_id === b.id);
      const sections = advancing ? snap.sections.filter((s) => s.advancing_id === advancing.id) : [];
      const sectionPercents: Record<string, number> = {};
      for (const s of sections) sectionPercents[s.section_type] = s.completion_percent;
      const date = new Date(b.show_date + "T00:00:00");
      const showMonth = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      return {
        booking: b,
        artist: { id: artist.id, name: artist.name },
        festival: { id: festival.id, name: festival.name, country: festival.country },
        stage: { id: stage.id, name: stage.name },
        advancing: advancing ? { id: advancing.id } : null,
        readinessScore: readiness?.score ?? null,
        bottleneck: readiness?.bottleneck.reason ?? null,
        bottleneckTone: readiness?.bottleneck.tone ?? null,
        ridersAccepted: (readiness?.riders.accepted ?? 0) + (readiness?.riders.signed ?? 0),
        ridersTotal: readiness?.riders.total ?? 0,
        ridersDisputed: readiness?.riders.disputed ?? 0,
        urgencyLevel: readiness?.urgency.level ?? null,
        urgencyLabel: readiness?.urgency.label ?? null,
        crew,
        sectionPercents,
        showMonth,
      };
    });

  const allMonths = Array.from(new Set(rows.map((r) => r.showMonth)));

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={`Production tracker · ${account.label}`}
        title={account.mode === "artist" ? `Alle shows van ${account.label}` : `Alle shows van ${account.label}`}
        description={account.mode === "artist"
          ? "Scope: deze ene artiest. Switch via topbar voor agency-overzicht."
          : "Alle artiesten in deze agency. Switch naar artist-modus voor één-artiest scope."}
        steps={[
          { label: "Filteren", description: "Pak alleen de shows die nu jouw aandacht nodig hebben." },
          { label: "Drillen", description: "Klik 'Open' op een rij voor de volledige advancing-detail." },
          { label: "Touring party", description: "Zie wie meereist + vlucht-status per show." },
          { label: "Tech kolommen", description: "Status van de 12 sub-secties direct af te lezen." },
        ]}
      />

      <TrackerTable rows={rows} allMonths={allMonths} />
    </div>
  );
}
