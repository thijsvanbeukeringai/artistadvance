import { notFound } from "next/navigation";
import PleaseConfirmList from "@/components/festival/PleaseConfirmList";
import SignedRidersBlock from "@/components/festival/SignedRidersBlock";
import DistancesForm from "@/components/festival/DistancesForm";
import HotelProposalsForm from "@/components/festival/HotelProposalsForm";
import FestivalDocumentsBlock from "@/components/festival/FestivalDocumentsBlock";
import GroundTravelBlock from "@/components/festival/GroundTravelBlock";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import ProgramTimeline from "@/components/program/ProgramTimeline";
import { findPortalDetail, loadSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default async function FestivalPortalPage({ params }: { params: { token: string } }) {
  const snap = await loadSnapshot();
  const detail = findPortalDetail(snap, params.token);
  if (!detail) return notFound();
  const advId = detail.advancing.id;
  const tech = snap.techItems.filter((t) => t.advancing_id === advId);
  const hidden = new Set<string>(detail.advancing.festival_portal_hidden ?? []);
  const show = (k: string) => !hidden.has(k);

  const summary = {
    total: tech.length,
    confirmed: tech.filter((i) => i.status === "confirmed" || i.status === "accepted").length,
    pending: tech.filter((i) => i.status === "requested").length,
    alt: tech.filter((i) => i.status === "alternative_offered" || i.status === "not_available").length,
    disputed: tech.filter((i) => i.status === "disputed").length,
  };

  // Hele sectie verbergen als al z'n sub-blokken verborgen zijn
  const hasRunOfShow = show("program");
  const hasTechnical = show("tech");
  const hasTransport = show("travel") || show("distances");
  const hasHotel = show("hotel");
  const hasDocuments = show("documents");
  const hasRiders = show("riders");

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold">PLEASE CONFIRM</div>
            <h1 className="text-2xl font-extrabold text-ink-900 mt-1">
              Advancing van {detail.artist.name}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Loop deze blokken door — vul aan, bevestig of bied alternatieven. Management ziet je input live.
            </p>
          </div>
          <StatusPill tone={statusTone(detail.advancing.status)}>{humanStatus(detail.advancing.status)}</StatusPill>
        </div>
        {hasTechnical && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <Stat label="Tech items" value={summary.total} tone="default" />
            <Stat label="Bevestigd" value={summary.confirmed} tone="ok" />
            <Stat label="Pending" value={summary.pending} tone="warn" />
            <Stat label="Alt / niet" value={summary.alt} tone="warn" />
            <Stat label="Disputed" value={summary.disputed} tone="bad" />
          </div>
        )}
      </section>

      {/* RUN OF SHOW */}
      {hasRunOfShow && (
        <Group eyebrow="Run of show" title="Programma & timings" description="Load-in, soundcheck, doors, show, load-out — vul timings aan zodat het management één bron van waarheid heeft." tone="ink">
          <ProgramTimeline
            events={snap.timelineByAdvancing[advId] ?? []}
            scope={{ token: params.token }}
            canEdit={true}
            source="festival"
            showDate={detail.booking.show_date}
          />
        </Group>
      )}

      {/* TECHNICAL */}
      {hasTechnical && (
        <Group eyebrow="Technical" title="Hardware & specs" description="Bevestig per item, bied een alternatief of meld 'niet beschikbaar'." tone="emerald">
          <PleaseConfirmList items={tech} />
        </Group>
      )}

      {/* TRANSPORT */}
      {hasTransport && (
        <Group
          eyebrow="Transport"
          title="Vluchten, transfers & afstanden"
          description="Inbound en outbound vluchten van de touring party, ground-transfers airport ↔ hotel ↔ venue, en afstanden in km/minuten."
          tone="sky"
        >
          {show("travel") && (
            <GroundTravelBlock
              token={params.token}
              flights={detail.flights}
              transfers={snap.groundTransfersByAdvancing[advId] ?? []}
              showDate={detail.booking.show_date}
            />
          )}
          {show("distances") && (
            <DistancesForm token={params.token} distances={snap.distancesByAdvancing[advId] ?? {}} />
          )}
        </Group>
      )}

      {/* HOTEL */}
      {hasHotel && (
        <Group
          eyebrow="Hotel"
          title="Hotel-voorstellen"
          description="Stel hotelopties voor — naam, sterren, afstand tot venue, prijs. Management kiest een optie ter bevestiging."
          tone="orange"
        >
          <HotelProposalsForm token={params.token} proposals={snap.hotelProposalsByAdvancing[advId] ?? []} />
        </Group>
      )}

      {/* DOCUMENTS */}
      {hasDocuments && (
        <Group
          eyebrow="Documents"
          title="Festival-documenten"
          description="Upload je technical pack, parking map, stagepass policy en andere relevante bestanden."
          tone="violet"
        >
          <FestivalDocumentsBlock token={params.token} documents={snap.festivalDocumentsByAdvancing[advId] ?? []} />
        </Group>
      )}

      {/* RIDERS */}
      {hasRiders && (
        <Group
          eyebrow="Riders"
          title="Getekende riders"
          description="Open de rider, teken digitaal of upload een PDF met handtekening van de promoter / production manager."
          tone="rose"
        >
          <SignedRidersBlock
            token={params.token}
            riders={snap.signedRiders.filter((r) => r.advancing_id === advId)}
          />
        </Group>
      )}

      {/* FOOTER */}
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5 text-sm text-ink-500">
        Vragen? Neem contact op met production-manager <span className="text-ink-900 font-semibold">{detail.artist_contacts[0]?.name ?? "(onbekend)"}</span>
        {detail.artist_contacts[0]?.email && <> via <a className="text-brand-600 underline" href={`mailto:${detail.artist_contacts[0]?.email}`}>{detail.artist_contacts[0]?.email}</a></>}.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "ok" | "warn" | "bad" }) {
  const cls =
    tone === "ok" ? "bg-emerald-50 text-emerald-700" :
    tone === "warn" ? "bg-amber-50 text-amber-700" :
    tone === "bad" ? "bg-red-50 text-red-700" :
    "bg-ink-100 text-ink-700";
  return (
    <div className={`rounded-lg px-3 py-2 ${cls}`}>
      <div className="opacity-80">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

type GroupTone = "ink" | "emerald" | "sky" | "orange" | "violet" | "rose";

function Group({
  eyebrow,
  title,
  description,
  tone = "ink",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: GroupTone;
  children: React.ReactNode;
}) {
  const eyebrowCls =
    tone === "emerald" ? "text-emerald-700 bg-emerald-50" :
    tone === "sky" ? "text-sky-700 bg-sky-50" :
    tone === "orange" ? "text-orange-700 bg-orange-50" :
    tone === "violet" ? "text-violet-700 bg-violet-50" :
    tone === "rose" ? "text-rose-700 bg-rose-50" :
    "text-ink-700 bg-ink-100";
  return (
    <section className="space-y-3">
      <header className="pt-2">
        <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded ${eyebrowCls}`}>
          {eyebrow}
        </span>
        <h2 className="text-xl font-extrabold text-ink-900 mt-2">{title}</h2>
        {description && <p className="text-sm text-ink-500 mt-1 max-w-2xl">{description}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
