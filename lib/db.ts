// Supabase-backed writers + targeted reads.
// Replaces lib/store.ts mutations. Pages read via lib/snapshot.ts (cached);
// mutations call here and trigger revalidatePath in lib/actions.ts.

import "server-only";
import { supabaseService } from "./supabase-service";
import type {
  ContactPerson,
  DropboxFolder,
  FestivalDocumentCategory,
  FlightInfo,
  HotelAmenity,
  HotelRoomOption,
  RiderType,
  SectionType,
  ShowType,
  TechCategory,
  TechItemStatus,
  VisaStatus,
} from "./types";

// Service-role client (RLS bypass) — alleen voor server-side writes.
function client() {
  return supabaseService();
}

// Map festival document category -> Dropbox folder.
const DOC_CATEGORY_MAP: Record<FestivalDocumentCategory, { folder: DropboxFolder; section?: SectionType }> = {
  timetable: { folder: "00_GENERAL", section: "logistics" },
  stage_specs: { folder: "01_STAGE", section: "stage" },
  stage_drawings: { folder: "01_STAGE", section: "stage" },
  stage_view: { folder: "01_STAGE", section: "stage" },
  audio_specs: { folder: "05_AUDIO", section: "audio" },
  monitor_specs: { folder: "05_AUDIO", section: "monitors" },
  venue_light_specs: { folder: "02_LIGHTING", section: "light" },
  patch_file: { folder: "02_LIGHTING", section: "light" },
  wysiwyg: { folder: "02_LIGHTING", section: "light" },
  grandma_showfile: { folder: "02_LIGHTING", section: "light" },
  video_specs: { folder: "03_VIDEO", section: "video" },
  pixel_mapping: { folder: "03_VIDEO", section: "video" },
  resolume_xml: { folder: "03_VIDEO", section: "video" },
  laser_specs: { folder: "06_LASER", section: "lasers" },
  laser_positions: { folder: "06_LASER", section: "lasers" },
  network_diagram: { folder: "00_GENERAL", section: "ethernet" },
  deal_memo: { folder: "00_GENERAL" },
  contract: { folder: "00_GENERAL" },
  other: { folder: "00_GENERAL" },
};

// ============================================================================
// Reads gebruikt door actions
// ============================================================================

export async function getAdvancingByToken(token: string): Promise<{ id: string; booking_id: string } | null> {
  const c = client();
  const { data, error } = await c.from("advancings").select("id, booking_id").eq("portal_token", token).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ============================================================================
// Section data (logistics / travel / hotel / hospitality)
// ============================================================================

const SECTION_FIELD_KEYS: Partial<Record<SectionType, string[]>> = {
  logistics: ["load_in_time", "soundcheck_time", "show_time", "load_out_time", "crew_traveling", "parking_spots_needed", "doors_time", "curfew_time", "notes"],
  travel: ["ground_transport_airport_hotel", "ground_transport_hotel_venue", "ground_transport_venue_hotel", "ground_transport_hotel_airport", "transport_special_requests", "notes"],
  hotel: ["hotel_required", "hotel_star_rating", "hotel_room_count", "hotel_room_type", "hotel_check_in", "hotel_check_out", "hotel_nights", "hotel_late_checkout"],
  hospitality: ["party_size", "hot_meal_required", "dressing_room_count", "specific_requests"],
};

const NON_TECH_TABLE: Partial<Record<SectionType, string>> = {
  logistics: "advancing_logistics",
  travel: "advancing_travel",
  hotel: "advancing_hotel",
  hospitality: "advancing_hospitality",
};

async function upsertSectionRow(advId: string, type: SectionType, patch: Record<string, unknown>) {
  const table = NON_TECH_TABLE[type];
  if (!table) return;
  const c = client();
  // Find existing row
  const { data: existing } = await c.from(table).select("id").eq("advancing_id", advId).maybeSingle();
  const row = { advancing_id: advId, ...patch };
  if (existing?.id) {
    const { error } = await c.from(table).update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await c.from(table).insert(row);
    if (error) throw error;
  }
}

async function recomputeSectionPercent(advId: string, type: SectionType): Promise<{ percent: number; status: "empty" | "in_progress" | "complete" }> {
  const c = client();
  let percent = 0;
  if (type === "contacts") {
    const { count } = await c.from("advancing_contacts_artist").select("*", { count: "exact", head: true }).eq("advancing_id", advId);
    percent = Math.min(100, (count ?? 0) * 33);
  } else if (type === "visa") {
    const { data: visa } = await c.from("advancing_visa").select("*").eq("advancing_id", advId).maybeSingle();
    if (!visa) percent = 0;
    else if (!visa.visa_required && !visa.work_permit_required) percent = 100;
    else {
      const { count: crewCount } = await c.from("advancing_visa_crew").select("*", { count: "exact", head: true }).eq("advancing_id", advId);
      const filled = [visa.visa_type, visa.deadline, (crewCount ?? 0) > 0].filter(Boolean).length;
      percent = Math.round((filled / 3) * 100);
    }
  } else if (["dj_gear","monitors","audio","light","video","lasers","sfx_pyro","stage","ethernet","communication","power","backline"].includes(type)) {
    const { data } = await c.from("advancing_tech_items").select("status").eq("advancing_id", advId).eq("category", type);
    const items = data ?? [];
    if (items.length === 0) percent = 0;
    else {
      // "requested" = items zijn opgesteld + naar festival gestuurd, maar nog
      // niet bevestigd. Telt als 'gestart' (10%) zodat de sectie niet als
      // empty terug komt. "Sent" maar nog niet beantwoord = ~10% klaar.
      const score = items.reduce((s: number, i: any) => {
        if (i.status === "accepted") return s + 1;
        if (i.status === "confirmed") return s + 0.85;
        if (i.status === "alternative_offered") return s + 0.4;
        if (i.status === "not_available") return s + 0.2;
        if (i.status === "disputed") return s - 0.2;
        if (i.status === "requested") return s + 0.1;
        return s;
      }, 0);
      percent = Math.max(0, Math.min(100, Math.round((score / items.length) * 100)));
    }
  } else {
    const table = NON_TECH_TABLE[type];
    const keys = SECTION_FIELD_KEYS[type] ?? [];
    if (!table || keys.length === 0) return { percent: 0, status: "empty" };
    const { data } = await c.from(table).select("*").eq("advancing_id", advId).maybeSingle();
    if (!data) return { percent: 0, status: "empty" };
    const filled = keys.filter((k) => {
      const v = (data as Record<string, unknown>)[k];
      return v !== null && v !== undefined && v !== "" && v !== false;
    }).length;
    percent = Math.round((filled / keys.length) * 100);
  }
  const status = percent === 0 ? "empty" : percent >= 100 ? "complete" : "in_progress";
  return { percent, status };
}

async function syncSectionStatus(advId: string, type: SectionType) {
  const c = client();
  const { percent, status } = await recomputeSectionPercent(advId, type);
  const { data: existing } = await c.from("advancing_sections").select("id").eq("advancing_id", advId).eq("section_type", type).maybeSingle();
  const row = { advancing_id: advId, section_type: type, status, completion_percent: percent, last_updated_at: new Date().toISOString() };
  if (existing?.id) {
    await c.from("advancing_sections").update(row).eq("id", existing.id);
  } else {
    await c.from("advancing_sections").insert(row);
  }
}

export async function setSectionData(advId: string, type: SectionType, patch: Record<string, unknown>) {
  await upsertSectionRow(advId, type, patch);
  await syncSectionStatus(advId, type);
}

// ============================================================================
// Artist contacts
// ============================================================================

export async function addArtistContact(advId: string, contact: Omit<ContactPerson, "id">) {
  const c = client();
  await c.from("advancing_contacts_artist").insert({
    advancing_id: advId,
    role: contact.role,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    is_onsite: contact.is_onsite ?? false,
  });
  await syncSectionStatus(advId, "contacts");
}

export async function removeArtistContact(advId: string, contactId: string) {
  const c = client();
  await c.from("advancing_contacts_artist").delete().eq("id", contactId);
  await syncSectionStatus(advId, "contacts");
}

// ============================================================================
// Festival contacts
// ============================================================================

export async function addFestivalContact(advId: string, contact: Omit<ContactPerson, "id" | "is_onsite">) {
  const c = client();
  await c.from("advancing_contacts_festival").insert({
    advancing_id: advId,
    role: contact.role,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
  });
}

export async function removeFestivalContact(advId: string, contactId: string) {
  const c = client();
  await c.from("advancing_contacts_festival").delete().eq("id", contactId);
}

// ============================================================================
// Flights
// ============================================================================

export async function addFlight(advId: string, flight: Omit<FlightInfo, "id" | "status"> & { status?: FlightInfo["status"] }) {
  const c = client();
  await c.from("advancing_flights").insert({
    advancing_id: advId,
    direction: flight.direction,
    flight_number: flight.flight_number,
    airline: flight.airline,
    departure_airport: flight.departure_airport,
    arrival_airport: flight.arrival_airport,
    departure_datetime: flight.departure_datetime,
    arrival_datetime: flight.arrival_datetime,
    passengers: flight.passengers,
    booking_reference: flight.booking_reference ?? null,
    notes: flight.notes ?? null,
    status: flight.status ?? "pending",
    cost_amount: flight.cost_amount ?? null,
    paid_by: flight.paid_by ?? null,
    recharge_to_buyer: flight.recharge_to_buyer ?? false,
  });
  await syncSectionStatus(advId, "travel");
}

export async function updateFlight(flightId: string, patch: Partial<FlightInfo>) {
  const c = client();
  const row: Record<string, unknown> = {};
  if (patch.direction !== undefined) row.direction = patch.direction;
  if (patch.flight_number !== undefined) row.flight_number = patch.flight_number;
  if (patch.airline !== undefined) row.airline = patch.airline;
  if (patch.departure_airport !== undefined) row.departure_airport = patch.departure_airport;
  if (patch.arrival_airport !== undefined) row.arrival_airport = patch.arrival_airport;
  if (patch.departure_datetime !== undefined) row.departure_datetime = patch.departure_datetime;
  if (patch.arrival_datetime !== undefined) row.arrival_datetime = patch.arrival_datetime;
  if (patch.passengers !== undefined) row.passengers = patch.passengers;
  if (patch.booking_reference !== undefined) row.booking_reference = patch.booking_reference;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.cost_amount !== undefined) row.cost_amount = patch.cost_amount;
  if (patch.paid_by !== undefined) row.paid_by = patch.paid_by;
  if (patch.recharge_to_buyer !== undefined) row.recharge_to_buyer = patch.recharge_to_buyer;
  await c.from("advancing_flights").update(row).eq("id", flightId);
}

export async function removeFlight(advId: string, flightId: string) {
  const c = client();
  await c.from("advancing_flights").delete().eq("id", flightId);
  await syncSectionStatus(advId, "travel");
}

// ============================================================================
// Artist defaults (per-artiest standaarden voor crew, hospitality, hotel, travel)
// ============================================================================

import type { ArtistHospitalityDefaults, ArtistHotelDefaults, ArtistTravelDefaults, ArtistLogisticsDefaults, CrewRole } from "./types";

export async function setArtistDefaults(artistId: string, patch: {
  defaults_hospitality?: ArtistHospitalityDefaults | null;
  defaults_hotel?: ArtistHotelDefaults | null;
  defaults_travel?: ArtistTravelDefaults | null;
  defaults_logistics?: ArtistLogisticsDefaults | null;
}) {
  const c = client();
  const { error } = await c.from("artists").update(patch).eq("id", artistId);
  if (error) throw error;
}

export async function addArtistCrewMember(artistId: string, payload: {
  role: CrewRole;
  name: string;
  email?: string;
  phone?: string;
  is_default?: boolean;
}) {
  const c = client();
  await c.from("artist_crew").insert({
    artist_id: artistId,
    role: payload.role,
    name: payload.name,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    is_default: payload.is_default ?? true,
  });
}

export async function updateArtistCrewMember(id: string, patch: {
  role?: CrewRole;
  name?: string;
  email?: string | null;
  phone?: string | null;
  is_default?: boolean;
}) {
  const c = client();
  const { error } = await c.from("artist_crew").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeArtistCrewMember(id: string) {
  const c = client();
  await c.from("artist_crew").delete().eq("id", id);
}

// ============================================================================
// Hotel room assignments
// ============================================================================

import type { HotelRoomAssignment, GroundTransferType, GroundTransferStatus } from "./types";

export async function setRoomAssignments(advId: string, assignments: HotelRoomAssignment[]) {
  const c = client();
  // Upsert: probeer eerst update, anders insert
  const { data: existing } = await c.from("advancing_hotel").select("id").eq("advancing_id", advId).maybeSingle();
  if (existing?.id) {
    await c.from("advancing_hotel").update({ room_assignments: assignments }).eq("id", existing.id);
  } else {
    await c.from("advancing_hotel").insert({ advancing_id: advId, hotel_required: true, room_assignments: assignments });
  }
  await syncSectionStatus(advId, "hotel");
}

// ============================================================================
// Ground transfers (festival ground travel rondom flights)
// ============================================================================

export async function addGroundTransfer(advId: string, payload: {
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
}) {
  const c = client();
  await c.from("advancing_ground_transfers").insert({
    advancing_id: advId,
    transfer_type: payload.transfer_type,
    linked_flight_id: payload.linked_flight_id ?? null,
    pickup_datetime: payload.pickup_datetime ?? null,
    dropoff_datetime: payload.dropoff_datetime ?? null,
    pickup_location: payload.pickup_location ?? null,
    dropoff_location: payload.dropoff_location ?? null,
    vehicle_type: payload.vehicle_type ?? null,
    vehicle_capacity: payload.vehicle_capacity ?? null,
    driver_name: payload.driver_name ?? null,
    driver_phone: payload.driver_phone ?? null,
    driver_company: payload.driver_company ?? null,
    passengers: payload.passengers ?? null,
    status: payload.status ?? "pending",
    notes: payload.notes ?? null,
    created_by_role: payload.created_by_role ?? null,
  });
  await syncSectionStatus(advId, "travel");
}

export async function updateGroundTransfer(id: string, patch: Partial<{
  transfer_type: GroundTransferType;
  linked_flight_id: string | null;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location: string;
  dropoff_location: string;
  vehicle_type: string;
  vehicle_capacity: number;
  driver_name: string;
  driver_phone: string;
  driver_company: string;
  passengers: string[];
  status: GroundTransferStatus;
  notes: string;
}>) {
  const c = client();
  const { error } = await c.from("advancing_ground_transfers").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeGroundTransfer(id: string) {
  const c = client();
  await c.from("advancing_ground_transfers").delete().eq("id", id);
}

// ============================================================================
// Program timeline (run-of-show)
// ============================================================================

import type { TimelineEventType } from "./types";

export async function addTimelineEvent(advId: string, payload: {
  event_type: TimelineEventType;
  datetime: string;
  location?: string;
  responsible_contact?: string;
  notes?: string;
}) {
  const c = client();
  await c.from("advancing_timeline").insert({
    advancing_id: advId,
    event_type: payload.event_type,
    datetime: payload.datetime,
    location: payload.location ?? null,
    responsible_contact: payload.responsible_contact ?? null,
    notes: payload.notes ?? null,
  });
}

export async function updateTimelineEvent(id: string, patch: {
  event_type?: TimelineEventType;
  datetime?: string;
  location?: string;
  responsible_contact?: string;
  notes?: string;
}) {
  const c = client();
  const { error } = await c.from("advancing_timeline").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeTimelineEvent(id: string) {
  const c = client();
  await c.from("advancing_timeline").delete().eq("id", id);
}

// ============================================================================
// Booking crew (touring party)
// ============================================================================

export async function updateBookingCrew(id: string, patch: { is_traveling?: boolean; needs_flight?: boolean; flight_status?: string; notes?: string }) {
  const c = client();
  const { error } = await c.from("booking_crew").update(patch).eq("id", id);
  if (error) throw error;
}

export async function addBookingCrewMember(bookingId: string, payload: {
  artist_crew_id?: string;
  role: CrewRole;
  name: string;
  is_traveling?: boolean;
  needs_flight?: boolean;
  flight_status?: string;
  notes?: string;
}) {
  const c = client();
  const { error } = await c.from("booking_crew").insert({
    booking_id: bookingId,
    artist_crew_id: payload.artist_crew_id ?? null,
    role: payload.role,
    name: payload.name,
    is_traveling: payload.is_traveling ?? true,
    needs_flight: payload.needs_flight ?? true,
    flight_status: payload.flight_status ?? "pending",
    notes: payload.notes ?? null,
  });
  if (error) throw error;
}

export async function removeBookingCrewMember(id: string) {
  const c = client();
  await c.from("booking_crew").delete().eq("id", id);
}

// ============================================================================
// Tech items (PLEASE CONFIRM)
// ============================================================================

export async function setTechItemStatus(itemId: string, patch: { status?: TechItemStatus; festival_response?: string; alternative_description?: string; management_response?: string }) {
  const c = client();
  const update: Record<string, unknown> = { ...patch };
  if (patch.status === "confirmed" || patch.status === "accepted") {
    update.confirmed_at = new Date().toISOString();
  }
  const { data, error } = await c.from("advancing_tech_items").update(update).eq("id", itemId).select("*").maybeSingle();
  if (error) throw error;
  if (data) {
    await syncSectionStatus(data.advancing_id, data.category as SectionType);
  }
  return data;
}

// ============================================================================
// Visa
// ============================================================================

export async function setVisaData(advId: string, patch: { visa_required?: boolean; visa_type?: string; work_permit_required?: boolean; deadline?: string; notes?: string }) {
  const c = client();
  const { data: existing } = await c.from("advancing_visa").select("id").eq("advancing_id", advId).maybeSingle();
  if (existing?.id) {
    await c.from("advancing_visa").update(patch).eq("id", existing.id);
  } else {
    await c.from("advancing_visa").insert({ advancing_id: advId, visa_required: false, work_permit_required: false, ...patch });
  }
  await syncSectionStatus(advId, "visa");
}

export async function addVisaCrew(advId: string, payload: { name: string; status: VisaStatus; notes?: string }) {
  const c = client();
  await c.from("advancing_visa_crew").insert({ advancing_id: advId, name: payload.name, status: payload.status, notes: payload.notes });
  await syncSectionStatus(advId, "visa");
}

export async function setVisaCrewStatus(advId: string, crewId: string, status: VisaStatus) {
  const c = client();
  await c.from("advancing_visa_crew").update({ status }).eq("id", crewId);
  await syncSectionStatus(advId, "visa");
}

// ============================================================================
// Signed riders
// ============================================================================

async function upsertRider(advId: string, riderType: RiderType, patch: Record<string, unknown>) {
  const c = client();
  const { data: existing } = await c.from("signed_riders").select("id").eq("advancing_id", advId).eq("rider_type", riderType).maybeSingle();
  if (existing?.id) {
    await c.from("signed_riders").update(patch).eq("id", existing.id);
  } else {
    await c.from("signed_riders").insert({ advancing_id: advId, rider_type: riderType, status: "pending", ...patch });
  }
}

export async function uploadSignedRider(
  advId: string,
  riderType: RiderType,
  fileName: string,
  storagePath: string | null,
  signerName?: string,
  signerRole?: string,
) {
  await upsertRider(advId, riderType, {
    status: "signed",
    signed_rider_file_name: fileName,
    signed_storage_path: storagePath,
    signed_at: new Date().toISOString(),
    signed_by_name: signerName,
    signed_by_role: signerRole,
    signed_method: "uploaded_pdf",
  });
  await logActivity(advId, signerName ?? "Festival", "festival", "rider_signed", undefined, `${riderType} rider geüpload`);
}

export async function signRiderInPortal(advId: string, riderType: RiderType, signerName: string, signerRole?: string) {
  await upsertRider(advId, riderType, {
    status: "signed",
    signed_at: new Date().toISOString(),
    signed_by_name: signerName,
    signed_by_role: signerRole,
    signed_method: "in_portal",
  });
  await logActivity(advId, signerName, "festival", "rider_signed", undefined, `${riderType} rider digitaal getekend`);
}

export async function disputeRider(advId: string, riderType: RiderType, reason: string) {
  await upsertRider(advId, riderType, {
    status: "disputed",
    dispute_notes: reason,
  });
  await logActivity(advId, "Festival", "festival", "rider_disputed", undefined, reason);
}

export async function acceptRider(advId: string, riderType: RiderType) {
  await upsertRider(advId, riderType, {
    status: "accepted",
    accepted_at: new Date().toISOString(),
  });
  await logActivity(advId, "Management", "management", "rider_accepted", undefined, `${riderType} rider geaccepteerd`);
}

// ============================================================================
// Hotel proposals
// ============================================================================

export async function addHotelProposal(advId: string, payload: {
  hotel_name: string;
  star_rating?: string;
  address?: string;
  distance_to_venue_km?: number;
  amenities: HotelAmenity[];
  room_options: HotelRoomOption[];
  late_checkout_available: boolean;
  cancellation_policy?: string;
  notes?: string;
}) {
  const c = client();
  await c.from("hotel_proposals").insert({
    advancing_id: advId,
    hotel_name: payload.hotel_name,
    star_rating: payload.star_rating,
    address: payload.address,
    distance_to_venue_km: payload.distance_to_venue_km,
    amenities: payload.amenities,
    room_options: payload.room_options,
    late_checkout_available: payload.late_checkout_available,
    cancellation_policy: payload.cancellation_policy,
    notes: payload.notes,
    proposed_at: new Date().toISOString(),
  });
  await logActivity(advId, "Festival", "festival", "hotel_proposed", "hotel", payload.hotel_name);
}

export async function removeHotelProposal(advId: string, proposalId: string) {
  const c = client();
  await c.from("hotel_proposals").delete().eq("id", proposalId);
}

// ============================================================================
// Festival documents (auto-routed naar Dropbox map)
// ============================================================================

export async function addFestivalDocument(advId: string, payload: {
  category: FestivalDocumentCategory;
  file_name: string;
  storage_path?: string | null;
  uploaded_by_name?: string;
  notes?: string;
}) {
  const c = client();
  const mapping = DOC_CATEGORY_MAP[payload.category];
  await c.from("festival_documents").insert({
    advancing_id: advId,
    category: payload.category,
    dropbox_folder: mapping.folder,
    file_name: payload.file_name,
    storage_path: payload.storage_path ?? null,
    uploaded_by_name: payload.uploaded_by_name,
    uploaded_at: new Date().toISOString(),
    notes: payload.notes,
  });
  if (mapping.section) {
    await syncSectionStatus(advId, mapping.section);
  }
  await logActivity(advId, payload.uploaded_by_name ?? "Festival", "festival", "file_uploaded", mapping.section, payload.file_name);
}

export async function removeFestivalDocument(advId: string, docId: string) {
  const c = client();
  // Haal eerst storage_path op zodat we het bestand uit Storage kunnen verwijderen.
  const { data: doc } = await c.from("festival_documents").select("storage_path").eq("id", docId).maybeSingle();
  await c.from("festival_documents").delete().eq("id", docId);
  if (doc?.storage_path) {
    await c.storage.from("festival-documents").remove([doc.storage_path]);
  }
}

// ============================================================================
// Distances
// ============================================================================

export async function setDistances(advId: string, patch: Record<string, number | undefined>) {
  const c = client();
  const { data: existing } = await c.from("advancing_distances").select("id").eq("advancing_id", advId).maybeSingle();
  const row = { advancing_id: advId, ...patch, updated_at: new Date().toISOString() };
  if (existing?.id) {
    await c.from("advancing_distances").update(row).eq("id", existing.id);
  } else {
    await c.from("advancing_distances").insert(row);
  }
}

// ============================================================================
// Companies + Artists (super-admin)
// ============================================================================

export async function createCompany(payload: { name: string; dropbox_root_folder?: string | null }) {
  const c = client();
  const { data, error } = await c.from("organizations").insert({
    name: payload.name,
    type: "management",
    dropbox_root_folder: payload.dropbox_root_folder ?? null,
    dropbox_connected: false,
  }).select("id, name").single();
  if (error) throw error;
  return data;
}

export async function updateOrganization(id: string, patch: { name?: string; dropbox_root_folder?: string | null }) {
  const c = client();
  const { error } = await c.from("organizations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createBooking(payload: {
  artist_id: string;
  festival_id: string;
  stage_id: string;
  show_type: ShowType;
  show_date: string;
  show_time?: string | null;
  set_duration_minutes?: number | null;
  fee?: number | null;
  guarantee?: string | null;
  contract_status?: string | null;
}) {
  const c = client();
  const { data, error } = await c.from("bookings").insert({
    artist_id: payload.artist_id,
    festival_id: payload.festival_id,
    stage_id: payload.stage_id,
    show_type: payload.show_type,
    show_date: payload.show_date,
    show_time: payload.show_time ?? null,
    set_duration_minutes: payload.set_duration_minutes ?? null,
    fee: payload.fee ?? null,
    guarantee: payload.guarantee ?? null,
    contract_status: payload.contract_status ?? null,
    status: "draft",
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateBooking(id: string, patch: Record<string, unknown>) {
  const c = client();
  const { error } = await c.from("bookings").update({ ...patch, last_activity_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteBooking(id: string) {
  const c = client();
  const { error } = await c.from("bookings").delete().eq("id", id);
  if (error) throw error;
}

export async function createArtist(payload: {
  name: string;
  organization_id: string;
  dropbox_artist_folder?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  manager_phone?: string | null;
}) {
  const c = client();
  const { data, error } = await c.from("artists").insert({
    name: payload.name,
    organization_id: payload.organization_id,
    dropbox_artist_folder: payload.dropbox_artist_folder ?? null,
    manager_name: payload.manager_name ?? null,
    manager_email: payload.manager_email ?? null,
    manager_phone: payload.manager_phone ?? null,
  }).select("id, name").single();
  if (error) throw error;
  return data;
}

export async function updateArtist(id: string, patch: {
  name?: string;
  dropbox_artist_folder?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  manager_phone?: string | null;
}) {
  const c = client();
  const { error } = await c.from("artists").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteArtist(id: string) {
  const c = client();
  const { error } = await c.from("artists").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteOrganization(id: string) {
  const c = client();
  const { error } = await c.from("organizations").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Festival + stages (CRM-side: add new festival with its stages)
// ============================================================================

export async function createFestival(payload: {
  organization_id?: string | null;
  name: string;
  location?: string;
  country?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  stages?: string[];
}) {
  const c = client();
  const { data: festival, error: fErr } = await c.from("festivals").insert({
    organization_id: payload.organization_id ?? null,
    name: payload.name,
    location: payload.location ?? "",
    country: payload.country ?? null,
    start_date: payload.start_date ?? null,
    end_date: payload.end_date ?? null,
  }).select("id, name").single();
  if (fErr) throw fErr;
  const stages = (payload.stages ?? []).filter((s) => s.trim());
  if (stages.length > 0) {
    const rows = stages.map((name) => ({ festival_id: festival.id, name }));
    const { error: sErr } = await c.from("stages").insert(rows);
    if (sErr) throw sErr;
  }
  return festival;
}

// ============================================================================
// Booking contacts (link booking <-> festival CRM contact)
// ============================================================================

export async function addBookingContact(payload: {
  booking_id: string;
  festival_crm_contact_id: string;
  role: string;
  is_primary?: boolean;
}) {
  const c = client();
  const { error } = await c.from("booking_contacts").insert({
    booking_id: payload.booking_id,
    festival_crm_contact_id: payload.festival_crm_contact_id,
    role: payload.role,
    is_primary: payload.is_primary ?? false,
  });
  if (error) throw error;
}

export async function removeBookingContact(id: string) {
  const c = client();
  const { error } = await c.from("booking_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBookingContact(id: string, patch: { role?: string; is_primary?: boolean }) {
  const c = client();
  const { error } = await c.from("booking_contacts").update(patch).eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Payment milestones
// ============================================================================

export async function addPaymentMilestone(payload: {
  booking_id: string;
  label: string;
  amount?: number | null;
  due_date?: string | null;
  status?: string;
  notes?: string | null;
}) {
  const c = client();
  const { data: existing } = await c.from("booking_payment_milestones").select("sort_order").eq("booking_id", payload.booking_id).order("sort_order", { ascending: false }).limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? 0) + 1;
  const { error } = await c.from("booking_payment_milestones").insert({
    booking_id: payload.booking_id,
    label: payload.label,
    amount: payload.amount ?? null,
    due_date: payload.due_date ?? null,
    status: payload.status ?? "pending",
    notes: payload.notes ?? null,
    sort_order,
  });
  if (error) throw error;
}

export async function updatePaymentMilestone(id: string, patch: {
  label?: string;
  amount?: number | null;
  due_date?: string | null;
  status?: string;
  paid_date?: string | null;
  notes?: string | null;
}) {
  const c = client();
  const { error } = await c.from("booking_payment_milestones").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removePaymentMilestone(id: string) {
  const c = client();
  const { error } = await c.from("booking_payment_milestones").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Booking tasks
// ============================================================================

export async function addBookingTask(payload: { booking_id: string; label: string; due_date?: string | null }) {
  const c = client();
  const { data: existing } = await c.from("booking_tasks").select("sort_order").eq("booking_id", payload.booking_id).order("sort_order", { ascending: false }).limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? 0) + 1;
  const { error } = await c.from("booking_tasks").insert({
    booking_id: payload.booking_id,
    label: payload.label,
    due_date: payload.due_date ?? null,
    sort_order,
  });
  if (error) throw error;
}

export async function updateBookingTask(id: string, patch: { label?: string; due_date?: string | null; done?: boolean }) {
  const c = client();
  const row: Record<string, unknown> = { ...patch };
  if (patch.done !== undefined) row.done_at = patch.done ? new Date().toISOString() : null;
  const { error } = await c.from("booking_tasks").update(row).eq("id", id);
  if (error) throw error;
}

export async function removeBookingTask(id: string) {
  const c = client();
  const { error } = await c.from("booking_tasks").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Artist contract template
// ============================================================================

export async function updateArtistContractTemplate(artistId: string, contract_template_md: string | null) {
  const c = client();
  const { error } = await c.from("artists").update({ contract_template_md }).eq("id", artistId);
  if (error) throw error;
}

// ============================================================================
// Booking parking map upload
// ============================================================================

export async function setBookingParkingMap(bookingId: string, parking_map_url: string | null) {
  const c = client();
  const { error } = await c.from("bookings").update({ parking_map_url, last_activity_at: new Date().toISOString() }).eq("id", bookingId);
  if (error) throw error;
}

// ============================================================================
// Booking contract PDF
// ============================================================================

export async function setBookingContractPdf(bookingId: string, url: string | null) {
  const c = client();
  const { error } = await c.from("bookings").update({
    contract_pdf_url: url,
    contract_generated_at: url ? new Date().toISOString() : null,
    last_activity_at: new Date().toISOString(),
  }).eq("id", bookingId);
  if (error) throw error;
}

// ============================================================================
// Email templates (per agency)
// ============================================================================

export async function addEmailTemplate(payload: { organization_id: string; type: string; name: string; subject?: string | null; body_md?: string | null }) {
  const c = client();
  const { data, error } = await c.from("agency_email_templates").insert({
    organization_id: payload.organization_id,
    type: payload.type,
    name: payload.name,
    subject: payload.subject ?? null,
    body_md: payload.body_md ?? null,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateEmailTemplate(id: string, patch: { type?: string; name?: string; subject?: string | null; body_md?: string | null }) {
  const c = client();
  const { error } = await c.from("agency_email_templates").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeEmailTemplate(id: string) {
  const c = client();
  const { error } = await c.from("agency_email_templates").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Inquiries (pre-draft funnel)
// ============================================================================

export async function addInquiry(payload: {
  organization_id: string;
  artist_id: string;
  festival_id?: string | null;
  show_date?: string | null;
  budget_offered?: number | null;
  source?: string | null;
  status?: string;
  notes?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}) {
  const c = client();
  const { data, error } = await c.from("inquiries").insert({
    organization_id: payload.organization_id,
    artist_id: payload.artist_id,
    festival_id: payload.festival_id ?? null,
    show_date: payload.show_date ?? null,
    budget_offered: payload.budget_offered ?? null,
    source: payload.source ?? null,
    status: payload.status ?? "new",
    notes: payload.notes ?? null,
    contact_name: payload.contact_name ?? null,
    contact_email: payload.contact_email ?? null,
    contact_phone: payload.contact_phone ?? null,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateInquiry(id: string, patch: Record<string, unknown>) {
  const c = client();
  const { error } = await c.from("inquiries").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function removeInquiry(id: string) {
  const c = client();
  const { error } = await c.from("inquiries").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Festival CRM contacts (agency-side contactenboek voor festival promoters)
// ============================================================================

export async function addFestivalCrmContact(payload: {
  festival_id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
  notes?: string | null;
}) {
  const c = client();
  const { data, error } = await c.from("festival_crm_contacts").insert({
    festival_id: payload.festival_id,
    name: payload.name,
    role: payload.role ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    is_primary: payload.is_primary ?? false,
    notes: payload.notes ?? null,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateFestivalCrmContact(id: string, patch: {
  name?: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
  notes?: string | null;
}) {
  const c = client();
  const { error } = await c.from("festival_crm_contacts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeFestivalCrmContact(id: string) {
  const c = client();
  const { error } = await c.from("festival_crm_contacts").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Artist tech requirements (PLEASE CONFIRM template)
// ============================================================================

export async function addTechRequirement(payload: {
  artist_id: string;
  show_type: ShowType;
  category: TechCategory;
  item_description: string;
  is_mandatory: boolean;
  notes?: string;
}) {
  const c = client();
  // Bepaal sort_order: hoogste bestaande + 1
  const { data: existing } = await c.from("artist_tech_requirements").select("sort_order").eq("artist_id", payload.artist_id).eq("show_type", payload.show_type).eq("category", payload.category).order("sort_order", { ascending: false }).limit(1);
  const sort_order = (existing?.[0]?.sort_order ?? 0) + 1;
  const { error } = await c.from("artist_tech_requirements").insert({ ...payload, sort_order });
  if (error) throw error;
}

export async function updateTechRequirement(id: string, patch: { item_description?: string; is_mandatory?: boolean; notes?: string; category?: TechCategory }) {
  const c = client();
  const { error } = await c.from("artist_tech_requirements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeTechRequirement(id: string) {
  const c = client();
  const { error } = await c.from("artist_tech_requirements").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================================
// Trigger 1 - Booking confirmed pipeline
// ============================================================================

const SECTION_TYPES_LIST: SectionType[] = [
  "dj_gear","monitors","audio","light","video","lasers","sfx_pyro","stage","ethernet","communication","power","backline",
  "logistics","travel","hotel","hospitality","contacts","visa",
];

/**
 * Idempotente sync van artist tech-requirement templates naar advancing_tech_items.
 * Slaat items over die al in de advancing staan (op item_description match).
 * Gebruikt voor advancings die zijn aangemaakt vóór er templates waren.
 */
export async function syncAdvancingTechFromArtistTemplate(advancingId: string): Promise<{ inserted: number }> {
  const c = client();

  const { data: adv } = await c.from("advancings").select("id, booking_id").eq("id", advancingId).maybeSingle();
  if (!adv) return { inserted: 0 };
  const { data: booking } = await c.from("bookings").select("artist_id, show_type").eq("id", adv.booking_id).maybeSingle();
  if (!booking) return { inserted: 0 };

  const { data: tmpl } = await c.from("artist_tech_requirements")
    .select("category, item_description, is_mandatory, notes, sort_order")
    .eq("artist_id", booking.artist_id)
    .eq("show_type", booking.show_type)
    .order("sort_order", { ascending: true });
  if (!tmpl || tmpl.length === 0) return { inserted: 0 };

  const { data: existing } = await c.from("advancing_tech_items")
    .select("category, item_description")
    .eq("advancing_id", advancingId);
  const existingKeys = new Set((existing ?? []).map((e: any) => `${e.category}::${e.item_description}`));

  const newRows = tmpl
    .filter((t: any) => !existingKeys.has(`${t.category}::${t.item_description}`))
    .map((t: any) => ({
      advancing_id: advancingId,
      category: t.category,
      item_description: t.item_description,
      is_mandatory: t.is_mandatory,
      artist_notes: t.notes,
      status: "requested",
      sort_order: t.sort_order,
    }));

  // Resync alle tech-categorieen, ook als 0 inserts — handelt het geval
  // waarin items wel bestaan maar advancing_sections.completion_percent is
  // stale (oude scoring of nooit bijgewerkt na een eerdere wijziging).
  const TECH_CATEGORIES: SectionType[] = [
    "dj_gear","monitors","audio","light","video","lasers",
    "sfx_pyro","stage","ethernet","communication","power","backline",
  ];

  if (newRows.length > 0) {
    const { error } = await c.from("advancing_tech_items").insert(newRows);
    if (error) throw error;
  }

  await Promise.all(TECH_CATEGORIES.map((cat) => syncSectionStatus(advancingId, cat)));

  return { inserted: newRows.length };
}

export async function confirmBooking(bookingId: string): Promise<{ advancingId: string } | null> {
  const c = client();

  // 1) Bevestig booking
  const { data: booking, error: bErr } = await c.from("bookings")
    .update({ status: "advancing", confirmed_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select("id, artist_id, show_type, show_date")
    .single();
  if (bErr || !booking) throw bErr ?? new Error("booking not found");

  // 2) Bestaat advancing al?
  const { data: existing } = await c.from("advancings").select("id").eq("booking_id", bookingId).maybeSingle();
  if (existing?.id) return { advancingId: existing.id };

  // 3) Genereer crypto-strong portal token + maak advancing
  const { randomBytes } = await import("node:crypto");
  const portal_token = `tk_${randomBytes(24).toString("base64url")}`;
  // Default expiry: 1 jaar (lang genoeg voor advancings die tot show-dag actief blijven)
  const portal_token_expires_at = new Date(Date.now() + 365 * 86400000).toISOString();
  const { data: adv, error: aErr } = await c.from("advancings").insert({
    booking_id: bookingId,
    status: "pending",
    portal_token,
    portal_token_expires_at,
  }).select("id").single();
  if (aErr || !adv) throw aErr ?? new Error("advancing insert failed");

  // 4) 18 sections (empty)
  const sectionRows = SECTION_TYPES_LIST.map((t) => ({
    advancing_id: adv.id,
    section_type: t,
    status: "empty",
    completion_percent: 0,
  }));
  await c.from("advancing_sections").insert(sectionRows);

  // 5) Clone artist tech requirements → advancing_tech_items (status='requested')
  const { data: reqs } = await c.from("artist_tech_requirements")
    .select("category, item_description, is_mandatory, notes, sort_order")
    .eq("artist_id", booking.artist_id)
    .eq("show_type", booking.show_type)
    .order("sort_order", { ascending: true });
  if (reqs && reqs.length > 0) {
    const techRows = reqs.map((r: any) => ({
      advancing_id: adv.id,
      category: r.category,
      item_description: r.item_description,
      is_mandatory: r.is_mandatory,
      artist_notes: r.notes,
      status: "requested",
      sort_order: r.sort_order,
    }));
    await c.from("advancing_tech_items").insert(techRows);
  }

  // 6) Signed riders skeleton (technical + hospitality)
  await c.from("signed_riders").insert([
    { advancing_id: adv.id, rider_type: "technical", status: "pending" },
    { advancing_id: adv.id, rider_type: "hospitality", status: "pending" },
  ]);

  // 7) Booking crew from artist crew defaults
  const { data: defaults } = await c.from("artist_crew").select("id, role, name").eq("artist_id", booking.artist_id).eq("is_default", true);
  if (defaults && defaults.length > 0) {
    const crewRows = defaults.map((cr: any) => ({
      booking_id: bookingId,
      artist_crew_id: cr.id,
      role: cr.role,
      name: cr.name,
      is_traveling: true,
      needs_flight: true,
      flight_status: "pending",
    }));
    await c.from("booking_crew").insert(crewRows);
  }

  // 8) Artist defaults toepassen op de nieuwe advancing-secties
  const { data: artistRow } = await c.from("artists")
    .select("defaults_hospitality, defaults_hotel, defaults_travel, defaults_logistics")
    .eq("id", booking.artist_id)
    .maybeSingle();

  if (artistRow?.defaults_hospitality) {
    await c.from("advancing_hospitality").insert({ advancing_id: adv.id, ...artistRow.defaults_hospitality });
  }
  if (artistRow?.defaults_hotel) {
    await c.from("advancing_hotel").insert({ advancing_id: adv.id, ...artistRow.defaults_hotel });
  }
  if (artistRow?.defaults_travel) {
    await c.from("advancing_travel").insert({ advancing_id: adv.id, ...artistRow.defaults_travel });
  }
  if (artistRow?.defaults_logistics) {
    await c.from("advancing_logistics").insert({ advancing_id: adv.id, ...artistRow.defaults_logistics });
  }

  // Sync sectie-status na seed van defaults
  await Promise.all([
    syncSectionStatus(adv.id, "hospitality"),
    syncSectionStatus(adv.id, "hotel"),
    syncSectionStatus(adv.id, "travel"),
    syncSectionStatus(adv.id, "logistics"),
  ]);

  await logActivity(adv.id, "System", "system", "status_changed", undefined, "Advancing gestart - defaults toegepast");

  return { advancingId: adv.id };
}

// ============================================================================
// Activity log helper
// ============================================================================

async function logActivity(
  advId: string,
  userName: string,
  userType: "management" | "festival" | "system",
  action: string,
  sectionType?: SectionType,
  details?: string,
) {
  const c = client();
  await c.from("advancing_activity").insert({
    advancing_id: advId,
    user_name: userName,
    user_type: userType,
    action,
    section_type: sectionType,
    details,
  });
}
