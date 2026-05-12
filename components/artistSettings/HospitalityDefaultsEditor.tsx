"use client";

import DefaultsCard, { type DefaultField } from "./DefaultsCard";
import { setArtistDefaultsAction } from "@/lib/actions";
import type { ArtistHospitalityDefaults } from "@/lib/types";

const FIELDS: DefaultField<keyof ArtistHospitalityDefaults & string>[] = [
  { key: "party_size",             label: "Party size",            kind: "number",   placeholder: "6", hint: "Aantal personen totaal" },
  { key: "hot_meal_required",      label: "Warme maaltijd gewenst", kind: "checkbox" },
  { key: "dressing_room_count",    label: "Aantal dressing rooms", kind: "number",   placeholder: "2" },
  { key: "temperature_preference", label: "Temperatuur voorkeur",  kind: "text",     placeholder: "20-22 graden" },
  { key: "towel_count",            label: "Aantal handdoeken",     kind: "number",   placeholder: "10" },
  { key: "specific_brands",        label: "Specifieke merken / producten", kind: "textarea", placeholder: "Red Bull, San Pellegrino, ...", cols: 3 },
  { key: "drinks_specification",   label: "Dranken specificatie",  kind: "textarea", placeholder: "Whisky (merk), Vodka, ...", cols: 3 },
  { key: "specific_requests",      label: "Specifieke verzoeken",  kind: "textarea", placeholder: "Geen alcohol pre-show", cols: 3 },
];

export default function HospitalityDefaultsEditor({ artistId, defaults }: { artistId: string; defaults: ArtistHospitalityDefaults }) {
  return (
    <DefaultsCard<ArtistHospitalityDefaults>
      title="Hospitality defaults"
      description="Dressing room + catering wensen die in elke nieuwe advancing landen."
      defaults={defaults}
      fields={FIELDS}
      onSave={async (patch) => setArtistDefaultsAction(artistId, { defaults_hospitality: Object.keys(patch).length > 0 ? patch : null })}
    />
  );
}
