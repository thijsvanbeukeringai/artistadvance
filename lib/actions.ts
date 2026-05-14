"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  addArtistContact,
  addFlight,
  removeArtistContact,
  removeFlight,
  setSectionData,
  getAdvancingByToken,
  createCompany,
  createArtist,
  setTechItemStatus,
  setVisaData,
  addVisaCrew,
  setVisaCrewStatus,
  confirmBooking,
  uploadSignedRider,
  disputeRider,
  acceptRider,
  setDistances,
  addTechRequirement,
  updateTechRequirement,
  removeTechRequirement,
  addHotelProposal,
  removeHotelProposal,
  signRiderInPortal,
  addFestivalDocument,
  removeFestivalDocument,
  addFestivalContact,
  removeFestivalContact,
  updateBookingCrew,
  addBookingCrewMember,
  removeBookingCrewMember,
  addTimelineEvent,
  updateTimelineEvent,
  removeTimelineEvent,
  setRoomAssignments,
  addGroundTransfer,
  updateGroundTransfer,
  removeGroundTransfer,
  setArtistDefaults,
  addArtistCrewMember,
  updateArtistCrewMember,
  removeArtistCrewMember,
  updateArtist,
  deleteArtist,
  deleteOrganization,
  updateOrganization,
  createBooking,
  updateBooking,
  deleteBooking,
  addFestivalCrmContact,
  updateFestivalCrmContact,
  removeFestivalCrmContact,
  createFestival,
  addBookingContact,
  removeBookingContact,
  updateBookingContact,
  addPaymentMilestone,
  updatePaymentMilestone,
  removePaymentMilestone,
  addBookingTask,
  updateBookingTask,
  removeBookingTask,
  updateArtistContractTemplate,
  setBookingParkingMap,
  setBookingContractPdf,
  syncAdvancingTechFromArtistTemplate,
  upsertArtistRiderTemplate,
  removeArtistRiderTemplate,
  setBookingSelectedRiders,
  getOrCreateLaunchDraft,
  updateLaunchDraft,
  commitLaunch,
  logLaunchEvent,
  findArtistByIntakeSlug,
  submitBookingIntake,
  setArtistIntakeSettings,
  acceptBookingIntake,
  declineBookingIntake,
} from "./db";
import { readAccount } from "./account";
import { loadSnapshot } from "./snapshot";
import { requireBookingAccess, requireArtistAccess, requireFestivalAccess, requireAdvancingAccess } from "./authz";
import type {
  ArtistHospitalityDefaults,
  ArtistHotelDefaults,
  ArtistLogisticsDefaults,
  ArtistTravelDefaults,
  CrewRole,
  FestivalDocumentCategory,
  RiderType,
  GroundTransferStatus,
  GroundTransferType,
  HotelAmenity,
  HotelRoomAssignment,
  HotelRoomOption,
  SectionType,
  ShowType,
  TechCategory,
  TechItemStatus,
  TimelineEventType,
  VisaStatus,
} from "./types";

async function refresh(token: string) {
  revalidatePath(`/portal/${token}`);
  revalidatePath(`/portal/${token}/[section]`, "page");
  const adv = await getAdvancingByToken(token);
  if (adv) revalidatePath(`/advancings/${adv.id}`);
  revalidatePath(`/advancings`);
  revalidatePath(`/`);
}

export async function saveSectionAction(token: string, type: SectionType, patch: Record<string, unknown>) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false, error: "no advancing" };
  await setSectionData(adv.id, type, patch);
  await refresh(token);
  return { ok: true };
}

export async function addArtistContactAction(token: string, formData: FormData) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await addArtistContact(adv.id, {
    role: String(formData.get("role") || "Overig"),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    is_onsite: formData.get("is_onsite") === "on",
  });
  await refresh(token);
  return { ok: true };
}

export async function removeArtistContactAction(token: string, contactId: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return;
  await removeArtistContact(adv.id, contactId);
  await refresh(token);
}

export async function addFlightAction(token: string, formData: FormData) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await addFlight(adv.id, {
    direction: String(formData.get("direction") || "inbound") as "inbound" | "outbound",
    flight_number: String(formData.get("flight_number") || ""),
    airline: String(formData.get("airline") || ""),
    departure_airport: String(formData.get("departure_airport") || ""),
    arrival_airport: String(formData.get("arrival_airport") || ""),
    departure_datetime: String(formData.get("departure_datetime") || ""),
    arrival_datetime: String(formData.get("arrival_datetime") || ""),
    passengers: String(formData.get("passengers") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  await refresh(token);
  return { ok: true };
}

export async function removeFlightAction(token: string, flightId: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return;
  await removeFlight(adv.id, flightId);
  await refresh(token);
}

// Super-admin

export async function createCompanyAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Naam is verplicht" };
  const company = await createCompany({
    name,
    dropbox_root_folder: String(formData.get("dropbox_root_folder") || "").trim() || null,
  });
  revalidatePath("/admin/companies");
  redirect(`/admin/companies/${company.id}`);
}

export async function deleteCompanyAction(companyId: string, confirmName: string) {
  const account = await readAccount();
  if (account.role !== "super_admin") {
    return { ok: false as const, error: "Alleen super-admin mag bedrijven verwijderen." };
  }
  if (account.organizationId === companyId) {
    return { ok: false as const, error: "Je kunt je eigen organisatie niet verwijderen — switch eerst van workspace." };
  }
  const snap = await loadSnapshot();
  const org = snap.organizations.find((o) => o.id === companyId && o.type === "management");
  if (!org) return { ok: false as const, error: "Bedrijf niet gevonden." };
  if (confirmName.trim() !== org.name) {
    return { ok: false as const, error: "Naam komt niet overeen. Verwijdering geannuleerd." };
  }
  await deleteOrganization(companyId);
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function updateCompanyAction(companyId: string, patch: { name?: string; dropbox_root_folder?: string | null }) {
  const account = await readAccount();
  if (account.role !== "super_admin") {
    return { ok: false as const, error: "Alleen super-admin mag bedrijven bewerken." };
  }
  const cleaned: { name?: string; dropbox_root_folder?: string | null } = {};
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) return { ok: false as const, error: "Naam mag niet leeg zijn." };
    cleaned.name = trimmed;
  }
  if (patch.dropbox_root_folder !== undefined) {
    const trimmed = (patch.dropbox_root_folder ?? "").trim();
    cleaned.dropbox_root_folder = trimmed || null;
  }
  await updateOrganization(companyId, cleaned);
  revalidatePath(`/admin/companies/${companyId}`);
  revalidatePath("/admin/companies");
  return { ok: true as const };
}

export async function createBookingAction(artistId: string, formData: FormData) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const festival_id = String(formData.get("festival_id") || "");
  const stage_id = String(formData.get("stage_id") || "");
  const show_type = String(formData.get("show_type") || "festival") as ShowType;
  const show_date = String(formData.get("show_date") || "");
  const show_time = String(formData.get("show_time") || "").trim() || null;
  const setDurStr = String(formData.get("set_duration_minutes") || "").trim();
  const feeStr = String(formData.get("fee") || "").trim();
  const guarantee = String(formData.get("guarantee") || "").trim() || null;
  const contract_status = String(formData.get("contract_status") || "").trim() || null;
  const contact_id = String(formData.get("contact_id") || "").trim();
  const contact_role = String(formData.get("contact_role") || "promoter").trim();

  if (!festival_id || !stage_id || !show_date) {
    return { ok: false as const, error: "Festival, stage en datum zijn verplicht." };
  }
  const created = await createBooking({
    artist_id: artistId,
    festival_id,
    stage_id,
    show_type,
    show_date,
    show_time,
    set_duration_minutes: setDurStr ? Number(setDurStr) : null,
    fee: feeStr ? Number(feeStr) : null,
    guarantee,
    contract_status,
  });
  if (contact_id) {
    try {
      await addBookingContact({
        booking_id: created.id,
        festival_crm_contact_id: contact_id,
        role: contact_role,
        is_primary: true,
      });
    } catch {
      // contact koppelen mag niet de booking-creation om zeep helpen
    }
  }
  revalidatePath(`/artists/${artistId}`);
  revalidatePath(`/artists/${artistId}/calendar`);
  revalidatePath("/bookings");
  revalidatePath("/");
  return { ok: true as const, bookingId: created.id };
}

export async function addFestivalCrmContactAction(festivalId: string, formData: FormData) {
  const az = await requireFestivalAccess(festivalId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false as const, error: "Naam is verplicht." };
  await addFestivalCrmContact({
    festival_id: festivalId,
    name,
    role: String(formData.get("role") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    is_primary: formData.get("is_primary") === "on",
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/festivals");
  revalidatePath(`/festivals/${festivalId}`);
  return { ok: true as const };
}

export async function updateFestivalCrmContactAction(contactId: string, patch: {
  name?: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
  notes?: string | null;
}) {
  const snap = await loadSnapshot();
  const contact = snap.festivalCrmContacts.find((c) => c.id === contactId);
  if (!contact) return { ok: false as const, error: "Contact niet gevonden." };
  const az = await requireFestivalAccess(contact.festival_id);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateFestivalCrmContact(contactId, patch);
  revalidatePath("/festivals");
  return { ok: true as const };
}

export async function removeFestivalCrmContactAction(contactId: string, festivalId: string) {
  const az = await requireFestivalAccess(festivalId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeFestivalCrmContact(contactId);
  revalidatePath("/festivals");
  revalidatePath(`/festivals/${festivalId}`);
  return { ok: true as const };
}

/** Toegestane velden voor updateBookingAction (mass-assignment bescherming). */
const UPDATE_BOOKING_ALLOWED = new Set([
  "festival_id", "stage_id", "show_type", "show_date", "show_time", "set_duration_minutes",
  "fee", "guarantee", "contributions", "contract_status", "is_looped",
  "venue_address", "venue_postcode", "venue_city", "venue_country",
  "parking_info", "parking_map_url",
  "billing_position", "slot_position", "b2b_partner",
  "commission_pct", "vat_pct", "withholding_tax_pct", "travel_buyout", "hotel_buyout",
  "hold_position", "hold_status", "hold_expires_at",
  "radius_km", "radius_days_before", "radius_days_after", "exclusivity_type",
]);

export async function updateBookingAction(bookingId: string, patch: Record<string, unknown>) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  // Whitelist: blokkeer status/confirmed_at/organization_id/etc.
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (UPDATE_BOOKING_ALLOWED.has(k)) safe[k] = v;
  }
  await updateBooking(bookingId, safe);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/");
  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === bookingId);
  if (booking) revalidatePath(`/artists/${booking.artist_id}`);
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Festival CRM: create new festival
// ----------------------------------------------------------------------------
export async function createFestivalAction(formData: FormData) {
  const account = await readAccount();
  if (account.role === "guest") return { ok: false as const, error: "Niet aangemeld." };
  if (!account.organizationId && account.role !== "super_admin") {
    return { ok: false as const, error: "Geen organisatie gekoppeld aan account." };
  }
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false as const, error: "Naam is verplicht." };
  const stagesRaw = String(formData.get("stages") || "").trim();
  const stages = stagesRaw ? stagesRaw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) : [];
  await createFestival({
    organization_id: account.organizationId,
    name,
    location: String(formData.get("location") || "").trim() || undefined,
    country: String(formData.get("country") || "").trim() || null,
    start_date: String(formData.get("start_date") || "").trim() || null,
    end_date: String(formData.get("end_date") || "").trim() || null,
    stages,
  });
  revalidatePath("/festivals");
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Booking contacts (CRM-linked)
// ----------------------------------------------------------------------------
export async function addBookingContactAction(bookingId: string, payload: {
  festival_crm_contact_id: string;
  role: string;
  is_primary?: boolean;
}) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await addBookingContact({ booking_id: bookingId, ...payload });
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

/**
 * Voeg een nieuwe CRM-contact toe aan een festival en koppel meteen aan deze booking.
 * Dit is de "two-way sync": contact in CRM aanmaken vanuit booking-flow.
 */
export async function createBookingContactInCrmAction(bookingId: string, festivalId: string, payload: {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
  notes?: string | null;
  booking_role?: string;
}) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  if (!payload.name.trim()) return { ok: false as const, error: "Naam is verplicht." };
  const { addFestivalCrmContact } = await import("./db");
  const created = await addFestivalCrmContact({
    festival_id: festivalId,
    name: payload.name.trim(),
    role: payload.role || null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    is_primary: !!payload.is_primary,
    notes: payload.notes ?? null,
  });
  await addBookingContact({
    booking_id: bookingId,
    festival_crm_contact_id: created.id,
    role: payload.booking_role || payload.role || "promoter",
    is_primary: !!payload.is_primary,
  });
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/festivals");
  return { ok: true as const };
}

export async function removeBookingContactAction(id: string, bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeBookingContact(id);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

export async function updateBookingContactAction(id: string, bookingId: string, patch: { role?: string; is_primary?: boolean }) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateBookingContact(id, patch);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Payment milestones
// ----------------------------------------------------------------------------
export async function addPaymentMilestoneAction(bookingId: string, payload: {
  label: string;
  amount?: number | null;
  due_date?: string | null;
  notes?: string | null;
}) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await addPaymentMilestone({ booking_id: bookingId, ...payload });
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/financial");
  revalidatePath("/");
  return { ok: true as const };
}

export async function updatePaymentMilestoneAction(id: string, bookingId: string, patch: {
  label?: string;
  amount?: number | null;
  due_date?: string | null;
  status?: string;
  paid_date?: string | null;
  notes?: string | null;
}) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updatePaymentMilestone(id, patch);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/financial");
  revalidatePath("/");
  return { ok: true as const };
}

export async function removePaymentMilestoneAction(id: string, bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removePaymentMilestone(id);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/financial");
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Booking tasks
// ----------------------------------------------------------------------------
export async function addBookingTaskAction(bookingId: string, payload: { label: string; due_date?: string | null }) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  if (!payload.label.trim()) return { ok: false as const, error: "Label is verplicht." };
  await addBookingTask({ booking_id: bookingId, label: payload.label.trim(), due_date: payload.due_date ?? null });
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

export async function updateBookingTaskAction(id: string, bookingId: string, patch: { label?: string; due_date?: string | null; done?: boolean }) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateBookingTask(id, patch);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

export async function removeBookingTaskAction(id: string, bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeBookingTask(id);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Artist contract template
// ----------------------------------------------------------------------------
export async function updateArtistContractTemplateAction(artistId: string, template: string | null) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateArtistContractTemplate(artistId, template);
  revalidatePath(`/artists/${artistId}/settings`);
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Parking map upload
// ----------------------------------------------------------------------------
export async function uploadParkingMapAction(bookingId: string, formData: FormData) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false as const, error: "Geen bestand ontvangen." };
  const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false as const, error: "Alleen PDF, PNG, JPG of WebP toegestaan." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false as const, error: "Bestand te groot (max 20 MB)." };
  }
  const { uploadFile } = await import("./storage");
  const { url } = await uploadFile("booking-assets", [bookingId, "parking"], file);
  await setBookingParkingMap(bookingId, url);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const, url };
}

export async function removeParkingMapAction(bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await setBookingParkingMap(bookingId, null);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

// ----------------------------------------------------------------------------
// Auto-generate contract PDF from artist template
// ----------------------------------------------------------------------------
export async function generateContractAction(bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === bookingId);
  if (!booking) return { ok: false as const, error: "Booking niet gevonden." };
  const artist = snap.artists.find((a) => a.id === booking.artist_id);
  if (!artist) return { ok: false as const, error: "Artiest niet gevonden." };
  if (!artist.contract_template_md || !artist.contract_template_md.trim()) {
    return { ok: false as const, error: "Geen contract-template ingesteld voor deze artiest. Voeg er één toe via Artist settings." };
  }
  const festival = snap.festivals.find((f) => f.id === booking.festival_id);
  const stage = snap.stages.find((s) => s.id === booking.stage_id);
  const primaryContactLink = snap.bookingContacts.find((c) => c.booking_id === bookingId && c.is_primary);
  const promoter = primaryContactLink
    ? snap.festivalCrmContacts.find((c) => c.id === primaryContactLink.festival_crm_contact_id)
    : null;

  const tokens: Record<string, string> = {
    artist_name: artist.name,
    festival_name: festival?.name ?? "",
    festival_location: festival?.location ?? "",
    festival_country: festival?.country ?? "",
    stage_name: stage?.name ?? "",
    show_date: booking.show_date,
    show_time: booking.show_time ?? "",
    set_duration: booking.set_duration_minutes?.toString() ?? "",
    show_type: booking.show_type,
    fee: booking.fee != null ? `EUR ${booking.fee.toLocaleString("nl-NL")}` : "",
    guarantee: booking.guarantee ?? "",
    commission_pct: booking.commission_pct?.toString() ?? "",
    vat_pct: booking.vat_pct?.toString() ?? "",
    promoter_name: promoter?.name ?? "",
    promoter_email: promoter?.email ?? "",
    promoter_phone: promoter?.phone ?? "",
    venue_address: booking.venue_address ?? "",
    venue_city: booking.venue_city ?? "",
    venue_country: booking.venue_country ?? "",
    today: new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" }),
  };

  const rendered = artist.contract_template_md.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => tokens[key] ?? "");

  // Render to PDF
  const { renderToBuffer, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const React = await import("react");
  const styles = StyleSheet.create({
    page: { padding: 50, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4 },
    h1: { fontSize: 18, marginBottom: 12, fontFamily: "Helvetica-Bold" },
    block: { marginTop: 8 },
    line: { marginBottom: 4 },
  });
  const lines = rendered.split("\n");
  const elements = lines.map((line, i) => {
    if (line.startsWith("# ")) {
      return React.createElement(Text, { key: i, style: styles.h1 }, line.replace(/^# /, ""));
    }
    if (line.trim() === "") {
      return React.createElement(View, { key: i, style: { height: 8 } });
    }
    return React.createElement(Text, { key: i, style: styles.line }, line);
  });
  const doc = React.createElement(
    Document,
    null,
    React.createElement(Page, { size: "A4", style: styles.page }, React.createElement(View, null, ...elements)),
  );
  const buffer = await renderToBuffer(doc as any);

  const { uploadFile } = await import("./storage");
  const pdfFile = new File([buffer], `contract_${bookingId}.pdf`, { type: "application/pdf" });
  const { url } = await uploadFile("booking-assets", [bookingId, "contract"], pdfFile);
  await setBookingContractPdf(bookingId, url);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const, url };
}

export async function deleteBookingAction(bookingId: string, artistId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === bookingId);
  if (!booking) return { ok: false as const, error: "Booking niet gevonden." };
  if (booking.status !== "draft") {
    return { ok: false as const, error: "Alleen draft-bookings kunnen verwijderd worden. Confirmed bookings hebben advancings — verwijder de advancing eerst." };
  }
  await deleteBooking(bookingId);
  revalidatePath(`/artists/${artistId}`);
  revalidatePath(`/artists/${artistId}/calendar`);
  revalidatePath("/bookings");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteArtistAction(artistId: string, confirmName: string) {
  const account = await readAccount();
  if (account.role !== "super_admin") {
    return { ok: false as const, error: "Alleen super-admin mag artiesten verwijderen." };
  }
  const snap = await loadSnapshot();
  const artist = snap.artists.find((a) => a.id === artistId);
  if (!artist) return { ok: false as const, error: "Artiest niet gevonden." };
  if (confirmName.trim() !== artist.name) {
    return { ok: false as const, error: "Naam komt niet overeen. Verwijdering geannuleerd." };
  }
  const orgId = artist.organization_id;
  await deleteArtist(artistId);
  revalidatePath(`/admin/companies/${orgId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/artists");
  redirect(`/admin/companies/${orgId}`);
}

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

// Account modus
export async function setAccountAction(mode: "artist" | "agency", id: string) {
  const account = await readAccount();
  if (!account.canImpersonate) return { ok: false as const, error: "Alleen super-admin mag van workspace switchen." };
  const jar = cookies();
  jar.set("aa_account_mode", mode, COOKIE_OPTS);
  jar.set("aa_account_id", id, COOKIE_OPTS);
  revalidatePath("/");
  revalidatePath("/tracker");
  revalidatePath("/bookings");
  revalidatePath("/advancings");
  return { ok: true as const };
}

export async function switchToArtistAction(artistId: string) {
  const account = await readAccount();
  if (!account.canImpersonate) return { ok: false as const, error: "Forbidden." };
  const jar = cookies();
  jar.set("aa_account_mode", "artist", COOKIE_OPTS);
  jar.set("aa_account_id", artistId, COOKIE_OPTS);
  revalidatePath("/");
  redirect("/");
}

/**
 * Switch tussen systemen (Agency ↔ Artist). Auto-picks de juiste id:
 * - agency: organization_id van de gebruiker
 * - artist: eerste artist binnen de organisatie
 * Alleen impersonatable users (super-admin / agency_admin) mogen switchen.
 */
export async function switchSystemAction(target: "agency" | "artist") {
  const account = await readAccount();
  if (!account.canImpersonate) return { ok: false as const, error: "Alleen super-admin of agency-admin mag van systeem switchen." };

  const jar = cookies();
  if (target === "agency") {
    if (!account.organizationId) return { ok: false as const, error: "Geen organisatie gekoppeld." };
    jar.set("aa_account_mode", "agency", COOKIE_OPTS);
    jar.set("aa_account_id", account.organizationId, COOKIE_OPTS);
  } else {
    const { loadSnapshot } = await import("./snapshot");
    const snap = await loadSnapshot();
    const candidates = account.role === "super_admin"
      ? snap.artists
      : snap.artists.filter((a) => a.organization_id === account.organizationId);
    const first = candidates[0];
    if (!first) return { ok: false as const, error: "Geen artiest gevonden om naar over te schakelen." };
    jar.set("aa_account_mode", "artist", COOKIE_OPTS);
    jar.set("aa_account_id", first.id, COOKIE_OPTS);
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}

// Rider PDF parsing via Claude API
export async function parseRiderAction(_artistId: string, formData: FormData) {
  const file = formData.get("rider") as File | null;
  if (!file) return { ok: false as const, error: "Geen bestand ontvangen.", code: "unsupported_file" as const };
  if (file.size === 0) return { ok: false as const, error: "Bestand is leeg.", code: "unsupported_file" as const };
  if (file.size > 20 * 1024 * 1024) return { ok: false as const, error: "Bestand groter dan 20 MB.", code: "unsupported_file" as const };
  const { parseRiderPdf } = await import("./riderParse");
  const buffer = Buffer.from(await file.arrayBuffer());
  return parseRiderPdf(buffer, file.type || "application/pdf");
}

export async function importParsedTechItemsAction(
  artistId: string,
  showType: ShowType,
  items: { category: TechCategory; item_description: string; is_mandatory: boolean; artist_notes?: string }[],
) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  let added = 0;
  for (const item of items) {
    if (!item.item_description?.trim()) continue;
    await addTechRequirement({
      artist_id: artistId,
      show_type: showType,
      category: item.category,
      item_description: item.item_description.trim(),
      is_mandatory: !!item.is_mandatory,
      notes: item.artist_notes?.trim() || undefined,
    });
    added++;
  }
  revalidatePath(`/artists/${artistId}/templates`);
  return { ok: true, added };
}

export async function addTechRequirementAction(artistId: string, formData: FormData) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const description = String(formData.get("item_description") || "").trim();
  if (!description) return { ok: false, error: "Beschrijving verplicht" };
  await addTechRequirement({
    artist_id: artistId,
    show_type: String(formData.get("show_type") || "festival") as ShowType,
    category: String(formData.get("category") || "dj_gear") as TechCategory,
    item_description: description,
    is_mandatory: formData.get("is_mandatory") === "on",
    notes: String(formData.get("notes") || "").trim() || undefined,
  });
  revalidatePath(`/artists/${artistId}/templates`);
  return { ok: true };
}

export async function updateTechRequirementAction(id: string, artistId: string, patch: { item_description?: string; is_mandatory?: boolean; notes?: string; category?: TechCategory }) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateTechRequirement(id, patch);
  revalidatePath(`/artists/${artistId}/templates`);
  return { ok: true };
}

export async function removeTechRequirementAction(id: string, artistId: string) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeTechRequirement(id);
  revalidatePath(`/artists/${artistId}/templates`);
  return { ok: true };
}

// Trigger 1 - booking confirmed pipeline
export async function confirmBookingAction(bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const result = await confirmBooking(bookingId);
  revalidatePath("/bookings");
  revalidatePath("/advancings");
  revalidatePath("/tracker");
  revalidatePath("/");
  if (result?.advancingId) {
    revalidatePath(`/advancings/${result.advancingId}`);
  }
  return result;
}

// Festival rider upload (trigger 4) - accepteert echte File via FormData
export async function uploadSignedRiderAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const riderType = String(formData.get("rider_type") || "technical") as RiderType;
  const signerName = String(formData.get("signer_name") || "").trim() || undefined;
  const signerRole = String(formData.get("signer_role") || "").trim() || undefined;
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Bestand verplicht" };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "Bestand groter dan 20 MB" };

  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false, error: "Geen advancing voor deze token" };

  const { uploadFile } = await import("./storage");
  const { path } = await uploadFile("riders", [adv.id, riderType], file);

  await uploadSignedRider(adv.id, riderType, file.name, path, signerName, signerRole);
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function signRiderInPortalAction(token: string, riderType: RiderType, signerName: string, signerRole?: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  if (!signerName?.trim()) return { ok: false, error: "Naam is verplicht" };
  await signRiderInPortal(adv.id, riderType, signerName.trim(), signerRole?.trim());
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function addHotelProposalAction(token: string, payload: { hotel_name: string; star_rating?: string; address?: string; distance_to_venue_km?: number; amenities: HotelAmenity[]; room_options: HotelRoomOption[]; late_checkout_available: boolean; cancellation_policy?: string; notes?: string; }) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  if (!payload.hotel_name?.trim()) return { ok: false, error: "Hotelnaam verplicht" };
  await addHotelProposal(adv.id, {
    hotel_name: payload.hotel_name.trim(),
    star_rating: payload.star_rating,
    address: payload.address,
    distance_to_venue_km: payload.distance_to_venue_km,
    amenities: payload.amenities ?? [],
    room_options: payload.room_options ?? [],
    late_checkout_available: !!payload.late_checkout_available,
    cancellation_policy: payload.cancellation_policy,
    notes: payload.notes,
  });
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function removeHotelProposalAction(token: string, proposalId: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await removeHotelProposal(adv.id, proposalId);
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function addFestivalDocumentAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const category = String(formData.get("category") || "other") as FestivalDocumentCategory;
  const uploadedBy = String(formData.get("uploaded_by_name") || "").trim() || undefined;
  const notes = String(formData.get("notes") || "").trim() || undefined;
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Bestand verplicht" };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "Bestand groter dan 20 MB" };

  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false, error: "Geen advancing voor deze token" };

  const { uploadFile } = await import("./storage");
  const { path } = await uploadFile("festival-documents", [adv.id, category], file);

  const insertedId = await addFestivalDocument(adv.id, {
    category,
    file_name: file.name,
    storage_path: path,
    uploaded_by_name: uploadedBy,
    notes,
  });

  // Parallel: sync naar Dropbox. Fail-safe — Supabase blijft de source of truth.
  if (insertedId) {
    void syncFestivalDocToDropbox(adv.id, insertedId, category, file);
  }

  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

async function syncFestivalDocToDropbox(
  advancingId: string,
  docId: string,
  category: FestivalDocumentCategory,
  file: File,
) {
  const { resolveFestivalDocContext, buildFestivalDocPath, uploadFileToArtistDropbox } = await import("./dropbox");
  const { markFestivalDocSyncResult, getDropboxFolderForCategory } = await import("./db");
  try {
    const subFolder = getDropboxFolderForCategory(category);
    const ctx = await resolveFestivalDocContext(advancingId, subFolder);
    if ("skipped" in ctx) {
      await markFestivalDocSyncResult(docId, { synced: false, error: ctx.reason });
      return;
    }
    const targetPath = buildFestivalDocPath(ctx, file.name);
    const buf = await file.arrayBuffer();
    const result = await uploadFileToArtistDropbox(ctx.artistId, targetPath, buf, { mode: "add", autorename: true });
    await markFestivalDocSyncResult(docId, {
      synced: true,
      path: result.path_display,
      file_id: result.id,
    });
  } catch (e: any) {
    await markFestivalDocSyncResult(docId, { synced: false, error: e?.message ?? "upload failed" });
  }
}

export async function removeFestivalDocumentAction(token: string, docId: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await removeFestivalDocument(adv.id, docId);
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function retryFestivalDocSyncAction(token: string, docId: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false, error: "Geen advancing" };
  const { retryFestivalDocSync } = await import("./db");
  const r = await retryFestivalDocSync(docId);
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return r;
}

export async function addFestivalContactAction(token: string, formData: FormData) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Naam verplicht" };
  await addFestivalContact(adv.id, {
    role: String(formData.get("role") || "Overig"),
    name,
    email: String(formData.get("email") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
  });
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function removeFestivalContactAction(token: string, contactId: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return;
  await removeFestivalContact(adv.id, contactId);
  await refresh(token);
  revalidatePath(`/festival/${token}`);
}

export async function disputeRiderAction(token: string, riderType: RiderType, reason: string) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await disputeRider(adv.id, riderType, reason);
  await refresh(token);
  return { ok: true };
}

export async function acceptRiderAction(token: string, riderType: RiderType) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await acceptRider(adv.id, riderType);
  await refresh(token);
  return { ok: true };
}

export async function setDistancesAction(token: string, patch: Record<string, number | undefined>) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await setDistances(adv.id, patch);
  await refresh(token);
  revalidatePath(`/festival/${token}`);
  return { ok: true };
}

export async function setTechItemStatusAction(itemId: string, patch: { status?: TechItemStatus; festival_response?: string; alternative_description?: string; management_response?: string }) {
  const item = await setTechItemStatus(itemId, patch);
  if (item) {
    revalidatePath(`/advancings/${item.advancing_id}`);
    revalidatePath("/tracker");
    revalidatePath("/");
    // Festival- en management-portal flushen — daar staan de buttons die
    // dit aanroepen, en die routes zijn anders statisch gecached.
    const { supabaseService } = await import("./supabase-service");
    const { data: adv } = await supabaseService()
      .from("advancings")
      .select("portal_token")
      .eq("id", item.advancing_id)
      .maybeSingle();
    const tok = adv?.portal_token;
    if (tok) {
      revalidatePath(`/festival/${tok}`);
      revalidatePath(`/portal/${tok}`);
      revalidatePath(`/portal/${tok}/[section]`, "page");
    }
  }
  return { ok: !!item };
}

export async function setVisaAction(token: string, patch: { visa_required?: boolean; visa_type?: string; work_permit_required?: boolean; deadline?: string; notes?: string }) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await setVisaData(adv.id, patch);
  await refresh(token);
  return { ok: true };
}

export async function addVisaCrewAction(token: string, formData: FormData) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return { ok: false };
  await addVisaCrew(adv.id, {
    name: String(formData.get("name") || ""),
    status: (String(formData.get("status") || "pending") as VisaStatus),
    notes: String(formData.get("notes") || "") || undefined,
  });
  await refresh(token);
  return { ok: true };
}

export async function setVisaCrewStatusAction(token: string, crewId: string, status: VisaStatus) {
  const adv = await getAdvancingByToken(token);
  if (!adv) return;
  await setVisaCrewStatus(adv.id, crewId, status);
  await refresh(token);
}

// Touring party - edit crew row + add/remove flight on backoffice advancing detail.
export async function updateBookingCrewAction(crewId: string, advancingId: string, patch: { is_traveling?: boolean; needs_flight?: boolean; flight_status?: string; notes?: string }) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateBookingCrew(crewId, patch);
  revalidatePath(`/advancings/${advancingId}`);
  revalidatePath("/tracker");
  return { ok: true as const };
}

// Touring party - voeg crew toe aan een bestaande booking (uit artist defaults of ad-hoc)
export async function addBookingCrewAction(bookingId: string, advancingId: string, payload: {
  artist_crew_id?: string;
  role: CrewRole;
  name: string;
  is_traveling?: boolean;
  needs_flight?: boolean;
}) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  if (!payload.name.trim()) return { ok: false as const, error: "Naam verplicht" };
  await addBookingCrewMember(bookingId, payload);
  revalidatePath(`/advancings/${advancingId}`);
  revalidatePath("/tracker");
  return { ok: true as const };
}

export async function removeBookingCrewAction(crewId: string, advancingId: string) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeBookingCrewMember(crewId);
  revalidatePath(`/advancings/${advancingId}`);
  revalidatePath("/tracker");
  return { ok: true as const };
}

export async function addAdvancingFlightAction(advancingId: string, payload: {
  direction: "inbound" | "outbound";
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_datetime: string;
  arrival_datetime: string;
  passengers: string[];
  booking_reference?: string;
  notes?: string;
  status?: "pending" | "booked" | "confirmed";
}) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await addFlight(advancingId, {
    direction: payload.direction,
    flight_number: payload.flight_number,
    airline: payload.airline,
    departure_airport: payload.departure_airport,
    arrival_airport: payload.arrival_airport,
    departure_datetime: payload.departure_datetime,
    arrival_datetime: payload.arrival_datetime,
    passengers: payload.passengers,
    booking_reference: payload.booking_reference,
    notes: payload.notes,
    status: payload.status ?? "pending",
  });
  revalidatePath(`/advancings/${advancingId}`);
  return { ok: true as const };
}

export async function removeAdvancingFlightAction(advancingId: string, flightId: string) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeFlight(advancingId, flightId);
  revalidatePath(`/advancings/${advancingId}`);
  return { ok: true as const };
}

const HOTEL_FIELD_ALLOWED = new Set([
  "hotel_required",
  "hotel_preference",
  "hotel_confirmed_name",
  "hotel_star_rating",
  "hotel_room_count",
  "hotel_room_type",
  "hotel_nights",
  "hotel_nights_description",
  "hotel_check_in",
  "hotel_check_out",
  "hotel_late_checkout",
]);

const VALID_FESTIVAL_PORTAL_SECTIONS = new Set([
  "tech",
  "program",
  "hotel",
  "distances",
  "travel",
  "documents",
  "riders",
]);

/**
 * Sla op welke blokken in het festival-portal verborgen moeten worden voor
 * deze advancing. Defensief: faalt stilletjes als migratie 030 nog niet
 * gedraaid is (kolom bestaat niet).
 */
export async function setFestivalPortalVisibilityAction(
  advancingId: string,
  hidden: string[],
) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };

  const clean = Array.from(new Set(hidden.filter((s) => VALID_FESTIVAL_PORTAL_SECTIONS.has(s))));

  const { supabaseService } = await import("./supabase-service");
  const { error } = await supabaseService()
    .from("advancings")
    .update({ festival_portal_hidden: clean })
    .eq("id", advancingId);

  if (error) {
    if (error.code === "42703" || error.message.includes("column")) {
      return {
        ok: false as const,
        error: "Database-migratie 030 moet nog gedraaid worden (festival_portal_hidden kolom ontbreekt). Run migrations/030_festival_portal_visibility.sql in Supabase SQL editor.",
      };
    }
    return { ok: false as const, error: error.message };
  }

  revalidatePath(`/advancings/${advancingId}`);
  // Festival-portal token-pad ook flushen
  const { data: adv } = await supabaseService()
    .from("advancings")
    .select("portal_token")
    .eq("id", advancingId)
    .maybeSingle();
  if (adv?.portal_token) revalidatePath(`/festival/${adv.portal_token}`);

  return { ok: true as const };
}

export async function setAdvancingHotelAction(
  advancingId: string,
  patch: Record<string, unknown>,
) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (HOTEL_FIELD_ALLOWED.has(k)) clean[k] = v;
  }
  // Als er hotel-data binnenkomt, markeer hotel als benodigd.
  if (Object.keys(clean).length > 0 && clean.hotel_required === undefined) {
    clean.hotel_required = true;
  }
  await setSectionData(advancingId, "hotel", clean);
  revalidatePath(`/advancings/${advancingId}`);
  return { ok: true as const };
}

/**
 * Sync alle tech-requirement items van de artist-template naar deze advancing.
 * Idempotent: bestaande items (op category+description) worden overgeslagen.
 * Voor advancings die zijn aangemaakt voordat templates waren ingesteld.
 */
export async function syncAdvancingTechAction(advancingId: string) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  try {
    const result = await syncAdvancingTechFromArtistTemplate(advancingId);
    revalidatePath(`/advancings/${advancingId}`);
    revalidatePath(`/advancings`);
    // Portal-paden (token-based) — vind het token zodat we de portal-cache ook flushen
    const { supabaseService } = await import("./supabase-service");
    const { data: adv } = await supabaseService()
      .from("advancings")
      .select("portal_token")
      .eq("id", advancingId)
      .maybeSingle();
    const tok = adv?.portal_token;
    if (tok) {
      revalidatePath(`/portal/${tok}`);
      revalidatePath(`/portal/${tok}/[section]`, "page");
    }
    return { ok: true as const, inserted: result.inserted };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

// ----------------------------------------------------------------------------
// Booking-side flights (writes to advancing_flights; mirror to both views)
// ----------------------------------------------------------------------------
export async function addBookingFlightAction(bookingId: string, payload: {
  direction: "inbound" | "outbound";
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_datetime: string;
  arrival_datetime: string;
  passengers: string[];
  booking_reference?: string;
  notes?: string;
  cost_amount?: number | null;
  paid_by?: "agency" | "promoter" | "artist" | null;
  recharge_to_buyer?: boolean;
}) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === bookingId);
  if (!booking) return { ok: false as const, error: "Booking niet gevonden." };
  const advancing = snap.advancings.find((a) => a.booking_id === bookingId);
  if (!advancing) return { ok: false as const, error: "Bevestig de booking eerst om vluchten toe te voegen." };
  await addFlight(advancing.id, {
    direction: payload.direction,
    flight_number: payload.flight_number,
    airline: payload.airline,
    departure_airport: payload.departure_airport,
    arrival_airport: payload.arrival_airport,
    departure_datetime: payload.departure_datetime,
    arrival_datetime: payload.arrival_datetime,
    passengers: payload.passengers,
    booking_reference: payload.booking_reference,
    notes: payload.notes,
    cost_amount: payload.cost_amount ?? undefined,
    paid_by: payload.paid_by ?? undefined,
    recharge_to_buyer: payload.recharge_to_buyer ?? undefined,
  });
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/advancings/${advancing.id}`);
  revalidatePath("/");
  return { ok: true as const };
}

const UPDATE_FLIGHT_ALLOWED = new Set([
  "direction", "flight_number", "airline", "departure_airport", "arrival_airport",
  "departure_datetime", "arrival_datetime", "passengers", "booking_reference", "notes",
  "status", "cost_amount", "paid_by", "recharge_to_buyer",
]);

export async function updateBookingFlightAction(bookingId: string, flightId: string, patch: Record<string, unknown>) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (UPDATE_FLIGHT_ALLOWED.has(k)) safe[k] = v;
  }
  const { updateFlight } = await import("./db");
  await updateFlight(flightId, safe as any);
  const snap = await loadSnapshot();
  const booking = snap.bookings.find((b) => b.id === bookingId);
  const advancing = booking ? snap.advancings.find((a) => a.booking_id === bookingId) : null;
  revalidatePath(`/bookings/${bookingId}`);
  if (advancing) revalidatePath(`/advancings/${advancing.id}`);
  return { ok: true as const };
}

export async function removeBookingFlightAction(bookingId: string, flightId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const snap = await loadSnapshot();
  const advancing = snap.advancings.find((a) => a.booking_id === bookingId);
  if (!advancing) return { ok: false as const, error: "Advancing niet gevonden." };
  await removeFlight(advancing.id, flightId);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/advancings/${advancing.id}`);
  return { ok: true as const };
}

// Program timeline - generic add/update/remove werkt voor zowel backoffice (advancingId)
// als portal/festival (via getAdvancingByToken).
async function resolveAdvancingId(advancingId?: string, token?: string): Promise<{ id: string | null; error?: string }> {
  if (token) {
    // Token-pad: secret token zelf is de auth — geen extra check nodig.
    const adv = await getAdvancingByToken(token);
    return { id: adv?.id ?? null, error: adv ? undefined : "Token niet gevonden" };
  }
  if (advancingId) {
    // AdvancingId-pad: vereist ingelogde user met eigenaarschap.
    const az = await requireAdvancingAccess(advancingId);
    if (!az.ok) return { id: null, error: az.error };
    return { id: advancingId };
  }
  return { id: null, error: "Geen advancingId of token meegegeven" };
}

function revalidateAllForAdvancing(advancingId: string, token?: string) {
  revalidatePath(`/advancings/${advancingId}`);
  if (token) {
    revalidatePath(`/portal/${token}`);
    revalidatePath(`/festival/${token}`);
  }
  revalidatePath(`/callsheet/${advancingId}`);
}

export async function addTimelineEventAction(input: {
  advancingId?: string;
  token?: string;
  event_type: TimelineEventType;
  datetime: string;
  location?: string;
  responsible_contact?: string;
  notes?: string;
}) {
  const res = await resolveAdvancingId(input.advancingId, input.token);
  if (!res.id) return { ok: false, error: res.error ?? "Geen advancing gevonden" };
  const advId = res.id;
  await addTimelineEvent(advId, {
    event_type: input.event_type,
    datetime: input.datetime,
    location: input.location,
    responsible_contact: input.responsible_contact,
    notes: input.notes,
  });
  revalidateAllForAdvancing(advId, input.token);
  return { ok: true };
}

export async function updateTimelineEventAction(input: {
  id: string;
  advancingId?: string;
  token?: string;
  patch: {
    event_type?: TimelineEventType;
    datetime?: string;
    location?: string;
    responsible_contact?: string;
    notes?: string;
  };
}) {
  const res = await resolveAdvancingId(input.advancingId, input.token);
  if (!res.id) return { ok: false, error: res.error ?? "Geen advancing gevonden" };
  const advId = res.id;
  await updateTimelineEvent(input.id, input.patch);
  revalidateAllForAdvancing(advId, input.token);
  return { ok: true };
}

export async function removeTimelineEventAction(input: { id: string; advancingId?: string; token?: string }) {
  const res = await resolveAdvancingId(input.advancingId, input.token);
  if (!res.id) return { ok: false, error: res.error ?? "Geen advancing gevonden" };
  const advId = res.id;
  await removeTimelineEvent(input.id);
  revalidateAllForAdvancing(advId, input.token);
  return { ok: true };
}

// Hotel room-indeling
export async function setRoomAssignmentsAction(advancingId: string, assignments: HotelRoomAssignment[]) {
  const az = await requireAdvancingAccess(advancingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await setRoomAssignments(advancingId, assignments);
  revalidatePath(`/advancings/${advancingId}`);
  return { ok: true as const };
}

// Ground transfers - werkt voor zowel backoffice (advancingId) als festival portal (token)
export async function addGroundTransferAction(input: {
  advancingId?: string;
  token?: string;
  payload: {
    transfer_type: GroundTransferType;
    linked_flight_id?: string;
    pickup_datetime?: string;
    dropoff_datetime?: string;
    pickup_location?: string;
    dropoff_location?: string;
    vehicle_type?: string;
    vehicle_capacity?: number;
    driver_name?: string;
    driver_phone?: string;
    driver_company?: string;
    passengers?: string[];
    status?: GroundTransferStatus;
    notes?: string;
    created_by_role?: string;
  };
}) {
  const res = await resolveAdvancingId(input.advancingId, input.token);
  if (!res.id) return { ok: false, error: res.error ?? "Geen advancing gevonden" };
  const advId = res.id;
  await addGroundTransfer(advId, input.payload);
  revalidateAllForAdvancing(advId, input.token);
  return { ok: true };
}

export async function updateGroundTransferAction(input: {
  id: string;
  advancingId?: string;
  token?: string;
  patch: Parameters<typeof updateGroundTransfer>[1];
}) {
  const res = await resolveAdvancingId(input.advancingId, input.token);
  if (!res.id) return { ok: false, error: res.error ?? "Geen advancing gevonden" };
  const advId = res.id;
  await updateGroundTransfer(input.id, input.patch);
  revalidateAllForAdvancing(advId, input.token);
  return { ok: true };
}

export async function removeGroundTransferAction(input: { id: string; advancingId?: string; token?: string }) {
  const res = await resolveAdvancingId(input.advancingId, input.token);
  if (!res.id) return { ok: false, error: res.error ?? "Geen advancing gevonden" };
  const advId = res.id;
  await removeGroundTransfer(input.id);
  revalidateAllForAdvancing(advId, input.token);
  return { ok: true };
}

// Artist defaults + crew CRUD (gebruikt op /artists/[id]/settings)
export async function setArtistDefaultsAction(artistId: string, patch: {
  defaults_hospitality?: ArtistHospitalityDefaults | null;
  defaults_hotel?: ArtistHotelDefaults | null;
  defaults_travel?: ArtistTravelDefaults | null;
  defaults_logistics?: ArtistLogisticsDefaults | null;
}) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await setArtistDefaults(artistId, patch);
  revalidatePath(`/artists/${artistId}/settings`);
  revalidatePath(`/artists/${artistId}`);
  return { ok: true as const };
}

export async function addArtistCrewAction(artistId: string, payload: {
  role: CrewRole;
  name: string;
  email?: string;
  phone?: string;
  is_default?: boolean;
}) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  if (!payload.name.trim()) return { ok: false as const, error: "Naam verplicht" };
  await addArtistCrewMember(artistId, payload);
  revalidatePath(`/artists/${artistId}/settings`);
  revalidatePath(`/artists/${artistId}`);
  return { ok: true as const };
}

export async function updateArtistCrewAction(crewId: string, artistId: string, patch: {
  role?: CrewRole;
  name?: string;
  email?: string | null;
  phone?: string | null;
  is_default?: boolean;
}) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateArtistCrewMember(crewId, patch);
  revalidatePath(`/artists/${artistId}/settings`);
  return { ok: true as const };
}

export async function removeArtistCrewAction(crewId: string, artistId: string) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeArtistCrewMember(crewId);
  revalidatePath(`/artists/${artistId}/settings`);
  return { ok: true as const };
}

export async function createArtistAction(orgId: string, formData: FormData) {
  const account = await readAccount();
  if (account.role === "guest") return { ok: false as const, error: "Niet aangemeld." };
  // Alleen super_admin of agency_admin/member van eigen org mag artiesten toevoegen
  if (account.role !== "super_admin" && account.organizationId !== orgId) {
    return { ok: false as const, error: "Geen toegang tot deze organisatie." };
  }
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false as const, error: "Naam is verplicht" };
  await createArtist({
    name,
    organization_id: orgId,
    dropbox_artist_folder: String(formData.get("dropbox_artist_folder") || "").trim() || null,
    manager_name: String(formData.get("manager_name") || "").trim() || null,
    manager_email: String(formData.get("manager_email") || "").trim() || null,
    manager_phone: String(formData.get("manager_phone") || "").trim() || null,
  });
  revalidatePath(`/admin/companies/${orgId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/artists");
  return { ok: true as const };
}

export async function updateArtistManagerAction(artistId: string, patch: {
  manager_name?: string | null;
  manager_email?: string | null;
  manager_phone?: string | null;
}) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateArtist(artistId, patch);
  revalidatePath(`/artists/${artistId}`);
  revalidatePath(`/artists/${artistId}/settings`);
  return { ok: true as const };
}

export async function updateArtistDropboxFolderAction(artistId: string, folder: string | null) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const { normalizeFolderPath, ensureArtistRootFolder, isArtistConnected } = await import("./dropbox");
  const normalized = normalizeFolderPath(folder ?? "") || null;
  await updateArtist(artistId, { dropbox_artist_folder: normalized });
  let folderError: string | null = null;
  if (normalized && (await isArtistConnected(artistId))) {
    try {
      await ensureArtistRootFolder(artistId);
    } catch (e: any) {
      folderError = e?.message ?? "Folder-aanmaken faalde";
    }
  }
  revalidatePath(`/artists/${artistId}/settings`);
  if (folderError) return { ok: false as const, error: folderError };
  return { ok: true as const };
}

// ============================================================================
// Rider templates per artist
// ============================================================================

export async function uploadArtistRiderTemplateAction(artistId: string, formData: FormData) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const riderType = String(formData.get("rider_type") || "") as RiderType;
  const file = formData.get("file") as File | null;
  if (!riderType) return { ok: false as const, error: "rider_type vereist" };
  if (!file || file.size === 0) return { ok: false as const, error: "Bestand vereist" };
  if (file.size > 20 * 1024 * 1024) return { ok: false as const, error: "Max 20 MB" };

  const { uploadFile } = await import("./storage");
  const { path } = await uploadFile("rider-templates", [artistId, riderType], file);
  await upsertArtistRiderTemplate(artistId, riderType, {
    file_name: file.name,
    storage_path: path,
  });
  revalidatePath(`/artists/${artistId}/settings`);
  revalidatePath(`/artists/${artistId}/templates`);
  return { ok: true as const };
}

export async function removeArtistRiderTemplateAction(artistId: string, riderType: RiderType) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await removeArtistRiderTemplate(artistId, riderType);
  revalidatePath(`/artists/${artistId}/settings`);
  revalidatePath(`/artists/${artistId}/templates`);
  return { ok: true as const };
}

export async function setBookingSelectedRidersAction(bookingId: string, riderTypes: RiderType[]) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await setBookingSelectedRiders(bookingId, riderTypes);
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true as const };
}

// ============================================================================
// Launch wizard
// ============================================================================

export async function startLaunchAction(bookingId: string) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const draft = await getOrCreateLaunchDraft(bookingId);
  await logLaunchEvent(bookingId, draft.id, "launch_started");
  return { ok: true as const, draft };
}

export async function saveLaunchStepAction(
  bookingId: string,
  launchId: string,
  patch: { current_step?: number; state?: Record<string, unknown> },
) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await updateLaunchDraft(launchId, patch);
  revalidatePath(`/bookings/${bookingId}/launch`);
  return { ok: true as const };
}

export async function commitLaunchAction(
  bookingId: string,
  launchId: string,
  idempotencyKey: string,
) {
  const az = await requireBookingAccess(bookingId);
  if (!az.ok) return { ok: false as const, error: az.error };
  const r = await commitLaunch(launchId, idempotencyKey);
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath(`/bookings/${bookingId}/launch`);
  if (r.ok) revalidatePath(`/advancings/${r.advancingId}`);
  return r;
}

// ============================================================================
// Intake-link: publieke submission + artist accept/decline
// ============================================================================

export async function submitIntakeAction(slug: string, formData: FormData) {
  const artist = await findArtistByIntakeSlug(slug);
  if (!artist || !artist.intake_enabled) {
    return { ok: false as const, error: "Intake niet beschikbaar" };
  }
  const festivalName = String(formData.get("festival_name") || "").trim();
  const promoterName = String(formData.get("promoter_name") || "").trim();
  const promoterEmail = String(formData.get("promoter_email") || "").trim();
  const showDate = String(formData.get("show_date") || "").trim();
  if (!festivalName || !promoterName || !promoterEmail || !showDate) {
    return { ok: false as const, error: "Festival, datum, naam en email zijn verplicht" };
  }
  const headers = await import("next/headers").then((m) => m.headers());
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = headers.get("user-agent") ?? null;

  await submitBookingIntake({
    artist_id: artist.id,
    festival_name: festivalName,
    stage_name: String(formData.get("stage_name") || "").trim() || undefined,
    show_date: showDate,
    show_time: String(formData.get("show_time") || "").trim() || undefined,
    set_duration_minutes: formData.get("set_duration_minutes")
      ? Number(formData.get("set_duration_minutes"))
      : undefined,
    show_type: String(formData.get("show_type") || "club"),
    venue_city: String(formData.get("venue_city") || "").trim() || undefined,
    venue_country: String(formData.get("venue_country") || "").trim() || undefined,
    fee: formData.get("fee") ? Number(formData.get("fee")) : undefined,
    promoter_name: promoterName,
    promoter_email: promoterEmail,
    promoter_phone: String(formData.get("promoter_phone") || "").trim() || undefined,
    promoter_company: String(formData.get("promoter_company") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
    ip_address: ip ?? undefined,
    user_agent: ua ?? undefined,
  });
  return { ok: true as const };
}

export async function updateArtistIntakeAction(
  artistId: string,
  patch: { intake_slug?: string | null; intake_enabled?: boolean },
) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  if (patch.intake_slug !== undefined) {
    const slug = (patch.intake_slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    patch.intake_slug = slug || null;
  }
  await setArtistIntakeSettings(artistId, patch);
  revalidatePath(`/artists/${artistId}/settings`);
  return { ok: true as const };
}

export async function acceptIntakeAction(intakeId: string, artistId: string) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  try {
    const { bookingId } = await acceptBookingIntake(intakeId);
    revalidatePath(`/artists/${artistId}/intakes`);
    revalidatePath(`/bookings`);
    return { ok: true as const, bookingId };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? "Accept faalde" };
  }
}

export async function declineIntakeAction(intakeId: string, artistId: string) {
  const az = await requireArtistAccess(artistId);
  if (!az.ok) return { ok: false as const, error: az.error };
  await declineBookingIntake(intakeId);
  revalidatePath(`/artists/${artistId}/intakes`);
  return { ok: true as const };
}
