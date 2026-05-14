import { cache } from "react";
import { supabaseService } from "./supabase-service";
import { SECTION_TYPES } from "./data";
import type {
  ActivityEntry,
  Advancing,
  AdvancingDetail,
  AdvancingSection,
  AdvancingTechItem,
  AdvancingVisa,
  AdvancingVisaCrew,
  Artist,
  ArtistCrew,
  ArtistRiderTemplate,
  ArtistTechRequirement,
  Booking,
  BookingCrew,
  ContactPerson,
  Distances,
  AgencyEmailTemplate,
  BookingContact,
  BookingEmail,
  BookingOffer,
  BookingPaymentMilestone,
  BookingTask,
  Festival,
  FestivalCRMContact,
  FestivalDocument,
  Inquiry,
  FlightInfo,
  HotelInfo,
  HotelProposal,
  Organization,
  SectionType,
  SignedRider,
  Stage,
  TimelineEvent,
  GroundTransfer,
} from "./types";

export interface Snapshot {
  organizations: Organization[];
  artists: Artist[];
  artistCrew: ArtistCrew[];
  artistRiderTemplates: ArtistRiderTemplate[];
  artistTechRequirements: ArtistTechRequirement[];
  festivals: Festival[];
  stages: Stage[];
  festivalCrmContacts: FestivalCRMContact[];
  bookingContacts: BookingContact[];
  bookingPaymentMilestones: BookingPaymentMilestone[];
  bookingTasks: BookingTask[];
  agencyEmailTemplates: AgencyEmailTemplate[];
  inquiries: Inquiry[];
  bookingEmails: BookingEmail[];
  bookingOffers: BookingOffer[];
  bookings: Booking[];
  bookingCrew: BookingCrew[];
  advancings: Advancing[];
  sections: AdvancingSection[];
  techItems: AdvancingTechItem[];
  signedRiders: SignedRider[];
  activity: ActivityEntry[];
  hotelByAdvancing: Record<string, HotelInfo>;
  travelByAdvancing: Record<string, { notes?: string }>;
  logisticsByAdvancing: Record<
    string,
    {
      load_in_time?: string;
      soundcheck_time?: string;
      show_time?: string;
      load_out_time?: string;
      doors_time?: string;
      curfew_time?: string;
      programming_time?: string;
      crew_traveling?: number;
      parking_spots_needed?: number;
      notes?: string;
    }
  >;
  hospitalityByAdvancing: Record<
    string,
    {
      party_size?: number;
      hot_meal_required: boolean;
      dressing_room_count?: number;
      specific_requests?: string;
    }
  >;
  visaByAdvancing: Record<string, AdvancingVisa>;
  visaCrewByAdvancing: Record<string, AdvancingVisaCrew[]>;
  distancesByAdvancing: Record<string, Distances>;
  contactsArtistByAdvancing: Record<string, ContactPerson[]>;
  contactsFestivalByAdvancing: Record<string, ContactPerson[]>;
  flightsByAdvancing: Record<string, FlightInfo[]>;
  hotelProposalsByAdvancing: Record<string, HotelProposal[]>;
  festivalDocumentsByAdvancing: Record<string, FestivalDocument[]>;
  timelineByAdvancing: Record<string, TimelineEvent[]>;
  groundTransfersByAdvancing: Record<string, GroundTransfer[]>;
}

const trimTime = (t: string | null | undefined): string | undefined => {
  if (!t) return undefined;
  // Postgres returns "22:30:00" - keep "22:30" for display
  return t.length >= 5 ? t.slice(0, 5) : t;
};

const groupBy = <T, K extends string>(rows: T[], key: (r: T) => K | null | undefined): Record<K, T[]> => {
  const out: Record<string, T[]> = {};
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    (out[k] ??= []).push(r);
  }
  return out as Record<K, T[]>;
};

export const loadSnapshot = cache(async (): Promise<Snapshot> => {
  const client = supabaseService();

  const [
    orgsR, artistsR, artistCrewR, artistRiderTemplatesR, artistTechRequirementsR,
    festivalsR, stagesR, bookingsR, bookingCrewR,
    advancingsR, sectionsR, techItemsR, signedRidersR, activityR,
    hotelR, travelR, logisticsR, hospitalityR, visaR, visaCrewR, distancesR,
    contactsArtistR, contactsFestivalR, flightsR, hotelProposalsR, festivalDocumentsR, timelineR, groundR,
    festivalCrmContactsR,
    bookingContactsR, paymentMilestonesR, bookingTasksR,
    emailTemplatesR, inquiriesR,
    bookingEmailsR, bookingOffersR,
  ] = await Promise.all([
    client.from("organizations").select("*"),
    client.from("artists").select("*"),
    client.from("artist_crew").select("*"),
    client.from("artist_rider_templates").select("*"),
    client.from("artist_tech_requirements").select("*").order("sort_order", { ascending: true }),
    client.from("festivals").select("*"),
    client.from("stages").select("*"),
    client.from("bookings").select("*"),
    client.from("booking_crew").select("*"),
    client.from("advancings").select("*"),
    client.from("advancing_sections").select("*"),
    client.from("advancing_tech_items").select("*").order("sort_order", { ascending: true }),
    client.from("signed_riders").select("*"),
    client.from("advancing_activity").select("*").order("created_at", { ascending: false }),
    client.from("advancing_hotel").select("*"),
    client.from("advancing_travel").select("*"),
    client.from("advancing_logistics").select("*"),
    client.from("advancing_hospitality").select("*"),
    client.from("advancing_visa").select("*"),
    client.from("advancing_visa_crew").select("*"),
    client.from("advancing_distances").select("*"),
    client.from("advancing_contacts_artist").select("*").order("sort_order", { ascending: true }),
    client.from("advancing_contacts_festival").select("*").order("sort_order", { ascending: true }),
    client.from("advancing_flights").select("*").order("departure_datetime", { ascending: true }),
    client.from("hotel_proposals").select("*"),
    client.from("festival_documents").select("*"),
    client.from("advancing_timeline").select("*").order("datetime", { ascending: true }),
    client.from("advancing_ground_transfers").select("*").order("pickup_datetime", { ascending: true }),
    client.from("festival_crm_contacts").select("*").order("is_primary", { ascending: false }),
    client.from("booking_contacts").select("*"),
    client.from("booking_payment_milestones").select("*").order("sort_order", { ascending: true }),
    client.from("booking_tasks").select("*").order("sort_order", { ascending: true }),
    client.from("agency_email_templates").select("*"),
    client.from("inquiries").select("*").order("created_at", { ascending: false }),
    client.from("booking_emails").select("*").order("sent_at", { ascending: false }),
    client.from("booking_offers").select("*").order("created_at", { ascending: false }),
  ]);

  const checked = [
    orgsR, artistsR, artistCrewR, artistRiderTemplatesR, artistTechRequirementsR,
    festivalsR, stagesR, bookingsR, bookingCrewR,
    advancingsR, sectionsR, techItemsR, signedRidersR, activityR,
    hotelR, travelR, logisticsR, hospitalityR, visaR, visaCrewR, distancesR,
    contactsArtistR, contactsFestivalR, flightsR, hotelProposalsR, festivalDocumentsR, timelineR, groundR,
    festivalCrmContactsR,
    bookingContactsR, paymentMilestonesR, bookingTasksR,
    emailTemplatesR, inquiriesR,
    bookingEmailsR, bookingOffersR,
  ];
  for (const r of checked) {
    if (r.error) throw new Error(`Supabase snapshot error: ${r.error.message}`);
  }

  const organizations: Organization[] = (orgsR.data ?? []).map((o: any) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    dropbox_root_folder: o.dropbox_root_folder,
    dropbox_connected: o.dropbox_connected ?? false,
  }));

  const artists: Artist[] = (artistsR.data ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    organization_id: a.organization_id,
    dropbox_artist_folder: a.dropbox_artist_folder,
    dropbox_connected: !!a.dropbox_refresh_token,
    dropbox_account_email: a.dropbox_account_email ?? null,
    image: a.image_url ?? undefined,
    defaults_hospitality: a.defaults_hospitality ?? undefined,
    defaults_hotel: a.defaults_hotel ?? undefined,
    defaults_travel: a.defaults_travel ?? undefined,
    defaults_logistics: a.defaults_logistics ?? undefined,
    manager_name: a.manager_name ?? undefined,
    manager_email: a.manager_email ?? undefined,
    manager_phone: a.manager_phone ?? undefined,
    contract_template_md: a.contract_template_md ?? undefined,
  }));

  const artistCrew: ArtistCrew[] = (artistCrewR.data ?? []).map((c: any) => ({
    id: c.id,
    artist_id: c.artist_id,
    role: c.role,
    name: c.name,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    is_default: c.is_default ?? false,
  }));

  const artistRiderTemplates: ArtistRiderTemplate[] = (artistRiderTemplatesR.data ?? []).map((t: any) => ({
    id: t.id,
    artist_id: t.artist_id,
    show_type: t.show_type ?? null,
    rider_type: t.rider_type,
    file_name: t.file_name,
    storage_path: t.storage_path ?? null,
    is_active: t.is_active ?? true,
    version: t.version ?? 1,
  }));

  const artistTechRequirements: ArtistTechRequirement[] = (artistTechRequirementsR.data ?? []).map((r: any) => ({
    id: r.id,
    artist_id: r.artist_id,
    show_type: r.show_type,
    category: r.category,
    item_description: r.item_description,
    is_mandatory: r.is_mandatory ?? false,
    notes: r.notes ?? undefined,
    sort_order: r.sort_order ?? 0,
  }));

  const festivals: Festival[] = (festivalsR.data ?? []).map((f: any) => ({
    id: f.id,
    name: f.name,
    organization_id: f.organization_id,
    location: f.location ?? "",
    country: f.country ?? undefined,
    start_date: f.start_date,
    end_date: f.end_date,
  }));

  const stages: Stage[] = (stagesR.data ?? []).map((s: any) => ({
    id: s.id,
    festival_id: s.festival_id,
    name: s.name,
  }));

  const festivalCrmContacts: FestivalCRMContact[] = (festivalCrmContactsR.data ?? []).map((c: any) => ({
    id: c.id,
    festival_id: c.festival_id,
    name: c.name,
    role: c.role ?? undefined,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    is_primary: c.is_primary ?? false,
    notes: c.notes ?? undefined,
  }));

  const bookings: Booking[] = (bookingsR.data ?? []).map((b: any) => ({
    id: b.id,
    artist_id: b.artist_id,
    festival_id: b.festival_id,
    stage_id: b.stage_id,
    show_type: b.show_type,
    status: b.status,
    show_date: b.show_date,
    show_time: trimTime(b.show_time) ?? "",
    set_duration_minutes: b.set_duration_minutes ?? 0,
    programming_slot: b.programming_slot ?? undefined,
    soundcheck_slot: b.soundcheck_slot ?? undefined,
    doors_time: trimTime(b.doors_time),
    curfew_time: trimTime(b.curfew_time),
    fee: b.fee != null ? Number(b.fee) : undefined,
    guarantee: b.guarantee ?? undefined,
    contributions: b.contributions ?? undefined,
    contract_status: b.contract_status ?? undefined,
    is_looped: b.is_looped ?? undefined,
    confirmed_at: b.confirmed_at ?? undefined,
    venue_address: b.venue_address ?? undefined,
    venue_postcode: b.venue_postcode ?? undefined,
    venue_city: b.venue_city ?? undefined,
    venue_country: b.venue_country ?? undefined,
    parking_info: b.parking_info ?? undefined,
    parking_map_url: b.parking_map_url ?? undefined,
    selected_riders: Array.isArray(b.selected_riders) ? b.selected_riders : [],
    billing_position: b.billing_position ?? undefined,
    slot_position: b.slot_position ?? undefined,
    b2b_partner: b.b2b_partner ?? undefined,
    last_activity_at: b.last_activity_at ?? undefined,
    commission_pct: b.commission_pct != null ? Number(b.commission_pct) : undefined,
    vat_pct: b.vat_pct != null ? Number(b.vat_pct) : undefined,
    withholding_tax_pct: b.withholding_tax_pct != null ? Number(b.withholding_tax_pct) : undefined,
    travel_buyout: b.travel_buyout != null ? Number(b.travel_buyout) : undefined,
    hotel_buyout: b.hotel_buyout != null ? Number(b.hotel_buyout) : undefined,
    hold_position: b.hold_position ?? undefined,
    hold_status: b.hold_status ?? undefined,
    hold_expires_at: b.hold_expires_at ?? undefined,
    radius_km: b.radius_km ?? undefined,
    radius_days_before: b.radius_days_before ?? undefined,
    radius_days_after: b.radius_days_after ?? undefined,
    exclusivity_type: b.exclusivity_type ?? undefined,
    contract_pdf_url: b.contract_pdf_url ?? undefined,
    contract_generated_at: b.contract_generated_at ?? undefined,
  }));

  const bookingContacts: BookingContact[] = (bookingContactsR.data ?? []).map((c: any) => ({
    id: c.id,
    booking_id: c.booking_id,
    festival_crm_contact_id: c.festival_crm_contact_id,
    role: c.role,
    is_primary: c.is_primary ?? false,
  }));

  const bookingPaymentMilestones: BookingPaymentMilestone[] = (paymentMilestonesR.data ?? []).map((m: any) => ({
    id: m.id,
    booking_id: m.booking_id,
    label: m.label,
    amount: m.amount != null ? Number(m.amount) : undefined,
    due_date: m.due_date ?? undefined,
    status: m.status,
    paid_date: m.paid_date ?? undefined,
    notes: m.notes ?? undefined,
    sort_order: m.sort_order ?? 0,
  }));

  const bookingTasks: BookingTask[] = (bookingTasksR.data ?? []).map((t: any) => ({
    id: t.id,
    booking_id: t.booking_id,
    label: t.label,
    due_date: t.due_date ?? undefined,
    done: t.done ?? false,
    done_at: t.done_at ?? undefined,
    sort_order: t.sort_order ?? 0,
  }));

  const agencyEmailTemplates: AgencyEmailTemplate[] = (emailTemplatesR.data ?? []).map((t: any) => ({
    id: t.id,
    organization_id: t.organization_id,
    type: t.type,
    name: t.name,
    subject: t.subject ?? undefined,
    body_md: t.body_md ?? undefined,
  }));

  const inquiries: Inquiry[] = (inquiriesR.data ?? []).map((i: any) => ({
    id: i.id,
    organization_id: i.organization_id,
    artist_id: i.artist_id,
    festival_id: i.festival_id ?? undefined,
    show_date: i.show_date ?? undefined,
    budget_offered: i.budget_offered != null ? Number(i.budget_offered) : undefined,
    source: i.source ?? undefined,
    status: i.status,
    decline_reason: i.decline_reason ?? undefined,
    notes: i.notes ?? undefined,
    contact_name: i.contact_name ?? undefined,
    contact_email: i.contact_email ?? undefined,
    contact_phone: i.contact_phone ?? undefined,
    converted_booking_id: i.converted_booking_id ?? undefined,
    created_at: i.created_at,
    updated_at: i.updated_at ?? undefined,
  }));

  const bookingEmails: BookingEmail[] = (bookingEmailsR.data ?? []).map((e: any) => ({
    id: e.id,
    booking_id: e.booking_id,
    template_type: e.template_type ?? undefined,
    template_id: e.template_id ?? undefined,
    to_contact_id: e.to_contact_id ?? undefined,
    to_email: e.to_email ?? undefined,
    subject: e.subject ?? undefined,
    body_snapshot: e.body_snapshot ?? undefined,
    sent_at: e.sent_at,
  }));

  const bookingOffers: BookingOffer[] = (bookingOffersR.data ?? []).map((o: any) => ({
    id: o.id,
    booking_id: o.booking_id,
    amount: o.amount != null ? Number(o.amount) : undefined,
    direction: o.direction,
    note: o.note ?? undefined,
    created_at: o.created_at,
  }));

  const bookingCrew: BookingCrew[] = (bookingCrewR.data ?? []).map((c: any) => ({
    id: c.id,
    booking_id: c.booking_id,
    artist_crew_id: c.artist_crew_id ?? undefined,
    role: c.role,
    name: c.name,
    is_traveling: c.is_traveling ?? false,
    needs_flight: c.needs_flight ?? false,
    flight_status: c.flight_status ?? "n/a",
    notes: c.notes ?? undefined,
  }));

  const advancings: Advancing[] = (advancingsR.data ?? []).map((a: any) => ({
    id: a.id,
    booking_id: a.booking_id,
    status: a.status,
    portal_token: a.portal_token,
    portal_expires_at: a.portal_expires_at ?? undefined,
    dropbox_show_folder: a.dropbox_show_folder ?? undefined,
    completed_at: a.completed_at ?? undefined,
    locked_at: a.locked_at ?? undefined,
    created_at: a.created_at ?? new Date().toISOString(),
    // Defensief: kolom kan ontbreken als migratie 030 nog niet gedraaid is.
    festival_portal_hidden: Array.isArray(a.festival_portal_hidden) ? a.festival_portal_hidden : [],
  }));

  const sectionsData: AdvancingSection[] = (sectionsR.data ?? []).map((s: any) => ({
    id: s.id,
    advancing_id: s.advancing_id,
    section_type: s.section_type,
    status: s.status,
    completion_percent: s.completion_percent ?? 0,
    last_updated_at: s.last_updated_at ?? undefined,
    last_updated_by: s.last_updated_by ?? undefined,
  }));

  const techItems: AdvancingTechItem[] = (techItemsR.data ?? []).map((t: any) => ({
    id: t.id,
    advancing_id: t.advancing_id,
    category: t.category,
    item_description: t.item_description,
    is_mandatory: t.is_mandatory ?? false,
    artist_notes: t.artist_notes ?? undefined,
    status: t.status,
    festival_response: t.festival_response ?? undefined,
    alternative_description: t.alternative_description ?? undefined,
    management_response: t.management_response ?? undefined,
    confirmed_at: t.confirmed_at ?? undefined,
    sort_order: t.sort_order ?? 0,
  }));

  const publicUrl = (bucket: string, path: string | null | undefined): string | null => {
    if (!path) return null;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl ?? null;
  };

  const signedRiders: SignedRider[] = (signedRidersR.data ?? []).map((r: any) => ({
    id: r.id,
    advancing_id: r.advancing_id,
    rider_type: r.rider_type,
    status: r.status,
    sent_at: r.sent_at ?? undefined,
    signed_at: r.signed_at ?? undefined,
    signed_by_name: r.signed_by_name ?? undefined,
    signed_by_role: r.signed_by_role ?? undefined,
    signed_method: r.signed_method ?? undefined,
    accepted_at: r.accepted_at ?? undefined,
    dispute_notes: r.dispute_notes ?? undefined,
    festival_notes: r.festival_notes ?? undefined,
    version: r.version ?? undefined,
    signed_url: publicUrl("riders", r.signed_storage_path),
    original_url: publicUrl("riders", r.original_storage_path),
    signed_rider_file_name: r.signed_rider_file_name ?? undefined,
    original_rider_file_name: r.original_rider_file_name ?? undefined,
  }));

  const activity: ActivityEntry[] = (activityR.data ?? []).map((a: any) => ({
    id: a.id,
    advancing_id: a.advancing_id,
    user_name: a.user_name ?? "Onbekend",
    user_type: a.user_type ?? undefined,
    action: a.action,
    section_type: a.section_type ?? undefined,
    details: a.details ?? undefined,
    created_at: a.created_at ?? new Date().toISOString(),
  }));

  const hotelByAdvancing: Record<string, HotelInfo> = {};
  for (const h of (hotelR.data ?? []) as any[]) {
    hotelByAdvancing[h.advancing_id] = {
      hotel_required: h.hotel_required ?? false,
      hotel_star_rating: h.hotel_star_rating ?? undefined,
      hotel_preference: h.hotel_preference ?? undefined,
      hotel_room_count: h.hotel_room_count ?? undefined,
      hotel_room_type: h.hotel_room_type ?? undefined,
      hotel_nights: h.hotel_nights ?? undefined,
      hotel_nights_description: h.hotel_nights_description ?? undefined,
      hotel_check_in: h.hotel_check_in ?? undefined,
      hotel_check_out: h.hotel_check_out ?? undefined,
      hotel_late_checkout: h.hotel_late_checkout ?? undefined,
      hotel_confirmed_name: h.hotel_confirmed_name ?? undefined,
      room_assignments: Array.isArray(h.room_assignments) ? h.room_assignments : undefined,
    };
  }

  const travelByAdvancing: Record<string, { notes?: string }> = {};
  for (const t of (travelR.data ?? []) as any[]) {
    travelByAdvancing[t.advancing_id] = { notes: t.notes ?? undefined };
  }

  const logisticsByAdvancing: Snapshot["logisticsByAdvancing"] = {};
  for (const l of (logisticsR.data ?? []) as any[]) {
    logisticsByAdvancing[l.advancing_id] = {
      load_in_time: trimTime(l.load_in_time),
      soundcheck_time: trimTime(l.soundcheck_time),
      show_time: trimTime(l.show_time),
      load_out_time: trimTime(l.load_out_time),
      doors_time: trimTime(l.doors_time),
      curfew_time: trimTime(l.curfew_time),
      programming_time: trimTime(l.programming_time),
      crew_traveling: l.crew_traveling ?? undefined,
      parking_spots_needed: l.parking_spots_needed ?? undefined,
      notes: l.notes ?? undefined,
    };
  }

  const hospitalityByAdvancing: Snapshot["hospitalityByAdvancing"] = {};
  for (const h of (hospitalityR.data ?? []) as any[]) {
    hospitalityByAdvancing[h.advancing_id] = {
      party_size: h.party_size ?? undefined,
      hot_meal_required: h.hot_meal_required ?? false,
      dressing_room_count: h.dressing_room_count ?? undefined,
      specific_requests: h.specific_requests ?? undefined,
    };
  }

  const visaByAdvancing: Record<string, AdvancingVisa> = {};
  for (const v of (visaR.data ?? []) as any[]) {
    visaByAdvancing[v.advancing_id] = {
      advancing_id: v.advancing_id,
      visa_required: v.visa_required ?? false,
      visa_type: v.visa_type ?? undefined,
      work_permit_required: v.work_permit_required ?? false,
      deadline: v.deadline ?? undefined,
      notes: v.notes ?? undefined,
    };
  }

  const visaCrewByAdvancing = groupBy(
    (visaCrewR.data ?? []).map((vc: any) => ({
      id: vc.id,
      advancing_id: vc.advancing_id,
      booking_crew_id: vc.booking_crew_id ?? undefined,
      name: vc.name,
      status: vc.status ?? "pending",
      notes: vc.notes ?? undefined,
    })) as AdvancingVisaCrew[],
    (vc) => vc.advancing_id,
  );

  const distancesByAdvancing: Record<string, Distances> = {};
  for (const d of (distancesR.data ?? []) as any[]) {
    distancesByAdvancing[d.advancing_id] = {
      airport_hotel_km: d.airport_hotel_km != null ? Number(d.airport_hotel_km) : undefined,
      airport_hotel_minutes: d.airport_hotel_minutes ?? undefined,
      hotel_venue_km: d.hotel_venue_km != null ? Number(d.hotel_venue_km) : undefined,
      hotel_venue_minutes: d.hotel_venue_minutes ?? undefined,
      venue_airport_km: d.venue_airport_km != null ? Number(d.venue_airport_km) : undefined,
      venue_airport_minutes: d.venue_airport_minutes ?? undefined,
    };
  }

  const contactsArtistByAdvancing = groupBy(
    (contactsArtistR.data ?? []).map((c: any): ContactPerson & { advancing_id: string } => ({
      id: c.id,
      role: c.role,
      name: c.name,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      is_onsite: c.is_onsite ?? undefined,
      advancing_id: c.advancing_id,
    })),
    (c) => c.advancing_id,
  );

  const contactsFestivalByAdvancing = groupBy(
    (contactsFestivalR.data ?? []).map((c: any): ContactPerson & { advancing_id: string } => ({
      id: c.id,
      role: c.role,
      name: c.name,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      advancing_id: c.advancing_id,
    })),
    (c) => c.advancing_id,
  );

  const flightsByAdvancing = groupBy(
    (flightsR.data ?? []).map((f: any): FlightInfo & { advancing_id: string } => ({
      id: f.id,
      direction: f.direction,
      flight_number: f.flight_number ?? "",
      airline: f.airline ?? "",
      departure_airport: f.departure_airport ?? "",
      arrival_airport: f.arrival_airport ?? "",
      departure_datetime: f.departure_datetime,
      arrival_datetime: f.arrival_datetime,
      passengers: Array.isArray(f.passengers) ? (f.passengers as string[]) : [],
      status: f.status ?? undefined,
      booking_reference: f.booking_reference ?? undefined,
      notes: f.notes ?? undefined,
      cost_amount: f.cost_amount != null ? Number(f.cost_amount) : undefined,
      paid_by: f.paid_by ?? undefined,
      recharge_to_buyer: f.recharge_to_buyer ?? undefined,
      advancing_id: f.advancing_id,
    })),
    (f) => f.advancing_id,
  );

  const hotelProposalsByAdvancing = groupBy(
    (hotelProposalsR.data ?? []).map((h: any): HotelProposal & { adv: string } => ({
      id: h.id,
      advancing_id: h.advancing_id,
      hotel_name: h.hotel_name,
      star_rating: h.star_rating ?? undefined,
      address: h.address ?? undefined,
      distance_to_venue_km: h.distance_to_venue_km != null ? Number(h.distance_to_venue_km) : undefined,
      amenities: Array.isArray(h.amenities) ? h.amenities : [],
      room_options: Array.isArray(h.room_options) ? h.room_options : [],
      late_checkout_available: h.late_checkout_available ?? false,
      cancellation_policy: h.cancellation_policy ?? undefined,
      notes: h.notes ?? undefined,
      proposed_at: h.proposed_at ?? new Date().toISOString(),
      adv: h.advancing_id,
    })),
    (h) => h.adv,
  );

  const festivalDocumentsByAdvancing = groupBy(
    (festivalDocumentsR.data ?? []).map((d: any): FestivalDocument & { adv: string } => ({
      id: d.id,
      advancing_id: d.advancing_id,
      category: d.category,
      dropbox_folder: d.dropbox_folder,
      file_name: d.file_name,
      storage_path: d.storage_path ?? undefined,
      uploaded_by_name: d.uploaded_by_name ?? undefined,
      uploaded_at: d.uploaded_at ?? new Date().toISOString(),
      notes: d.notes ?? undefined,
      url: publicUrl("festival-documents", d.storage_path),
      synced_to_dropbox: d.synced_to_dropbox ?? false,
      dropbox_path: d.dropbox_path ?? null,
      dropbox_file_id: d.dropbox_file_id ?? null,
      dropbox_synced_at: d.dropbox_synced_at ?? null,
      dropbox_error: d.dropbox_error ?? null,
      adv: d.advancing_id,
    })),
    (d) => d.adv,
  );

  const groundTransfersByAdvancing = groupBy(
    (groundR.data ?? []).map((g: any): GroundTransfer & { adv: string } => ({
      id: g.id,
      advancing_id: g.advancing_id,
      transfer_type: g.transfer_type,
      linked_flight_id: g.linked_flight_id ?? undefined,
      pickup_datetime: g.pickup_datetime ?? undefined,
      dropoff_datetime: g.dropoff_datetime ?? undefined,
      pickup_location: g.pickup_location ?? undefined,
      dropoff_location: g.dropoff_location ?? undefined,
      vehicle_type: g.vehicle_type ?? undefined,
      vehicle_capacity: g.vehicle_capacity ?? undefined,
      driver_name: g.driver_name ?? undefined,
      driver_phone: g.driver_phone ?? undefined,
      driver_company: g.driver_company ?? undefined,
      passengers: Array.isArray(g.passengers) ? g.passengers : undefined,
      status: g.status ?? "pending",
      notes: g.notes ?? undefined,
      created_by_role: g.created_by_role ?? undefined,
      adv: g.advancing_id,
    })),
    (g) => g.adv,
  );

  const timelineByAdvancing = groupBy(
    (timelineR.data ?? []).map((t: any): TimelineEvent & { adv: string } => ({
      id: t.id,
      advancing_id: t.advancing_id,
      event_type: t.event_type,
      datetime: t.datetime,
      location: t.location ?? undefined,
      responsible_contact: t.responsible_contact ?? undefined,
      notes: t.notes ?? undefined,
      sort_order: t.sort_order ?? undefined,
      adv: t.advancing_id,
    })),
    (t) => t.adv,
  );

  return {
    organizations,
    artists,
    artistCrew,
    artistRiderTemplates,
    artistTechRequirements,
    festivals,
    stages,
    festivalCrmContacts,
    bookingContacts,
    bookingPaymentMilestones,
    bookingTasks,
    agencyEmailTemplates,
    inquiries,
    bookingEmails,
    bookingOffers,
    bookings,
    bookingCrew,
    advancings,
    sections: sectionsData,
    techItems,
    signedRiders,
    activity,
    hotelByAdvancing,
    travelByAdvancing,
    logisticsByAdvancing,
    hospitalityByAdvancing,
    visaByAdvancing,
    visaCrewByAdvancing,
    distancesByAdvancing,
    contactsArtistByAdvancing,
    contactsFestivalByAdvancing,
    flightsByAdvancing,
    hotelProposalsByAdvancing,
    festivalDocumentsByAdvancing,
    timelineByAdvancing,
    groundTransfersByAdvancing,
  };
});

// ============================================================================
// Helpers - matching the lookup shape of lib/data.ts and lib/store.ts
// ============================================================================

export function findAdvancingDetail(snap: Snapshot, id: string): AdvancingDetail | null {
  const advancing = snap.advancings.find((a) => a.id === id);
  if (!advancing) return null;
  const booking = snap.bookings.find((b) => b.id === advancing.booking_id);
  if (!booking) return null;
  const artist = snap.artists.find((a) => a.id === booking.artist_id);
  const festival = snap.festivals.find((f) => f.id === booking.festival_id);
  const stage = snap.stages.find((s) => s.id === booking.stage_id);
  if (!artist || !festival || !stage) return null;

  const secs = snap.sections.filter((s) => s.advancing_id === id);
  const riders = snap.signedRiders.filter((r) => r.advancing_id === id);
  const acts = snap.activity.filter((a) => a.advancing_id === id);
  const tech = snap.techItems.filter((t) => t.advancing_id === id);
  const crew = snap.bookingCrew.filter((c) => c.booking_id === booking.id);

  const hotel = snap.hotelByAdvancing[id] ?? { hotel_required: false };
  const visa = snap.visaByAdvancing[id] ?? null;
  const visaCrew = snap.visaCrewByAdvancing[id] ?? [];
  const distances = snap.distancesByAdvancing[id] ?? {};
  const logistics = snap.logisticsByAdvancing[id] ?? {};
  const travel = snap.travelByAdvancing[id] ?? {};
  const hospitalityData = snap.hospitalityByAdvancing[id];

  return {
    advancing,
    booking,
    artist,
    festival,
    stage,
    sections: secs,
    riders,
    artist_contacts: (snap.contactsArtistByAdvancing[id] ?? []) as ContactPerson[],
    festival_contacts: (snap.contactsFestivalByAdvancing[id] ?? []) as ContactPerson[],
    flights: (snap.flightsByAdvancing[id] ?? []) as FlightInfo[],
    activity: acts,
    tech_items: tech,
    booking_crew: crew,
    visa,
    visa_crew: visaCrew,
    distances,
    hotel,
    technical: {
      stageplot_uploaded: (secs.find((s) => s.section_type === "stage")?.completion_percent ?? 0) >= 50,
      sound_rider_uploaded: (secs.find((s) => s.section_type === "audio")?.completion_percent ?? 0) >= 50,
      foh_engineer_name: crew.find((c) => c.role === "foh")?.name,
      pyro_required: tech.some((t) => t.category === "sfx_pyro"),
      light_setup_type: undefined,
    },
    logistics: {
      load_in_time: logistics.load_in_time,
      soundcheck_time: logistics.soundcheck_time,
      show_time: logistics.show_time ?? booking.show_time,
      load_out_time: logistics.load_out_time,
      doors_time: logistics.doors_time ?? booking.doors_time,
      curfew_time: logistics.curfew_time ?? booking.curfew_time,
      programming_time: logistics.programming_time ?? booking.programming_slot,
      crew_traveling: logistics.crew_traveling ?? (crew.filter((c) => c.is_traveling).length || undefined),
      parking_spots_needed: logistics.parking_spots_needed,
      notes: logistics.notes,
    },
    travel: {
      hotel_required: hotel.hotel_required,
      hotel_room_count: hotel.hotel_room_count,
      hotel_check_in: hotel.hotel_check_in,
      hotel_check_out: hotel.hotel_check_out,
      notes: travel.notes,
    },
    hospitality: {
      party_size: hospitalityData?.party_size,
      hot_meal_required: hospitalityData?.hot_meal_required ?? false,
      dressing_room_count: hospitalityData?.dressing_room_count,
      specific_requests: hospitalityData?.specific_requests,
    },
  };
}

export function findPortalDetail(snap: Snapshot, token: string): AdvancingDetail | null {
  const advancing = snap.advancings.find((a) => a.portal_token === token);
  if (!advancing) return null;
  return findAdvancingDetail(snap, advancing.id);
}

export function dashboardStats(snap: Snapshot) {
  const totalBookings = snap.bookings.length;
  const activeAdvancings = snap.advancings.filter((a) => a.status === "in_progress" || a.status === "pending").length;
  const completedAdvancings = snap.advancings.filter((a) => a.status === "complete" || a.status === "locked").length;
  const ridersPending = snap.signedRiders.filter((r) => r.status === "pending" || r.status === "sent_to_festival").length;
  const ridersDisputed = snap.signedRiders.filter((r) => r.status === "disputed").length;
  const ridersAccepted = snap.signedRiders.filter((r) => r.status === "accepted").length;
  const ridersSigned = snap.signedRiders.filter((r) => r.status === "signed").length;
  return {
    totalBookings,
    activeAdvancings,
    completedAdvancings,
    ridersPending,
    ridersDisputed,
    ridersAccepted,
    ridersSigned,
    totalRiders: snap.signedRiders.length,
  };
}

export function statusBreakdown(snap: Snapshot) {
  const total = snap.advancings.length || 1;
  const groups = [
    { label: "Pending", value: snap.advancings.filter((a) => a.status === "pending").length, color: "#fb923c" },
    { label: "In progress", value: snap.advancings.filter((a) => a.status === "in_progress").length, color: "#f25a1c" },
    { label: "Complete", value: snap.advancings.filter((a) => a.status === "complete").length, color: "#22c55e" },
    { label: "Locked", value: snap.advancings.filter((a) => a.status === "locked").length, color: "#0f172a" },
  ];
  return groups.map((g) => ({ ...g, percent: Math.round((g.value / total) * 100) }));
}

export function lookupArtist(snap: Snapshot, id: string) {
  return snap.artists.find((a) => a.id === id);
}
export function lookupFestival(snap: Snapshot, id: string) {
  return snap.festivals.find((f) => f.id === id);
}
export function lookupStage(snap: Snapshot, id: string) {
  return snap.stages.find((s) => s.id === id);
}

export function getSectionsForAdvancing(snap: Snapshot, advancingId: string) {
  const existing = snap.sections.filter((s) => s.advancing_id === advancingId);
  if (existing.length >= SECTION_TYPES.length) return existing;
  // Fill missing sections with empty placeholders so UI always renders 18
  const have = new Set(existing.map((s) => s.section_type));
  const missing: AdvancingSection[] = SECTION_TYPES.filter((t) => !have.has(t)).map((t): AdvancingSection => ({
    id: `placeholder_${advancingId}_${t}`,
    advancing_id: advancingId,
    section_type: t as SectionType,
    status: "empty",
    completion_percent: 0,
  }));
  return [...existing, ...missing];
}

export function findAdvancingByToken(snap: Snapshot, token: string) {
  return snap.advancings.find((a) => a.portal_token === token);
}
