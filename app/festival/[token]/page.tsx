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
import AdvancingTabs, { type AdvancingTab } from "@/components/advancing/AdvancingTabs";
import LiveSync from "@/components/realtime/LiveSync";

export const dynamic = "force-dynamic";

const ICON = {
  program: "M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  tech: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  transport: "M3 11l18-8-8 18-2-7-8-3z",
  hotel: "M2 18V8 M22 18v-6a3 3 0 00-3-3H10v8 M2 14h20 M6 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  documents: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 13h6 M9 17h6",
  riders: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
};

export default async function FestivalPortalPage({ params }: { params: { token: string } }) {
  const snap = await loadSnapshot();
  const detail = findPortalDetail(snap, params.token);
  if (!detail) return notFound();
  const advId = detail.advancing.id;
  const tech = snap.techItems.filter((t) => t.advancing_id === advId);
  const customCatLabels: Record<string, string> = {};
  for (const c of snap.artistCustomTechCategories.filter((c) => c.artist_id === detail.artist.id)) {
    customCatLabels[c.key] = c.label;
  }
  const hidden = new Set<string>(detail.advancing.festival_portal_hidden ?? []);
  const show = (k: string) => !hidden.has(k);

  const summary = {
    total: tech.length,
    confirmed: tech.filter((i) => i.status === "confirmed" || i.status === "accepted").length,
    pending: tech.filter((i) => i.status === "requested").length,
    alt: tech.filter((i) => i.status === "alternative_offered" || i.status === "not_available").length,
    disputed: tech.filter((i) => i.status === "disputed").length,
  };

  const hasRunOfShow = show("program");
  const hasTechnical = show("tech");
  const hasTransport = show("travel") || show("distances");
  const hasHotel = show("hotel");
  const hasDocuments = show("documents");
  const hasRiders = show("riders");

  const tabs: AdvancingTab[] = [];

  if (hasRunOfShow) {
    tabs.push({
      id: "program",
      label: "Run of show",
      iconPath: ICON.program,
      content: (
        <ProgramTimeline
          events={snap.timelineByAdvancing[advId] ?? []}
          scope={{ token: params.token }}
          canEdit={true}
          source="festival"
          showDate={detail.booking.show_date}
        />
      ),
    });
  }

  if (hasTechnical) {
    tabs.push({
      id: "tech",
      label: "Technical",
      iconPath: ICON.tech,
      badge: String(summary.total),
      content: <PleaseConfirmList items={tech} customCategoryLabels={customCatLabels} />,
    });
  }

  if (hasTransport) {
    const flightCount = detail.flights.length;
    tabs.push({
      id: "transport",
      label: "Transport",
      iconPath: ICON.transport,
      badge: flightCount ? String(flightCount) : undefined,
      content: (
        <>
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
        </>
      ),
    });
  }

  if (hasHotel) {
    const hotelCount = (snap.hotelProposalsByAdvancing[advId] ?? []).length;
    tabs.push({
      id: "hotel",
      label: "Hotel",
      iconPath: ICON.hotel,
      badge: hotelCount ? String(hotelCount) : undefined,
      content: <HotelProposalsForm token={params.token} proposals={snap.hotelProposalsByAdvancing[advId] ?? []} />,
    });
  }

  if (hasDocuments) {
    const docCount = (snap.festivalDocumentsByAdvancing[advId] ?? []).length;
    tabs.push({
      id: "documents",
      label: "Documents",
      iconPath: ICON.documents,
      badge: docCount ? String(docCount) : undefined,
      content: <FestivalDocumentsBlock token={params.token} documents={snap.festivalDocumentsByAdvancing[advId] ?? []} />,
    });
  }

  if (hasRiders) {
    const riders = snap.signedRiders.filter((r) => r.advancing_id === advId);
    tabs.push({
      id: "riders",
      label: "Riders",
      iconPath: ICON.riders,
      badge: riders.length ? String(riders.length) : undefined,
      content: <SignedRidersBlock token={params.token} riders={riders} />,
    });
  }

  return (
    <div className="space-y-6">
      <LiveSync scope={{ mode: "advancing", ids: [advId] }} />
      <LiveSync scope={{ mode: "artist", ids: [detail.artist.id] }} debounce={500} />
      {/* HEADER */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-700 font-bold">PLEASE CONFIRM</div>
            <h1 className="text-2xl font-extrabold text-ink-900 mt-1">
              Advancing van {detail.artist.name}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Loop de tabbladen door — vul aan, bevestig of bied alternatieven. Management ziet je input live.
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

      {/* TABS */}
      {tabs.length > 0 && (
        <AdvancingTabs tabs={tabs} defaultTab={tabs[0].id} />
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
