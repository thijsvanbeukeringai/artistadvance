"use client";

import { useState, useTransition } from "react";
import { updateArtistContractTemplateAction } from "@/lib/actions";

const SAMPLE_TEMPLATE = `# Performance Agreement — {{artist_name}}

**Datum overeenkomst:** {{today}}

## Partijen
- **Artist:** {{artist_name}}
- **Promoter:** {{promoter_name}} ({{promoter_email}}, {{promoter_phone}})

## Show details
- **Festival/event:** {{festival_name}} ({{festival_location}}, {{festival_country}})
- **Stage:** {{stage_name}}
- **Datum:** {{show_date}}
- **Show tijd:** {{show_time}}
- **Set duur:** {{set_duration}} minuten
- **Show type:** {{show_type}}
- **Venue:** {{venue_address}}, {{venue_city}}, {{venue_country}}

## Financieel
- **Fee:** {{fee}}
- **Guarantee/notitie:** {{guarantee}}
- **Agency commissie:** {{commission_pct}}%
- **BTW:** {{vat_pct}}%

## Voorwaarden
[Voeg hier de standaardvoorwaarden van deze artiest toe.]

---
Voor akkoord:

Artist: ___________________________  Promoter: ___________________________
`;

const AVAILABLE_TOKENS = [
  "artist_name", "festival_name", "festival_location", "festival_country", "stage_name",
  "show_date", "show_time", "set_duration", "show_type",
  "fee", "guarantee", "commission_pct", "vat_pct",
  "promoter_name", "promoter_email", "promoter_phone",
  "venue_address", "venue_city", "venue_country",
  "today",
];

export default function ContractTemplateEditor({
  artistId,
  initialTemplate,
}: {
  artistId: string;
  initialTemplate: string | null;
}) {
  const [template, setTemplate] = useState(initialTemplate ?? "");
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const result = await updateArtistContractTemplateAction(artistId, template.trim() || null);
      if (result.ok) setSavedAt(Date.now());
      else setError(result.error);
    });
  }

  function insertSample() {
    setTemplate(SAMPLE_TEMPLATE);
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Contract-template</h3>
        <p className="text-xs text-ink-500 mt-0.5">
          Eén template voor deze artiest. Bij elke booking druk je "Genereer contract" → vult automatisch alle <code className="bg-ink-100 px-1 rounded text-[10px]">{`{{tokens}}`}</code> in en maakt een PDF.
        </p>
      </header>
      <div className="p-5 space-y-3">
        {!template && (
          <button
            type="button"
            onClick={insertSample}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            ↪ Begin met voorbeeld-template
          </button>
        )}

        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Schrijf hier je contract-template met merge tokens zoals {{artist_name}}, {{festival_name}}, {{fee}}..."
          className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm font-mono focus:border-brand-500 focus:outline-none min-h-[360px]"
        />

        <details>
          <summary className="text-xs text-ink-500 cursor-pointer hover:text-ink-900">Beschikbare merge-tokens</summary>
          <div className="flex flex-wrap gap-1 mt-2">
            {AVAILABLE_TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate((prev) => prev + `{{${t}}}`)}
                className="text-[10px] bg-ink-100 hover:bg-ink-200 text-ink-700 font-mono px-1.5 py-0.5 rounded"
              >
                {`{{${t}}}`}
              </button>
            ))}
          </div>
        </details>

        {error && <div className="text-xs text-red-700">{error}</div>}

        <div className="flex items-center justify-end gap-2">
          {savedAt && Date.now() - savedAt < 3000 && (
            <span className="text-[11px] text-emerald-700 font-semibold">✓ Opgeslagen</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50"
          >
            {pending ? "Opslaan..." : "Template opslaan"}
          </button>
        </div>
      </div>
    </section>
  );
}
