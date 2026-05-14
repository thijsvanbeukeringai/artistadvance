import Link from "next/link";
import { notFound } from "next/navigation";
import BookingEditor from "@/components/booking/BookingEditor";
import BookingContactsEditor from "@/components/booking/BookingContactsEditor";
import BookingPaymentMilestones from "@/components/booking/BookingPaymentMilestones";
import BookingFlightsBlock from "@/components/booking/BookingFlightsBlock";
import BookingCrewMirror from "@/components/booking/BookingCrewMirror";
import BookingTasks from "@/components/booking/BookingTasks";
import ContractGeneratorBlock from "@/components/booking/ContractGeneratorBlock";
import RiderSelectionEditor from "@/components/booking/RiderSelectionEditor";
import AdvancingLiveSync from "@/components/realtime/AdvancingLiveSync";
import ConfirmBookingButton from "@/components/booking/ConfirmBookingButton";
import DeleteBookingButton from "@/components/booking/DeleteBookingButton";
import StatusPill, { statusTone } from "@/components/StatusPill";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount, canAccessAdvancing } from "@/lib/account";
import { detectBookingConflicts } from "@/lib/bookingConflicts";

export const dynamic = "force-dynamic";

function agencyBookingLabel(status: string): string {
  switch (status) {
    case "draft": return "Draft";
    case "confirmed": return "Bevestigd";
    case "advancing": return "Bevestigd";
    case "completed": return "Afgerond";
    case "cancelled": return "Geannuleerd";
    default: return status;
  }
}

const TODAY = new Date("2026-05-09");
function daysBetween(target: string): number {
  return Math.ceil((new Date(target + "T00:00:00").getTime() - TODAY.getTime()) / 86400000);
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const booking = snap.bookings.find((b) => b.id === params.id);
  if (!booking) return notFound();
  const artist = snap.artists.find((a) => a.id === booking.artist_id);
  const festival = snap.festivals.find((f) => f.id === booking.festival_id);
  const stage = snap.stages.find((s) => s.id === booking.stage_id);
  if (!artist || !festival || !stage) return notFound();

  const advancing = snap.advancings.find((a) => a.booking_id === booking.id);
  const bookingContacts = snap.bookingContacts.filter((c) => c.booking_id === booking.id);
  const festivalContacts = snap.festivalCrmContacts.filter((c) => c.festival_id === festival.id);
  const milestones = snap.bookingPaymentMilestones.filter((m) => m.booking_id === booking.id);
  const tasks = snap.bookingTasks.filter((t) => t.booking_id === booking.id);
  const flights = advancing ? (snap.flightsByAdvancing[advancing.id] ?? []) : [];
  const bookingCrew = snap.bookingCrew.filter((c) => c.booking_id === booking.id);

  const days = daysBetween(booking.show_date);
  const isDraft = booking.status === "draft";
  const isConfirmed = booking.status !== "draft";
  const advancingAccess = canAccessAdvancing(account.role);
  const conflicts = detectBookingConflicts(booking, snap.bookings);

  return (
    <div className="space-y-6">
      {advancing && <AdvancingLiveSync advancingIds={[advancing.id]} />}
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/bookings" className="hover:text-ink-700">Boekingen</Link>
        <span>/</span>
        <span className="text-ink-700">{artist.name} · {festival.name}</span>
      </div>

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white text-2xl font-extrabold flex-shrink-0">
            {artist.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-ink-900">{artist.name}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-700">
                {SHOW_TYPE_LABELS[booking.show_type]}
              </span>
              <StatusPill tone={statusTone(booking.status)}>{agencyBookingLabel(booking.status)}</StatusPill>
              {booking.hold_position && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  {booking.hold_position}st hold
                </span>
              )}
            </div>
            <p className="text-sm text-ink-500 mt-1">
              <span className="font-semibold">{festival.name}</span> · {stage.name} · {festival.location}
              <span className="mx-1.5">·</span>
              <span className="tabular-nums">{booking.show_date}{booking.show_time ? ` om ${booking.show_time}` : ""}</span>
              <span className="mx-1.5">·</span>
              <span className="tabular-nums">{days < 0 ? `past` : `T-${days}`}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/artists/${artist.id}`}
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
          >
            Artist-page
          </Link>
          {isDraft ? (
            <>
              <ConfirmBookingButton bookingId={booking.id} label="Bevestig boeking" />
              <DeleteBookingButton bookingId={booking.id} artistId={artist.id} />
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Bevestigd
            </span>
          )}
        </div>
      </header>

      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <section className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="text-red-700 flex-shrink-0 mt-0.5">
              <path d="M12 9v4 M12 17h.01 M10.29 3.86l-8.18 14.18A2 2 0 003.83 21h16.34a2 2 0 001.72-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-900 text-sm">{conflicts.length} conflict{conflicts.length === 1 ? "" : "en"} gedetecteerd</h3>
              <ul className="mt-2 space-y-1.5">
                {conflicts.map((c, i) => {
                  const f = snap.festivals.find((x) => x.id === c.with.festival_id);
                  return (
                    <li key={i} className="text-xs text-red-800 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-200 text-red-900 px-1.5 py-0.5 rounded">
                        {c.type === "same_date" ? "Zelfde dag" : "Binnen radius"}
                      </span>
                      <span>{c.message}</span>
                      <Link href={`/bookings/${c.with.id}`} className="font-semibold text-red-900 underline">
                        {f?.name ?? "Booking"} →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Two-column on wide: editor + side panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Editable booking detail */}
          <BookingEditor booking={booking} festivals={snap.festivals} stages={snap.stages} />

          {/* Contacts */}
          <BookingContactsEditor
            bookingId={booking.id}
            festivalId={festival.id}
            bookingContacts={bookingContacts}
            festivalContacts={festivalContacts}
          />

          {/* Flights */}
          <BookingFlightsBlock bookingId={booking.id} isConfirmed={isConfirmed} flights={flights} />

          {/* Crew mirror (advancing-team manages) */}
          <BookingCrewMirror
            bookingId={booking.id}
            crew={bookingCrew}
            advancingId={advancing?.id ?? null}
            advancingAccess={advancingAccess}
          />
        </div>

        <div className="space-y-6">
          {/* Contract */}
          <ContractGeneratorBlock
            bookingId={booking.id}
            artistId={artist.id}
            hasTemplate={!!(artist.contract_template_md && artist.contract_template_md.trim())}
            currentUrl={booking.contract_pdf_url ?? null}
            generatedAt={booking.contract_generated_at ?? null}
          />

          {/* Riders die meegestuurd worden in festival portal */}
          <RiderSelectionEditor
            bookingId={booking.id}
            selected={booking.selected_riders ?? []}
            templates={snap.artistRiderTemplates.filter((t) => t.artist_id === artist.id)}
          />

          {/* Payment milestones */}
          <BookingPaymentMilestones
            bookingId={booking.id}
            milestones={milestones}
            totalFee={booking.fee ?? null}
          />

          {/* Tasks */}
          <BookingTasks bookingId={booking.id} tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
