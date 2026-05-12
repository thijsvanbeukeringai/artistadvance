import Link from "next/link";
import { notFound } from "next/navigation";
import { sectionMeta } from "@/lib/sectionConfigs";
import SectionForm from "@/components/SectionForm";
import ContactsSection from "@/components/portal/ContactsSection";
import FlightsBlock from "@/components/portal/FlightsBlock";
import TechItemsList from "@/components/tech/TechItemsList";
import VisaForm from "@/components/portal/VisaForm";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import { SECTION_LABELS, TECH_SECTIONS } from "@/lib/data";
import type { SectionType } from "@/lib/types";
import { findPortalDetail, loadSnapshot } from "@/lib/snapshot";

const ALL_SECTIONS = new Set<SectionType>([
  ...TECH_SECTIONS,
  "logistics", "travel", "hotel", "hospitality", "contacts", "visa",
]);

export default async function PortalSectionPage({
  params,
}: {
  params: { token: string; section: string };
}) {
  if (!ALL_SECTIONS.has(params.section as SectionType)) return notFound();
  const sectionType = params.section as SectionType;

  const snap = await loadSnapshot();
  const detail = findPortalDetail(snap, params.token);
  if (!detail) return notFound();

  const isTech = (TECH_SECTIONS as readonly string[]).includes(sectionType);
  const meta = sectionMeta[sectionType];
  const sectionStatus = detail.sections.find((s) => s.section_type === sectionType);
  const advId = detail.advancing.id;
  const data: Record<string, unknown> = !isTech
    ? (sectionType === "logistics" ? ({ ...snap.logisticsByAdvancing[advId] } as Record<string, unknown>)
      : sectionType === "travel" ? ({ ...snap.travelByAdvancing[advId] } as Record<string, unknown>)
      : sectionType === "hotel" ? ({ ...snap.hotelByAdvancing[advId] } as Record<string, unknown>)
      : sectionType === "hospitality" ? ({ ...snap.hospitalityByAdvancing[advId] } as Record<string, unknown>)
      : {})
    : {};
  const techItemsForSection = isTech
    ? snap.techItems.filter((t) => t.advancing_id === advId && t.category === sectionType)
    : [];

  const label = meta?.label ?? SECTION_LABELS[sectionType] ?? sectionType;
  const tagline = meta?.tagline ?? (isTech ? "Tech requirements (PLEASE CONFIRM door festival)" : "Vul de show-specifieke gegevens in.");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href={`/portal/${params.token}`} className="hover:text-ink-700">Portal</Link>
        <span>/</span>
        <span className="text-ink-700">{label}</span>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{label}</h1>
          <p className="text-sm text-ink-500 mt-1">{tagline}</p>
        </div>
        {sectionStatus && (
          <div className="text-right">
            <StatusPill tone={statusTone(sectionStatus.status)}>{humanStatus(sectionStatus.status)}</StatusPill>
            <div className="mt-2 flex items-center gap-2 w-48">
              <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${sectionStatus.completion_percent}%` }} />
              </div>
              <span className="text-[11px] font-bold text-ink-700 tabular-nums">{sectionStatus.completion_percent}%</span>
            </div>
          </div>
        )}
      </header>

      {isTech ? (
        <TechItemsList items={techItemsForSection} />
      ) : sectionType === "contacts" ? (
        <ContactsSection token={params.token} contacts={detail.artist_contacts} />
      ) : sectionType === "visa" ? (
        <VisaForm token={params.token} visa={snap.visaByAdvancing[advId] ?? null} crew={snap.visaCrewByAdvancing[advId] ?? []} />
      ) : (
        <>
          <SectionForm token={params.token} type={sectionType} groups={meta?.groups ?? []} data={data} />
          {sectionType === "travel" && (
            <FlightsBlock token={params.token} flights={detail.flights} />
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-4">
        <Link href={`/portal/${params.token}`} className="text-sm font-semibold text-ink-700 hover:underline">← Terug naar portal</Link>
        <span className="text-xs text-ink-400">Wijzigingen worden automatisch opgeslagen</span>
      </div>
    </div>
  );
}
