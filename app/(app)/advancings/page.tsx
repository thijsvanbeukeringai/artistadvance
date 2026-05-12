import { redirect } from "next/navigation";
import ReadinessCard from "@/components/readiness/ReadinessCard";
import PageIntro from "@/components/PageIntro";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { computeReadiness } from "@/lib/readiness";
import { humanStatus } from "@/components/StatusPill";
import { readAccount, scopedArtistIds, canAccessAdvancing } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

export default async function AdvancingsPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  if (!canAccessAdvancing(account.role)) redirect("/");
  const visibleIds = scopedArtistIds(account, snap.artists);
  const today = new Date("2026-05-09");

  const rows = snap.advancings
    .map((adv) => {
      const booking = snap.bookings.find((b) => b.id === adv.booking_id);
      if (!booking || !visibleIds.has(booking.artist_id)) return null;
      const artist = snap.artists.find((a) => a.id === booking.artist_id);
      const festival = snap.festivals.find((f) => f.id === booking.festival_id);
      const stage = snap.stages.find((s) => s.id === booking.stage_id);
      if (!artist || !festival || !stage) return null;
      const readiness = computeReadiness(snap, adv.id, today);
      if (!readiness) return null;
      return { adv, booking, artist, festival, stage, readiness };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.readiness.attentionScore - a.readiness.attentionScore);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Advancings"
        title="Alle lopende voorbereidingen"
        description={`${rows.length} advancings - gesorteerd op urgency × openheid. Klik een kaart voor de volledige advancing-detail met touring party, tech items en getekende riders.`}
        steps={[
          { label: "Rood = nu", description: "Disputed of zwaarste open sectie eerst." },
          { label: "Stage-bar", description: "Zie in detail welke fase je in zit." },
          { label: "Open portal", description: "Stuur de portal-link naar management." },
          { label: "Festival portal", description: "Apart link voor festival om tech te confirmen." },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map(({ adv, artist, festival, stage, booking, readiness }) => (
          <ReadinessCard
            key={adv.id}
            href={`/advancings/${adv.id}`}
            artistName={artist.name}
            festivalName={festival.name}
            stageName={stage.name}
            showDate={booking.show_date}
            showTime={booking.show_time}
            showType={SHOW_TYPE_LABELS[booking.show_type]}
            advancingStatus={humanStatus(adv.status)}
            readiness={readiness}
          />
        ))}
      </div>
    </div>
  );
}
