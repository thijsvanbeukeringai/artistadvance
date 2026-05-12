"use client";

import DefaultsCard, { type DefaultField } from "./DefaultsCard";
import { setArtistDefaultsAction } from "@/lib/actions";
import type { ArtistHotelDefaults } from "@/lib/types";

const FIELDS: DefaultField<keyof ArtistHotelDefaults & string>[] = [
  { key: "hotel_required",     label: "Hotel standaard nodig", kind: "checkbox" },
  { key: "hotel_star_rating",  label: "Sterren voorkeur", kind: "select", options: [
      { value: "3*", label: "3*" }, { value: "4*", label: "4*" }, { value: "5*", label: "5*" },
  ]},
  { key: "hotel_room_count",   label: "Standaard aantal kamers", kind: "number", placeholder: "4" },
  { key: "hotel_room_type",    label: "Standaard kamertype", kind: "select", options: [
      { value: "single", label: "Single" }, { value: "kingsize", label: "Kingsize" },
      { value: "twin", label: "Twin" }, { value: "suite", label: "Suite" },
  ]},
  { key: "hotel_nights",       label: "Standaard aantal nachten", kind: "number", placeholder: "1" },
  { key: "hotel_late_checkout", label: "Late check-out gewenst", kind: "checkbox" },
  { key: "hotel_preference",   label: "Voorkeur (vrije tekst)", kind: "text", placeholder: "Bv. 'nearest to venue, 5*'", cols: 2 },
];

export default function HotelDefaultsEditor({ artistId, defaults }: { artistId: string; defaults: ArtistHotelDefaults }) {
  return (
    <DefaultsCard<ArtistHotelDefaults>
      title="Hotel defaults"
      description="Wat het festival typisch moet regelen aan hotel — wordt voorgevuld in elke advancing."
      defaults={defaults}
      fields={FIELDS}
      onSave={async (patch) => setArtistDefaultsAction(artistId, { defaults_hotel: Object.keys(patch).length > 0 ? patch : null })}
    />
  );
}
