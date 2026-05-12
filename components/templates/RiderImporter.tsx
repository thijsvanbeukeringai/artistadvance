"use client";

import { useState, useTransition } from "react";
import { importParsedTechItemsAction, parseRiderAction } from "@/lib/actions";
import { SECTION_LABELS, SHOW_TYPE_LABELS, TECH_SECTIONS } from "@/lib/data";
import type { ShowType, TechCategory } from "@/lib/types";

type ParsedItem = {
  category: TechCategory;
  item_description: string;
  is_mandatory: boolean;
  artist_notes?: string;
};

const SHOW_TYPES: ShowType[] = ["festival", "club", "full_production", "ldjv", "venue", "corporate", "private"];

export default function RiderImporter({ artistId }: { artistId: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showType, setShowType] = useState<ShowType>("festival");
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ input: number; output: number; cached?: number } | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  function reset() {
    setParsed(null);
    setSelected(new Set());
    setError(null);
    setUsage(null);
    setAdded(null);
  }

  function handleSubmit(fd: FormData) {
    setError(null);
    setAdded(null);
    startTransition(async () => {
      const result = await parseRiderAction(artistId, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setParsed(result.items);
      setSelected(new Set(result.items.map((_, i) => i)));
      setUsage({
        input: result.modelUsage.input_tokens,
        output: result.modelUsage.output_tokens,
        cached: result.modelUsage.cache_read_input_tokens,
      });
    });
  }

  function handleImport() {
    if (!parsed) return;
    const itemsToImport = parsed.filter((_, i) => selected.has(i));
    startTransition(async () => {
      const result = await importParsedTechItemsAction(artistId, showType, itemsToImport);
      if (result.ok) {
        setAdded(result.added);
        setParsed(null);
        setSelected(new Set());
      }
    });
  }

  if (!open) {
    return (
      <section className="bg-gradient-to-br from-brand-50 via-white to-ink-50 border border-brand-200 rounded-2xl shadow-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">AI rider import</div>
            <h3 className="text-lg font-bold text-ink-900 mt-1">Importeer tech items uit een rider-PDF</h3>
            <p className="text-sm text-ink-500 mt-1 max-w-xl">
              Upload een PDF - Claude leest de rider, extraheert alle losse items per categorie en voegt ze toe aan deze artiest's template.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Open importer
          </button>
        </div>
        {added !== null && (
          <p className="mt-3 text-sm font-semibold text-emerald-700">✓ {added} items toegevoegd aan {SHOW_TYPE_LABELS[showType]}.</p>
        )}
      </section>
    );
  }

  return (
    <section className="bg-white border border-brand-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-brand-200 bg-brand-50">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">AI rider import</div>
          <h3 className="font-bold text-ink-900 mt-0.5">Upload rider PDF</h3>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); reset(); }}
          className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1"
        >
          Sluit
        </button>
      </header>

      {!parsed && (
        <form
          action={handleSubmit}
          className="px-5 py-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1 block">Show-type voor deze rider *</span>
              <select
                value={showType}
                onChange={(e) => setShowType(e.target.value as ShowType)}
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                {SHOW_TYPES.map((st) => (
                  <option key={st} value={st}>{SHOW_TYPE_LABELS[st]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-700 mb-1 block">Rider PDF *</span>
              <input
                required
                name="rider"
                type="file"
                accept="application/pdf"
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-ink-900 file:text-white file:text-xs file:font-semibold"
              />
            </label>
          </div>
          <p className="text-[11px] text-ink-500">
            Claude Sonnet 4.6 leest de PDF en extraheert items per categorie. Splits combo-items op zodat festivals per item kunnen confirmeren.
            Vereist <code className="font-mono bg-ink-100 px-1 rounded">ANTHROPIC_API_KEY</code> in `.env.local`.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50"
          >
            {pending ? "Claude analyseert PDF…" : "Parse rider met Claude"}
          </button>
        </form>
      )}

      {parsed && (
        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="font-bold text-ink-900">{parsed.length} items geëxtraheerd</h4>
              <p className="text-xs text-ink-500 mt-0.5">Vink uit wat je niet wilt importeren. Toegevoegd aan <span className="font-bold">{SHOW_TYPE_LABELS[showType]}</span>.</p>
            </div>
            {usage && (
              <span className="text-[10px] text-ink-400 tabular-nums">
                Tokens: {usage.input}→{usage.output}{usage.cached ? ` (${usage.cached} cached)` : ""}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-ink-200 max-h-[460px] overflow-y-auto divide-y divide-ink-100">
            {TECH_SECTIONS.map((cat) => {
              const itemsForCat = parsed
                .map((item, i) => ({ item, i }))
                .filter(({ item }) => item.category === cat);
              if (itemsForCat.length === 0) return null;
              return (
                <div key={cat} className="px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500 mb-2">
                    {SECTION_LABELS[cat]} ({itemsForCat.length})
                  </div>
                  <ul className="space-y-1">
                    {itemsForCat.map(({ item, i }) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(i); else next.delete(i);
                            setSelected(next);
                          }}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink-900">
                            {item.item_description}
                            {item.is_mandatory && <span className="ml-2 text-[10px] font-bold uppercase text-red-600">mandatory</span>}
                          </div>
                          {item.artist_notes && (
                            <p className="text-[11px] text-ink-500 italic mt-0.5">{item.artist_notes}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-xs text-ink-500">
              <button
                type="button"
                onClick={() => setSelected(new Set(parsed.map((_, i) => i)))}
                className="font-semibold underline hover:text-ink-900"
              >
                Alles aan
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="font-semibold underline hover:text-ink-900"
              >
                Alles uit
              </button>
              <span className="tabular-nums">{selected.size}/{parsed.length} geselecteerd</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-100 transition"
              >
                Opnieuw
              </button>
              <button
                type="button"
                disabled={pending || selected.size === 0}
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50"
              >
                {pending ? "Bezig…" : `Importeer ${selected.size} items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
