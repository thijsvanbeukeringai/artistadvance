"use client";

import { useState, useTransition } from "react";
import { generateContractAction } from "@/lib/actions";

export default function ContractGeneratorBlock({
  bookingId,
  hasTemplate,
  currentUrl,
  generatedAt,
  artistId,
}: {
  bookingId: string;
  hasTemplate: boolean;
  currentUrl: string | null;
  generatedAt: string | null;
  artistId: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const result = await generateContractAction(bookingId);
      if (result.ok) setSavedAt(Date.now());
      else setError(result.error);
    });
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-ink-200 bg-ink-50">
        <h3 className="font-bold text-ink-900 text-sm">Contract</h3>
        <p className="text-[11px] text-ink-500 mt-0.5">Auto-gegenereerd uit de artist-template + alle booking-details.</p>
      </header>
      <div className="p-5 space-y-3">
        {!hasTemplate ? (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            Deze artiest heeft nog geen contract-template ingesteld.{" "}
            <a href={`/artists/${artistId}/settings`} className="font-semibold underline">Open artist settings</a> om er één toe te voegen.
          </div>
        ) : currentUrl ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center justify-between gap-3">
            <div>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-900 hover:underline">
                📄 Open contract PDF
              </a>
              {generatedAt && (
                <div className="text-[11px] text-emerald-800 mt-0.5 tabular-nums">
                  Gegenereerd {new Date(generatedAt).toLocaleString("nl-NL")}
                </div>
              )}
            </div>
            <button type="button" onClick={generate} disabled={pending} className="text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-md hover:bg-emerald-100 disabled:opacity-50">
              {pending ? "Bezig..." : "Opnieuw genereren"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={generate} disabled={pending} className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50">
            {pending ? "Genereren..." : "Genereer contract PDF"}
          </button>
        )}
        {savedAt && Date.now() - savedAt < 3000 && (
          <div className="text-[11px] text-emerald-700 font-semibold">✓ Contract gegenereerd</div>
        )}
        {error && <div className="text-xs text-red-700">{error}</div>}
      </div>
    </section>
  );
}
