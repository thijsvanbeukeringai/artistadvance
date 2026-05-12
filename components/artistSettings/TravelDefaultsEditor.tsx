"use client";

import DefaultsCard, { type DefaultField } from "./DefaultsCard";
import { setArtistDefaultsAction } from "@/lib/actions";
import type { ArtistTravelDefaults } from "@/lib/types";

const FIELDS: DefaultField<keyof ArtistTravelDefaults & string>[] = [
  { key: "ground_transport_airport_hotel", label: "Airport → Hotel transfer", kind: "checkbox" },
  { key: "ground_transport_hotel_venue",   label: "Hotel → Venue transfer", kind: "checkbox" },
  { key: "ground_transport_venue_hotel",   label: "Venue → Hotel transfer", kind: "checkbox" },
  { key: "ground_transport_hotel_airport", label: "Hotel → Airport transfer", kind: "checkbox" },
  { key: "transport_vehicle_type",         label: "Voertuig type voorkeur", kind: "text", placeholder: "Mercedes V-class", cols: 2 },
  { key: "transport_special_requests",     label: "Speciale wensen", kind: "textarea", placeholder: "Bv. blacked-out windows, koffie aan boord", cols: 3 },
];

export default function TravelDefaultsEditor({ artistId, defaults }: { artistId: string; defaults: ArtistTravelDefaults }) {
  return (
    <DefaultsCard<ArtistTravelDefaults>
      title="Travel defaults"
      description="Ground transport voorkeuren - festival vult de details in (chauffeur, tijd) maar de basis-flags staan al."
      defaults={defaults}
      fields={FIELDS}
      onSave={async (patch) => setArtistDefaultsAction(artistId, { defaults_travel: Object.keys(patch).length > 0 ? patch : null })}
    />
  );
}
