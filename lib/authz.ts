import "server-only";
import { readAccount } from "./account";
import { loadSnapshot } from "./snapshot";

export type AuthzResult =
  | { ok: true; organizationId: string | null; isSuperAdmin: boolean }
  | { ok: false; error: string };

/**
 * Vereis dat de huidige user toegang heeft tot deze booking (super_admin OF
 * gelijk org als de artiest). Returnt org-id van de booking zodat de caller
 * dit kan loggen of secundaire checks kan doen.
 */
export async function requireBookingAccess(bookingId: string): Promise<AuthzResult> {
  const account = await readAccount();
  if (account.role === "guest") return { ok: false, error: "Niet aangemeld." };
  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === bookingId);
  if (!booking) return { ok: false, error: "Booking niet gevonden." };
  const artist = snap.artists.find((a) => a.id === booking.artist_id);
  if (!artist) return { ok: false, error: "Artiest niet gevonden." };
  const isSuperAdmin = account.role === "super_admin";
  if (!isSuperAdmin && artist.organization_id !== account.organizationId) {
    return { ok: false, error: "Geen toegang tot deze booking." };
  }
  return { ok: true, organizationId: artist.organization_id, isSuperAdmin };
}

export async function requireArtistAccess(artistId: string): Promise<AuthzResult> {
  const account = await readAccount();
  if (account.role === "guest") return { ok: false, error: "Niet aangemeld." };
  const snap = await loadSnapshot();
  const artist = snap.artists.find((a) => a.id === artistId);
  if (!artist) return { ok: false, error: "Artiest niet gevonden." };
  const isSuperAdmin = account.role === "super_admin";
  if (!isSuperAdmin && artist.organization_id !== account.organizationId) {
    return { ok: false, error: "Geen toegang tot deze artiest." };
  }
  return { ok: true, organizationId: artist.organization_id, isSuperAdmin };
}

export async function requireAdvancingAccess(advancingId: string): Promise<AuthzResult> {
  const account = await readAccount();
  if (account.role === "guest") return { ok: false, error: "Niet aangemeld." };
  const snap = await loadSnapshot();
  const advancing = snap.advancings.find((a) => a.id === advancingId);
  if (!advancing) return { ok: false, error: "Advancing niet gevonden." };
  const booking = snap.bookings.find((b) => b.id === advancing.booking_id);
  const artist = booking ? snap.artists.find((a) => a.id === booking.artist_id) : null;
  if (!artist) return { ok: false, error: "Advancing-relaties niet vindbaar." };
  const isSuperAdmin = account.role === "super_admin";
  if (!isSuperAdmin && artist.organization_id !== account.organizationId) {
    return { ok: false, error: "Geen toegang tot deze advancing." };
  }
  return { ok: true, organizationId: artist.organization_id, isSuperAdmin };
}

export async function requireFestivalAccess(festivalId: string): Promise<AuthzResult> {
  const account = await readAccount();
  if (account.role === "guest") return { ok: false, error: "Niet aangemeld." };
  const snap = await loadSnapshot();
  const festival = snap.festivals.find((f) => f.id === festivalId);
  if (!festival) return { ok: false, error: "Festival niet gevonden." };
  const isSuperAdmin = account.role === "super_admin";
  // Festivals zijn agency-side resources — agency_admin/super_admin/agency_member van eigen org mogen
  if (!isSuperAdmin && festival.organization_id !== account.organizationId) {
    return { ok: false, error: "Geen toegang tot dit festival." };
  }
  return { ok: true, organizationId: festival.organization_id, isSuperAdmin };
}
