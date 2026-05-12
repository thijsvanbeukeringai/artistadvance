"use client";

import DefaultsCard, { type DefaultField } from "./DefaultsCard";
import { setArtistDefaultsAction } from "@/lib/actions";
import type { ArtistLogisticsDefaults } from "@/lib/types";

const FIELDS: DefaultField<keyof ArtistLogisticsDefaults & string>[] = [
  { key: "vehicle_count",         label: "Standaard aantal voertuigen", kind: "number", placeholder: "2" },
  { key: "vehicle_types",         label: "Type voertuigen",             kind: "text",   placeholder: "Tourbus + sprinter" },
  { key: "parking_spots_needed",  label: "Parkeerplaatsen backstage",   kind: "number", placeholder: "4" },
  { key: "loading_dock_required", label: "Loading dock nodig",          kind: "checkbox" },
  { key: "forklift_required",     label: "Forklift nodig",              kind: "checkbox" },
  { key: "crew_traveling",        label: "Crew die typisch meekomt",    kind: "number", placeholder: "5" },
  { key: "stagehands_needed",     label: "Stagehands van festival",     kind: "number", placeholder: "4" },
  { key: "riggers_needed",        label: "Riggers van festival",        kind: "number", placeholder: "2" },
  { key: "security_requests",     label: "Beveiligingswensen",          kind: "textarea", placeholder: "Bv. 2 security op backstage, 1 bij dressing room", cols: 3 },
];

export default function LogisticsDefaultsEditor({ artistId, defaults }: { artistId: string; defaults: ArtistLogisticsDefaults }) {
  return (
    <DefaultsCard<ArtistLogisticsDefaults>
      title="Logistics defaults"
      description="Voertuig + parking + festival-crew die je standaard nodig hebt. Festival ziet dit als baseline."
      defaults={defaults}
      fields={FIELDS}
      onSave={async (patch) => setArtistDefaultsAction(artistId, { defaults_logistics: Object.keys(patch).length > 0 ? patch : null })}
    />
  );
}
