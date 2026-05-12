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

  const summary = {
    total: tech.length,
    confirmed: tech.filter((i) => i.status === "confirmed" || i.status === "accepted").length,
    pending: tech.filter((i) => i.status === "requested").length,
    alt: tech.filter((i) => i.status === "alternative_offered" || i.status === "not_available").length,
    disputed: tech.filter((i) => i.status === "disputed").length,
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold">PLEASE CONFIRM</div>
            <h1 className="text-2xl font-extrabold text-ink-900 mt-1">
              Tech requirements van {detail.artist.name}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Bevestig per item of bied een alternatief - management ziet dit live.
            </p>
          </div>
          <StatusPill tone={statusTone(detail.advancing.status)}>{humanStatus(detail.advancing.status)}</StatusPill>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <Stat label="Totaal" value={summary.total} tone="default" />
          <Stat label="Bevestigd" value={summary.confirmed} tone="ok" />
          <Stat label="Pending" value={summary.pending} tone="warn" />
          <Stat label="Alt / niet" value={summary.alt} tone="warn" />
          <Stat label="Disputed" value={summary.disputed} tone="bad" />
        </div>
      </section>

      <ProgramTimeline
        events={snap.timelineByAdvancing[advId] ?? []}
        scope={{ token: params.token }}
        canEdit={true}
        source="festival"
        showDate={detail.booking.show_date}
      />

      <PleaseConfirmList items={tech} />

      <DistancesForm token={params.token} distances={snap.distancesByAdvancing[advId] ?? {}} />

      <GroundTravelBlock
        token={params.token}
        flights={detail.flights}
        transfers={snap.groundTransfersByAdvancing[advId] ?? []}
        showDate={detail.booking.show_date}
      />

      <HotelProposalsForm token={params.token} proposals={snap.hotelProposalsByAdvancing[advId] ?? []} />

      <FestivalDocumentsBlock token={params.token} documents={snap.festivalDocumentsByAdvancing[advId] ?? []} />

      <SignedRidersBlock token={params.token} riders={snap.signedRiders.filter((r) => r.advancing_id === advId)} />

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
