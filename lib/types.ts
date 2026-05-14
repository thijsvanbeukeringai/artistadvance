// Domain types - gebaseerd op spec v2.

export type OrgType = "management" | "festival" | "artist_solo";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  dropbox_root_folder?: string | null;
  dropbox_connected?: boolean;
}

export interface ArtistHospitalityDefaults {
  party_size?: number;
  hot_meal_required?: boolean;
  dressing_room_count?: number;
  temperature_preference?: string;
  towel_count?: number;
  specific_brands?: string;
  drinks_specification?: string;
  specific_requests?: string;
}

export interface ArtistHotelDefaults {
  hotel_required?: boolean;
  hotel_star_rating?: string;
  hotel_room_count?: number;
  hotel_room_type?: string;
  hotel_nights?: number;
  hotel_late_checkout?: boolean;
  hotel_preference?: string;
}

export interface ArtistTravelDefaults {
  ground_transport_airport_hotel?: boolean;
  ground_transport_hotel_venue?: boolean;
  ground_transport_venue_hotel?: boolean;
  ground_transport_hotel_airport?: boolean;
  transport_vehicle_type?: string;
  transport_special_requests?: string;
}

export interface ArtistLogisticsDefaults {
  vehicle_count?: number;
  vehicle_types?: string;
  parking_spots_needed?: number;
  loading_dock_required?: boolean;
  forklift_required?: boolean;
  crew_traveling?: number;
  stagehands_needed?: number;
  riggers_needed?: number;
  security_requests?: string;
}

export interface Artist {
  id: string;
  name: string;
  organization_id: string;
  dropbox_artist_folder?: string | null;
  /** Aanwezigheid van refresh-token = artiest is gekoppeld. */
  dropbox_connected?: boolean;
  dropbox_account_email?: string | null;
  /** Slug voor publieke intake-URL /intake/<slug>. NULL = niet ingeschakeld. */
  intake_slug?: string | null;
  intake_enabled?: boolean;
  image?: string;
  defaults_hospitality?: ArtistHospitalityDefaults;
  defaults_hotel?: ArtistHotelDefaults;
  defaults_travel?: ArtistTravelDefaults;
  defaults_logistics?: ArtistLogisticsDefaults;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  contract_template_md?: string;
}

export type CrewRole =
  | "pm"        // Production Manager
  | "ld"        // Lighting Director
  | "vj"        // VJ / Visual Operator
  | "foh"       // FOH Engineer
  | "tm"        // Tour Manager
  | "tm2"       // Tour Manager 2
  | "bl"        // Backline Tech
  | "media1"    // Media / Content 1
  | "media2"    // Media / Content 2
  | "vi"        // MC / Vocalist
  | "sfx"       // SFX / Pyro Operator
  | "laser"     // Laser Operator
  | "makeup"    // Make-up Artist
  | "mgmt"      // Management
  | "artist"    // DJ / Artiest
  | "other";    // Vrij

export interface ArtistCrew {
  id: string;
  artist_id: string;
  role: CrewRole;
  name: string;
  email?: string;
  phone?: string;
  is_default: boolean;
}

export type ShowType = "festival" | "club" | "full_production" | "ldjv" | "venue" | "corporate" | "private";
export type IntakeStatus = "pending" | "accepted" | "declined";

export interface BookingIntake {
  id: string;
  artist_id: string;
  status: IntakeStatus;
  festival_name: string;
  stage_name?: string;
  show_date: string;
  show_time?: string;
  set_duration_minutes?: number;
  show_type?: ShowType;
  venue_city?: string;
  venue_country?: string;
  fee?: number;
  promoter_name: string;
  promoter_email: string;
  promoter_phone?: string;
  promoter_company?: string;
  notes?: string;
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
  converted_booking_id?: string;
}

export type RiderType =
  | "technical"
  | "hospitality"
  | "production"
  | "bus"
  | "rigging"
  | "stage"
  | "club"
  | "festival"
  | "dressingroom"
  | "sfx"
  | "laser"
  | "sfx_pyro";

export const RIDER_TYPES: RiderType[] = [
  "technical",
  "hospitality",
  "production",
  "bus",
  "rigging",
  "stage",
  "club",
  "festival",
  "dressingroom",
  "sfx",
  "laser",
];

export const RIDER_TYPE_LABELS: Record<RiderType, string> = {
  technical: "Technische Rider",
  hospitality: "Hospitality Rider",
  production: "Productierider",
  bus: "Busrider",
  rigging: "Riggingrider",
  stage: "Stagerider",
  club: "Clubrider",
  festival: "Festival Rider",
  dressingroom: "Dressingroom Rider",
  sfx: "SFX Rider",
  laser: "Laser Rider",
  sfx_pyro: "SFX / Pyro Rider",
};

export interface ArtistRiderTemplate {
  id: string;
  artist_id: string;
  /** Legacy veld. Nieuwe templates zijn show_type-onafhankelijk (null). */
  show_type?: ShowType | null;
  rider_type: RiderType;
  file_name: string;
  storage_path?: string | null;
  is_active: boolean;
  version: number;
}

export type TechCategory =
  | "dj_gear"
  | "monitors"
  | "audio"
  | "light"
  | "video"
  | "lasers"
  | "sfx_pyro"
  | "stage"
  | "ethernet"
  | "communication"
  | "power"
  | "backline";

export interface ArtistTechRequirement {
  id: string;
  artist_id: string;
  show_type: ShowType;
  category: TechCategory;
  item_description: string;
  is_mandatory: boolean;
  notes?: string;
  sort_order: number;
}

export interface Festival {
  id: string;
  name: string;
  organization_id: string;
  location: string;
  country?: string;
  start_date: string;
  end_date: string;
}

export interface Stage {
  id: string;
  festival_id: string;
  name: string;
}

export interface FestivalCRMContact {
  id: string;
  festival_id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  notes?: string;
}

export type BookingStatus =
  | "draft"
  | "confirmed"
  | "advancing"
  | "completed"
  | "cancelled";

export type HoldStatus = "active" | "challenged" | "released" | "confirmed" | "expired";
export type BillingPosition = "headline" | "co_headline" | "support" | "special_guest" | "opener";
export type SlotPosition = "opener" | "main" | "closing" | "b2b" | "other";
export type ExclusivityType = "none" | "festival" | "brand" | "city";

export interface Booking {
  id: string;
  artist_id: string;
  festival_id: string;
  stage_id: string;
  show_type: ShowType;
  status: BookingStatus;
  show_date: string;
  show_time: string;
  set_duration_minutes: number;
  programming_slot?: string;
  soundcheck_slot?: string;
  doors_time?: string;
  curfew_time?: string;
  fee?: number;
  guarantee?: string;
  contributions?: string;
  contract_status?: string;
  is_looped?: boolean;
  confirmed_at?: string;
  // Location & parking
  venue_address?: string;
  venue_postcode?: string;
  venue_city?: string;
  venue_country?: string;
  parking_info?: string;
  parking_map_url?: string;
  // Show metadata
  billing_position?: string;
  slot_position?: string;
  b2b_partner?: string;
  last_activity_at?: string;
  /** rider_types die voor dit show meegestuurd moeten naar het festival portal. */
  selected_riders?: RiderType[];
  /** Show is door artist zelf aangemaakt (geen agency-deal) — verbergt commission/holds/contract velden. */
  advance_only?: boolean;
  // Deal economics
  commission_pct?: number;
  vat_pct?: number;
  withholding_tax_pct?: number;
  travel_buyout?: number;
  hotel_buyout?: number;
  // Hold
  hold_position?: number;
  hold_status?: HoldStatus;
  hold_expires_at?: string;
  // Radius/exclusivity
  radius_km?: number;
  radius_days_before?: number;
  radius_days_after?: number;
  exclusivity_type?: ExclusivityType;
  // Contract PDF
  contract_pdf_url?: string;
  contract_generated_at?: string;
}

export type BookingContactRole =
  | "promoter"
  | "talent_buyer"
  | "production_manager"
  | "stage_manager"
  | "payment_contact"
  | "local_runner"
  | "hospitality_contact"
  | "other";

export interface BookingContact {
  id: string;
  booking_id: string;
  festival_crm_contact_id: string;
  role: BookingContactRole;
  is_primary: boolean;
}

export type PaymentMilestoneStatus = "pending" | "invoiced" | "paid" | "overdue";

export interface BookingPaymentMilestone {
  id: string;
  booking_id: string;
  label: string;
  amount?: number;
  due_date?: string;
  status: PaymentMilestoneStatus;
  paid_date?: string;
  notes?: string;
  sort_order: number;
}

export interface BookingTask {
  id: string;
  booking_id: string;
  label: string;
  due_date?: string;
  done: boolean;
  done_at?: string;
  sort_order: number;
}

export type EmailTemplateType =
  | "offer"
  | "hold_confirm"
  | "contract_attached"
  | "deposit_chase"
  | "advance_handover"
  | "decline"
  | "custom";

export interface AgencyEmailTemplate {
  id: string;
  organization_id: string;
  type: EmailTemplateType;
  name: string;
  subject?: string;
  body_md?: string;
}

export type InquiryStatus = "new" | "counter_sent" | "on_hold" | "declined" | "lost" | "converted";
export type InquirySource = "email" | "phone" | "web" | "referral" | "other";
export type DeclineReason =
  | "budget_too_low"
  | "date_conflict"
  | "not_a_fit"
  | "radius_clash"
  | "artist_not_available"
  | "other";

export interface BookingEmail {
  id: string;
  booking_id: string;
  template_type?: string;
  template_id?: string;
  to_contact_id?: string;
  to_email?: string;
  subject?: string;
  body_snapshot?: string;
  sent_at: string;
}

export interface BookingOffer {
  id: string;
  booking_id: string;
  amount?: number;
  direction: "sent" | "received";
  note?: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  organization_id: string;
  artist_id: string;
  festival_id?: string;
  show_date?: string;
  budget_offered?: number;
  source?: InquirySource;
  status: InquiryStatus;
  decline_reason?: DeclineReason;
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  converted_booking_id?: string;
  created_at: string;
  updated_at?: string;
}

export type FlightStatus = "pending" | "booked" | "confirmed" | "n/a";

export interface BookingCrew {
  id: string;
  booking_id: string;
  artist_crew_id?: string;
  role: CrewRole;
  name: string;
  is_traveling: boolean;
  needs_flight: boolean;
  flight_status: FlightStatus;
  notes?: string;
}

export type AdvancingStatus = "pending" | "in_progress" | "complete" | "locked";

// 18 sectie-types uit spec v2
export type SectionType =
  | "dj_gear"
  | "monitors"
  | "audio"
  | "light"
  | "video"
  | "lasers"
  | "sfx_pyro"
  | "stage"
  | "ethernet"
  | "communication"
  | "power"
  | "backline"
  | "logistics"
  | "travel"
  | "hotel"
  | "hospitality"
  | "contacts"
  | "visa";

export type SectionStatus = "empty" | "in_progress" | "complete" | "locked" | "n_a";

export type FestivalPortalSection =
  | "tech"      // PLEASE CONFIRM tech items
  | "program"   // program timeline / schedule
  | "hotel"     // hotel proposals form
  | "distances" // airport-hotel-venue distances
  | "travel"    // flights + ground transfers
  | "documents" // festival documents upload
  | "riders";   // signed riders block

export interface Advancing {
  id: string;
  booking_id: string;
  status: AdvancingStatus;
  portal_token: string;
  portal_expires_at?: string;
  dropbox_show_folder?: string;
  completed_at?: string;
  locked_at?: string;
  created_at: string;
  /** Sections die in /festival/<token> verborgen moeten worden. Leeg = alles zichtbaar. */
  festival_portal_hidden?: FestivalPortalSection[];
}

export interface AdvancingSection {
  id: string;
  advancing_id: string;
  section_type: SectionType;
  status: SectionStatus;
  last_updated_by?: string;
  last_updated_at?: string;
  completion_percent: number;
}

// PLEASE CONFIRM tech items
export type TechItemStatus =
  | "requested"
  | "confirmed"
  | "not_available"
  | "alternative_offered"
  | "accepted"
  | "disputed";

export interface AdvancingTechItem {
  id: string;
  advancing_id: string;
  category: TechCategory;
  item_description: string;
  is_mandatory: boolean;
  artist_notes?: string;
  status: TechItemStatus;
  festival_response?: string;
  alternative_description?: string;
  management_response?: string;
  confirmed_at?: string;
  sort_order: number;
}

export type RiderStatus = "pending" | "sent_to_festival" | "signed" | "accepted" | "disputed";

export interface SignedRider {
  id: string;
  advancing_id: string;
  rider_type: RiderType;
  status: RiderStatus;
  sent_at?: string;
  signed_at?: string;
  signed_by_name?: string;
  signed_by_role?: string;
  signed_method?: "uploaded_pdf" | "in_portal";
  accepted_at?: string;
  dispute_notes?: string;
  festival_notes?: string;
  version?: number;
  original_rider_file_name?: string;
  signed_rider_file_name?: string;
  // Hydrated door snapshot loader uit Supabase Storage (niet in DB-schema).
  signed_url?: string | null;
  original_url?: string | null;
}

export type VisaStatus = "not_needed" | "pending" | "applied" | "approved" | "denied";

export interface AdvancingVisa {
  advancing_id: string;
  visa_required: boolean;
  visa_type?: string;
  work_permit_required: boolean;
  deadline?: string;
  notes?: string;
}

export interface AdvancingVisaCrew {
  id: string;
  advancing_id: string;
  booking_crew_id?: string;
  name: string;
  status: VisaStatus;
  notes?: string;
}

export interface ActivityEntry {
  id: string;
  advancing_id: string;
  user_name: string;
  user_type?: "management" | "festival" | "system";
  action: string;
  section_type?: SectionType;
  details?: string;
  created_at: string;
}

export interface FlightInfo {
  id: string;
  direction: "inbound" | "outbound";
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_datetime: string;
  arrival_datetime: string;
  passengers: string[];
  status?: FlightStatus;
  booking_reference?: string;
  notes?: string;
  cost_amount?: number;
  paid_by?: "agency" | "promoter" | "artist";
  recharge_to_buyer?: boolean;
}

export interface ContactPerson {
  id: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  is_onsite?: boolean;
}

export interface Distances {
  airport_hotel_km?: number;
  airport_hotel_minutes?: number;
  hotel_venue_km?: number;
  hotel_venue_minutes?: number;
  venue_airport_km?: number;
  venue_airport_minutes?: number;
}

export interface HotelRoomAssignment {
  label: string;
  occupants: string[];
}

export interface HotelInfo {
  hotel_required: boolean;
  hotel_star_rating?: "3*" | "4*" | "5*" | string;
  hotel_preference?: string;
  hotel_room_count?: number;
  hotel_room_type?: string;
  hotel_nights?: number;
  hotel_nights_description?: string;
  hotel_check_in?: string;
  hotel_check_out?: string;
  hotel_late_checkout?: boolean;
  hotel_options_from_festival?: string;
  hotel_confirmed_name?: string;
  room_assignments?: HotelRoomAssignment[];
}

export type HotelAmenity =
  | "breakfast" | "wifi" | "gym" | "spa" | "pool" | "parking"
  | "room_service" | "restaurant" | "bar" | "laundry" | "airport_shuttle" | "soundproof";

export interface HotelRoomOption {
  room_type: string;
  bed_type?: string;
  price_per_night: number;
  currency: string;
  includes_breakfast?: boolean;
}

// Festival-side document uploads - auto-routed naar Dropbox map.
export type DropboxFolder =
  | "00_GENERAL"
  | "01_STAGE"
  | "02_LIGHTING"
  | "03_VIDEO"
  | "04_SFX_PYRO"
  | "05_AUDIO"
  | "06_LASER"
  | "07_TRAVEL"
  | "08_SIGNED_RIDERS";

export type FestivalDocumentCategory =
  | "timetable"
  | "stage_specs"
  | "stage_drawings"
  | "stage_view"
  | "audio_specs"
  | "monitor_specs"
  | "venue_light_specs"
  | "patch_file"
  | "wysiwyg"
  | "grandma_showfile"
  | "video_specs"
  | "pixel_mapping"
  | "resolume_xml"
  | "laser_specs"
  | "laser_positions"
  | "network_diagram"
  | "deal_memo"
  | "contract"
  | "other";

export interface FestivalDocument {
  id: string;
  advancing_id: string;
  category: FestivalDocumentCategory;
  dropbox_folder: DropboxFolder;
  file_name: string;
  storage_path?: string;
  uploaded_by_name?: string;
  uploaded_at: string;
  notes?: string;
  // Dropbox sync state
  synced_to_dropbox?: boolean;
  dropbox_path?: string | null;
  dropbox_file_id?: string | null;
  dropbox_synced_at?: string | null;
  dropbox_error?: string | null;
  // Hydrated door snapshot loader.
  url?: string | null;
}

export interface HotelProposal {
  id: string;
  advancing_id: string;
  hotel_name: string;
  star_rating?: "3*" | "4*" | "5*";
  address?: string;
  distance_to_venue_km?: number;
  amenities: HotelAmenity[];
  room_options: HotelRoomOption[];
  late_checkout_available: boolean;
  cancellation_policy?: string;
  notes?: string;
  proposed_at: string;
}

export type GroundTransferType = "airport_to_hotel" | "hotel_to_venue" | "venue_to_hotel" | "hotel_to_airport" | "other";
export type GroundTransferStatus = "pending" | "confirmed" | "cancelled";

export interface GroundTransfer {
  id: string;
  advancing_id: string;
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
  status: GroundTransferStatus;
  notes?: string;
  created_by_role?: string;
}

export type TimelineEventType =
  | "load_in"
  | "setup"
  | "soundcheck"
  | "programming_led"
  | "programming_laser"
  | "programming_video"
  | "booth_time"
  | "doors"
  | "show"
  | "encore"
  | "curfew"
  | "load_out"
  | "departure"
  | "other";

export interface TimelineEvent {
  id: string;
  advancing_id: string;
  event_type: TimelineEventType;
  datetime: string;
  location?: string;
  responsible_contact?: string;
  notes?: string;
  sort_order?: number;
}

export interface AdvancingDetail {
  advancing: Advancing;
  booking: Booking;
  artist: Artist;
  festival: Festival;
  stage: Stage;
  sections: AdvancingSection[];
  riders: SignedRider[];
  artist_contacts: ContactPerson[];
  festival_contacts: ContactPerson[];
  flights: FlightInfo[];
  activity: ActivityEntry[];
  tech_items: AdvancingTechItem[];
  booking_crew: BookingCrew[];
  visa: AdvancingVisa | null;
  visa_crew: AdvancingVisaCrew[];
  distances: Distances;
  hotel: HotelInfo;
  technical: {
    stageplot_uploaded: boolean;
    sound_rider_uploaded: boolean;
    foh_engineer_name?: string;
    foh_engineer_phone?: string;
    monitor_setup?: "in_ear" | "wedges" | "combo";
    channel_count?: number;
    pyro_required: boolean;
    light_setup_type?: "own_rig" | "house_rig" | "hybrid";
    sound_notes?: string;
  };
  logistics: {
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
  };
  travel: {
    hotel_required: boolean;
    hotel_room_count?: number;
    hotel_check_in?: string;
    hotel_check_out?: string;
    notes?: string;
  };
  hospitality: {
    party_size?: number;
    hot_meal_required: boolean;
    dressing_room_count?: number;
    specific_requests?: string;
  };
}
