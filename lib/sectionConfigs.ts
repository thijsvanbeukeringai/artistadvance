import type { SectionType } from "./types";

type FieldConfig =
  | { kind: "text"; name: string; label: string; placeholder?: string; cols?: 1 | 2 | 3 }
  | { kind: "number"; name: string; label: string; placeholder?: string; cols?: 1 | 2 | 3 }
  | { kind: "time"; name: string; label: string; cols?: 1 | 2 | 3 }
  | { kind: "date"; name: string; label: string; cols?: 1 | 2 | 3 }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; cols?: 1 | 2 | 3 }
  | { kind: "select"; name: string; label: string; options: { value: string; label: string }[]; cols?: 1 | 2 | 3 }
  | { kind: "checkbox"; name: string; label: string; cols?: 1 | 2 | 3 };

export type Group = { title: string; description?: string; fields: FieldConfig[] };

export const sectionMeta: Partial<Record<SectionType, { label: string; tagline: string; groups: Group[] }>> = {
  logistics: {
    label: "Logistiek",
    tagline: "Load-in, soundcheck, booth time, programming voor LED/laser/video.",
    groups: [
      {
        title: "Show tijden",
        fields: [
          { kind: "time", name: "load_in_time", label: "Load-in" },
          { kind: "number", name: "setup_duration_minutes", label: "Opbouwtijd (min)" },
          { kind: "time", name: "soundcheck_time", label: "Soundcheck" },
          { kind: "number", name: "soundcheck_duration_minutes", label: "Soundcheck duur (min)" },
          { kind: "time", name: "doors_time", label: "Doors" },
          { kind: "time", name: "show_time", label: "Showtime" },
          { kind: "time", name: "curfew_time", label: "Curfew" },
          { kind: "time", name: "load_out_time", label: "Load-out" },
        ],
      },
      {
        title: "Booth + programming time",
        description: "Tijd waarop crew kan programmeren op de booth, LED, laser, video.",
        fields: [
          { kind: "time", name: "booth_time_start", label: "Booth start" },
          { kind: "time", name: "booth_time_end", label: "Booth eind" },
          { kind: "number", name: "booth_duration_minutes", label: "Booth duur (min)" },
          { kind: "time", name: "programming_time_led", label: "LED programming start" },
          { kind: "number", name: "programming_duration_led", label: "LED prog duur (min)" },
          { kind: "time", name: "programming_time_laser", label: "Laser programming start" },
          { kind: "number", name: "programming_duration_laser", label: "Laser prog duur (min)" },
          { kind: "time", name: "programming_time_video", label: "Video / Resolume start" },
          { kind: "number", name: "programming_duration_video", label: "Video prog duur (min)" },
          { kind: "textarea", name: "programming_notes", label: "Programming notities", cols: 3 },
        ],
      },
      {
        title: "Voertuigen & parking",
        fields: [
          { kind: "number", name: "vehicle_count", label: "Aantal voertuigen" },
          { kind: "text", name: "vehicle_types", label: "Type voertuigen", placeholder: "Tourbus, sprinter, …" },
          { kind: "number", name: "parking_spots_needed", label: "Parkeerplaatsen backstage" },
          { kind: "checkbox", name: "loading_dock_required", label: "Loading dock nodig" },
          { kind: "checkbox", name: "forklift_required", label: "Forklift nodig" },
        ],
      },
      {
        title: "Crew",
        fields: [
          { kind: "number", name: "crew_traveling", label: "Crew die meekomt" },
          { kind: "number", name: "stagehands_needed", label: "Stagehands van festival" },
          { kind: "number", name: "riggers_needed", label: "Riggers van festival" },
          { kind: "textarea", name: "security_requests", label: "Beveiligingswensen", cols: 3 },
          { kind: "textarea", name: "notes", label: "Algemene logistiek-notities", cols: 3 },
        ],
      },
    ],
  },
  travel: {
    label: "Travel",
    tagline: "Vluchten en ground transport.",
    groups: [
      {
        title: "Ground transport",
        fields: [
          { kind: "checkbox", name: "ground_transport_airport_hotel", label: "Luchthaven → hotel" },
          { kind: "checkbox", name: "ground_transport_hotel_venue", label: "Hotel → venue" },
          { kind: "checkbox", name: "ground_transport_venue_hotel", label: "Venue → hotel" },
          { kind: "checkbox", name: "ground_transport_hotel_airport", label: "Hotel → luchthaven" },
          { kind: "text", name: "transport_vehicle_type", label: "Voertuig type" },
          { kind: "textarea", name: "transport_special_requests", label: "Speciale wensen", cols: 3 },
          { kind: "textarea", name: "notes", label: "Travel notities", cols: 3 },
        ],
      },
    ],
  },
  hotel: {
    label: "Hotel",
    tagline: "Hotelvoorkeur, kamers, en check-in/check-out.",
    groups: [
      {
        title: "Hotel basics",
        fields: [
          { kind: "checkbox", name: "hotel_required", label: "Hotel nodig" },
          {
            kind: "select", name: "hotel_star_rating", label: "Sterren",
            options: [
              { value: "3*", label: "3*" },
              { value: "4*", label: "4*" },
              { value: "5*", label: "5*" },
            ],
          },
          { kind: "text", name: "hotel_preference", label: "Voorkeur", placeholder: "Bijv. 'nearest to venue'" },
          { kind: "number", name: "hotel_room_count", label: "Aantal kamers" },
          {
            kind: "select", name: "hotel_room_type", label: "Kamertype",
            options: [
              { value: "single", label: "Single" },
              { value: "kingsize", label: "Kingsize" },
              { value: "twin", label: "Twin" },
              { value: "suite", label: "Suite" },
            ],
          },
          { kind: "number", name: "hotel_nights", label: "Aantal nachten" },
          { kind: "text", name: "hotel_nights_description", label: "Nachten omschrijving", placeholder: "1 night before, 1 night of show", cols: 2 },
          { kind: "date", name: "hotel_check_in", label: "Check-in datum" },
          { kind: "date", name: "hotel_check_out", label: "Check-out datum" },
          { kind: "checkbox", name: "hotel_late_checkout", label: "Late check-out" },
        ],
      },
    ],
  },
  hospitality: {
    label: "Hospitality",
    tagline: "Catering, dressing rooms, dieetwensen.",
    groups: [
      {
        title: "Party & catering",
        fields: [
          { kind: "number", name: "party_size", label: "Aantal personen" },
          { kind: "checkbox", name: "hot_meal_required", label: "Warme maaltijd gewenst" },
          { kind: "textarea", name: "specific_brands", label: "Specifieke merken / producten", cols: 3 },
          { kind: "textarea", name: "drinks_specification", label: "Dranken specificatie", cols: 3 },
        ],
      },
      {
        title: "Dressing room",
        fields: [
          { kind: "number", name: "dressing_room_count", label: "Aantal dressing rooms" },
          { kind: "text", name: "temperature_preference", label: "Temperatuur voorkeur" },
          { kind: "number", name: "towel_count", label: "Aantal handdoeken" },
          { kind: "textarea", name: "specific_requests", label: "Specifieke verzoeken", cols: 3 },
          { kind: "textarea", name: "notes", label: "Hospitality notities", cols: 3 },
        ],
      },
    ],
  },
  contacts: {
    label: "Contactpersonen",
    tagline: "Tour manager, FOH, lighting director, agent.",
    groups: [],
  },
  visa: {
    label: "Visa / Paperwork",
    tagline: "Visa eisen + status per crewlid.",
    groups: [],
  },
};

export const TECH_SECTION_LABELS: Record<string, string> = {
  dj_gear: "DJ Gear",
  monitors: "Monitors",
  audio: "Audio",
  light: "Lighting",
  video: "Video",
  lasers: "Lasers",
  sfx_pyro: "SFX / Pyro",
  stage: "Stage",
  ethernet: "Networking",
  communication: "Communication",
  power: "Stroom",
  backline: "Backline",
};

export type { FieldConfig };
