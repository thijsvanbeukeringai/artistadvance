import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadSnapshot } from "@/lib/snapshot";
import { getOrCreateLaunchDraft } from "@/lib/db";
import { requireBookingAccess } from "@/lib/authz";
import LaunchWizard from "@/components/launch/LaunchWizard";

export const dynamic = "force-dynamic";

export default async function LaunchShowPage({ params }: { params: { id: string } }) {
  const az = await requireBookingAccess(params.id);
  if (!az.ok) redirect("/bookings");

  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === params.id);
  if (!booking) return notFound();
  const artist = snap.artists.find((a) => a.id === booking.artist_id);
  const festival = snap.festivals.find((f) => f.id === booking.festival_id);
  if (!artist || !festival) return notFound();

  // Al eerder gelaunched? Stuur door naar advancing.
  const existingAdvancing = snap.advancings.find((a) => a.booking_id === booking.id);
  if (existingAdvancing && booking.status !== "draft") {
    redirect(`/advancings/${existingAdvancing.id}`);
  }

  const draft = await getOrCreateLaunchDraft(booking.id);
  const templates = snap.artistRiderTemplates.filter((t) => t.artist_id === artist.id && !t.show_type);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/bookings" className="hover:text-ink-700">Boekingen</Link>
        <span>/</span>
        <Link href={`/bookings/${booking.id}`} className="hover:text-ink-700">{artist.name} · {festival.name}</Link>
        <span>/</span>
        <span className="text-ink-700">Launch</span>
      </div>

      <header>
        <div className="text-xs uppercase tracking-wider text-brand-600 font-bold">Launch show</div>
        <h1 className="text-2xl font-extrabold text-ink-900 mt-1">{artist.name} @ {festival.name}</h1>
        <p className="text-sm text-ink-500 mt-1">{booking.show_date} · {festival.location}</p>
      </header>

      <LaunchWizard
        bookingId={booking.id}
        artistName={artist.name}
        festivalName={festival.name}
        showDate={booking.show_date}
        draftId={draft.id}
        initialSelected={(draft.state as any)?.selected_riders ?? []}
        templates={templates}
      />
    </div>
  );
}
