import Link from "next/link";
import { SECTION_LABELS, TECH_SECTIONS, NON_TECH_SECTIONS } from "@/lib/data";
import { computeReadiness } from "@/lib/readiness";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import type { SectionType } from "@/lib/types";
import { findPortalDetail, loadSnapshot, type Snapshot } from "@/lib/snapshot";
import ProgramTimeline from "@/components/program/ProgramTimeline";

function SectionGroup({
  title,
  subtitle,
  token,
  sectionTypes,
  sections,
}: {
  title: string;
  subtitle: string;
  token: string;
  sectionTypes: SectionType[];
  sections: { id: string; section_type: SectionType; status: string; completion_percent: number }[];
}) {
  return (
    <section>
      <header className="mb-3">
        <h2 className="text-lg font-bold text-ink-900">{title}</h2>
        <p className="text-xs text-ink-500">{subtitle}</p>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectionTypes.map((type) => {
          const s = sections.find((x) => x.section_type === type);
          const tone = s?.status === "complete" || s?.status === "locked" ? "ok" : s?.status === "in_progress" ? "info" : s?.status === "n_a" ? "neutral" : "warn";
          return (
            <Link
              key={type}
              href={`/portal/${token}/${type}`}
              className="group bg-white border border-ink-200 rounded-xl shadow-card p-4 hover:border-brand-400 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-ink-900 truncate">{SECTION_LABELS[type]}</span>
                <span className="text-ink-300 group-hover:text-brand-500 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${s?.completion_percent ?? 0}%` }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums text-ink-700">{s?.completion_percent ?? 0}%</span>
              </div>
              <div className="mt-2">
                <StatusPill tone={tone as any}>{humanStatus(s?.status ?? "empty")}</StatusPill>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function OtherShows({ token, artistId, currentBookingId, snap }: { token: string; artistId: string; currentBookingId: string; snap: Snapshot }) {
  const today = new Date("2026-05-09");
  const otherBookings = snap.bookings
    .filter((b) => b.artist_id === artistId && b.id !== currentBookingId)
    .sort((a, b) => (a.show_date < b.show_date ? -1 : 1));
  if (otherBookings.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-bold text-ink-900 mb-3">Andere shows van deze artiest ({otherBookings.length})</h2>
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <ul className="divide-y divide-ink-200">
          {otherBookings.map((b) => {
            const adv = snap.advancings.find((a) => a.booking_id === b.id);
            const readiness = adv ? computeReadiness(snap, adv.id, today) : null;
            const festival = snap.festivals.find((f) => f.id === b.festival_id)!;
            const upcoming = b.show_date >= "2026-05-09";
            return (
              <li key={b.id} className="px-5 py-3 flex items-center gap-4">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider ${
                  upcoming ? "bg-brand-50 text-brand-700" : "bg-ink-100 text-ink-500"
                }`}>
                  {upcoming ? "aankomend" : "voorbij"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900">{festival.name}</span>
                    <span className="text-xs text-ink-400 tabular-nums">{b.show_date} · {b.show_time}</span>
                  </div>
                  {readiness && (
                    <div className="text-xs text-ink-500 mt-0.5">
                      readiness <span className="font-bold text-ink-900 tabular-nums">{readiness.score}</span> · {readiness.bottleneck.reason}
                    </div>
                  )}
                </div>
                {adv ? (
                  <Link href={`/portal/${adv.portal_token}`} className="text-brand-600 text-sm font-semibold hover:underline">Open portal →</Link>
                ) : (
                  <span className="text-xs text-ink-400">geen advancing</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default async function PortalLanding({ params }: { params: { token: string } }) {
  const snap = await loadSnapshot();
  const detail = findPortalDetail(snap, params.token)!;
  const { sections, riders, advancing, booking, artist, festival, stage } = detail;
  const completion = sections.length
    ? Math.round(sections.reduce((s, x) => s + x.completion_percent, 0) / sections.length)
    : 0;

  const daysToShow = Math.max(
    0,
    Math.ceil((new Date(booking.show_date).getTime() - new Date("2026-05-09").getTime()) / 86400000)
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-brand-600 font-semibold uppercase tracking-wider">Advancing portal</div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mt-1">
              {artist.name} @ {festival.name}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {stage.name} · {booking.show_date} · {booking.show_time} · {booking.set_duration_minutes} min set
            </p>
          </div>
          <StatusPill tone={statusTone(advancing.status)}>{humanStatus(advancing.status)}</StatusPill>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-ink-100 p-4">
            <div className="text-xs text-ink-400">Voortgang</div>
            <div className="text-2xl font-extrabold text-ink-900">{completion}%</div>
            <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
              <div className="h-full bg-brand-500" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div className="rounded-xl bg-ink-100 p-4">
            <div className="text-xs text-ink-400">Tot showtime</div>
            <div className="text-2xl font-extrabold text-ink-900">{daysToShow} <span className="text-sm font-semibold text-ink-500">dagen</span></div>
          </div>
          <div className="rounded-xl bg-ink-100 p-4">
            <div className="text-xs text-ink-400">Riders</div>
            <div className="text-2xl font-extrabold text-ink-900">
              {riders.filter((r) => r.status === "accepted" || r.status === "signed").length}/{riders.length}
            </div>
            <div className="text-xs text-ink-500 mt-1">getekend</div>
          </div>
          <div className="rounded-xl bg-ink-100 p-4">
            <div className="text-xs text-ink-400">Sectie compleet</div>
            <div className="text-2xl font-extrabold text-ink-900">
              {sections.filter((s) => s.status === "complete" || s.status === "locked").length}/{sections.length}
            </div>
          </div>
        </div>
      </section>

      {/* Program timeline */}
      <ProgramTimeline
        events={snap.timelineByAdvancing[advancing.id] ?? []}
        scope={{ token: params.token }}
        canEdit={true}
        source="portal"
        showDate={booking.show_date}
      />

      {/* Tech sub-secties (PLEASE CONFIRM via tech_items) */}
      <SectionGroup
        title="Technische advancing"
        subtitle="12 sub-secties - items per categorie via PLEASE CONFIRM"
        token={params.token}
        sectionTypes={TECH_SECTIONS}
        sections={sections}
      />

      {/* Niet-tech secties (formulier-driven) */}
      <SectionGroup
        title="Logistiek, travel & contact"
        subtitle="Direct invullen - auto-save"
        token={params.token}
        sectionTypes={NON_TECH_SECTIONS}
        sections={sections}
      />

      {/* Andere shows van deze artiest */}
      <OtherShows token={params.token} artistId={detail.artist.id} currentBookingId={detail.booking.id} snap={snap} />

      {/* Riders */}
      <section>
        <h2 className="text-lg font-bold text-ink-900 mb-3">Getekende riders</h2>
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card divide-y divide-ink-200">
          {riders.map((r) => (
            <div key={r.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink-900">
                  {r.rider_type === "technical" ? "Technische rider" : "Hospitality rider"}
                </div>
                {r.dispute_notes && <div className="text-xs text-red-600 mt-1 italic">{r.dispute_notes}</div>}
              </div>
              <StatusPill tone={statusTone(r.status)}>{humanStatus(r.status)}</StatusPill>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
