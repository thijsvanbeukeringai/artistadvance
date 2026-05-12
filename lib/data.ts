// Domain enums + labels. Geen runtime-data meer — alle data komt uit Supabase
// via lib/snapshot.ts (reads) en lib/db.ts (writes).

import type { SectionType, TechCategory } from "./types";

export const SECTION_TYPES: SectionType[] = [
  "dj_gear",
  "monitors",
  "audio",
  "light",
  "video",
  "lasers",
  "sfx_pyro",
  "stage",
  "ethernet",
  "communication",
  "power",
  "backline",
  "logistics",
  "travel",
  "hotel",
  "hospitality",
  "contacts",
  "visa",
];

export const TECH_CATEGORIES: TechCategory[] = [
  "dj_gear",
  "monitors",
  "audio",
  "light",
  "video",
  "lasers",
  "sfx_pyro",
  "stage",
  "ethernet",
  "communication",
  "power",
  "backline",
];

export const SECTION_LABELS: Record<SectionType, string> = {
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
  logistics: "Logistiek",
  travel: "Travel",
  hotel: "Hotel",
  hospitality: "Hospitality",
  contacts: "Contactpersonen",
  visa: "Visa / Paperwork",
};

export const TECH_SECTIONS: TechCategory[] = TECH_CATEGORIES;
export const NON_TECH_SECTIONS: SectionType[] = ["logistics", "travel", "hotel", "hospitality", "contacts", "visa"];

export const CREW_ROLE_LABELS = {
  pm: "Production Manager",
  ld: "Lighting Director",
  vj: "VJ / Visual Operator",
  foh: "FOH Engineer",
  tm: "Tour Manager",
  tm2: "Tour Manager 2",
  bl: "Backline Tech",
  media1: "Media / Content 1",
  media2: "Media / Content 2",
  vi: "MC / Vocalist",
  sfx: "SFX / Pyro Operator",
  laser: "Laser Operator",
  makeup: "Make-up Artist",
  mgmt: "Management",
  artist: "DJ / Artiest",
  other: "Other",
} as const;

export const SHOW_TYPE_LABELS = {
  festival: "Festival",
  club: "Club",
  full_production: "Full production",
  ldjv: "LD + VJ",
  venue: "Venue",
  corporate: "Corporate",
  private: "Private",
} as const;
