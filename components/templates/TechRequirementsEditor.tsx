"use client";

import { useState, useTransition } from "react";
import {
  addTechRequirementAction,
  removeTechRequirementAction,
  updateTechRequirementAction,
  addCustomTechCategoryAction,
  removeCustomTechCategoryAction,
} from "@/lib/actions";
import { SECTION_LABELS, SHOW_TYPE_LABELS, TECH_SECTIONS } from "@/lib/data";
import type { ArtistCustomTechCategory, ArtistTechRequirement, ShowType, TechCategory } from "@/lib/types";

const SHOW_TYPES: ShowType[] = ["festival", "club", "full_production", "ldjv", "venue", "corporate", "private"];

export default function TechRequirementsEditor({
  artistId,
  requirements,
  customCategories = [],
}: {
  artistId: string;
  requirements: ArtistTechRequirement[];
  customCategories?: ArtistCustomTechCategory[];
}) {
  const [activeShowType, setActiveShowType] = useState<ShowType>("festival");
  const [adding, setAdding] = useState(false);
  const [managingCats, setManagingCats] = useState(false);

  // Alle category keys + labels (built-in + custom)
  const allCategories: { key: string; label: string; custom?: ArtistCustomTechCategory }[] = [
    ...TECH_SECTIONS.map((c) => ({ key: c as string, label: SECTION_LABELS[c] })),
    ...customCategories.map((c) => ({ key: c.key, label: c.label, custom: c })),
  ];

  const reqsForType = requirements.filter((r) => r.show_type === activeShowType);
  const grouped = new Map<string, ArtistTechRequirement[]>();
  for (const c of allCategories) grouped.set(c.key, []);
  for (const r of reqsForType) {
    if (!grouped.has(r.category)) grouped.set(r.category, []);
    grouped.get(r.category)!.push(r);
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-ink-900">Standaard tech requirements</h3>
            <p className="text-xs text-ink-500 mt-1">
              Items die het festival per booking moet bevestigen (PLEASE CONFIRM). Worden gekloond naar elke nieuwe advancing op dit show-type.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManagingCats((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-ink-700 text-xs font-semibold hover:bg-ink-100 transition"
            >
              {managingCats ? "Sluit" : "Categorieën"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-black transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
              Item toevoegen
            </button>
          </div>
        </div>

        {/* Show-type tabs */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto -mx-1 px-1">
          {SHOW_TYPES.map((st) => {
            const count = requirements.filter((r) => r.show_type === st).length;
            const active = activeShowType === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setActiveShowType(st)}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap",
                  active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100",
                ].join(" ")}
              >
                {SHOW_TYPE_LABELS[st]}
                <span className={`tabular-nums ${active ? "text-ink-200" : "text-ink-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      {managingCats && (
        <CategoriesManager
          artistId={artistId}
          customCategories={customCategories}
          onClose={() => setManagingCats(false)}
        />
      )}

      {adding && (
        <AddRequirementForm
          artistId={artistId}
          showType={activeShowType}
          categories={allCategories}
          onClose={() => setAdding(false)}
        />
      )}

      {reqsForType.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-ink-500">
          Geen items voor <span className="font-bold">{SHOW_TYPE_LABELS[activeShowType]}</span>. Voeg items toe - bv. "4x CDJ3000", "GrandMA3 console MODE 3".
        </div>
      ) : (
        <div className="divide-y divide-ink-200">
          {allCategories.map((cat) => {
            const items = grouped.get(cat.key) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={cat.key} className="px-5 py-4">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-ink-500 mb-2">
                  {cat.label} ({items.length})
                  {cat.custom && (
                    <span className="ml-2 text-[9px] font-bold uppercase bg-brand-100 text-brand-700 px-1 py-0.5 rounded">custom</span>
                  )}
                </h4>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <RequirementRow key={item.id} artistId={artistId} item={item} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AddRequirementForm({
  artistId,
  showType,
  categories,
  onClose,
}: {
  artistId: string;
  showType: ShowType;
  categories: { key: string; label: string }[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => {
        fd.set("show_type", showType);
        startTransition(async () => {
          await addTechRequirementAction(artistId, fd);
          onClose();
        });
      }}
      className="px-5 py-4 bg-brand-50 border-b border-brand-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
    >
      <Field label="Categorie" cols={3}>
        <select name="category" defaultValue={categories[0]?.key ?? "dj_gear"} required className="input">
          {categories.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Item omschrijving *" cols={5}>
        <input required name="item_description" placeholder="Bijv. '4x CDJ3000' of 'GrandMA3 MODE 3'" className="input" />
      </Field>
      <Field label="Artist note (optioneel)" cols={3}>
        <input name="notes" placeholder="'NOT directly in mixer'" className="input" />
      </Field>
      <label className="md:col-span-1 inline-flex items-center gap-2 cursor-pointer pb-2">
        <input type="checkbox" name="is_mandatory" />
        <span className="text-xs font-semibold text-ink-700">Mandatory</span>
      </label>

      <div className="md:col-span-12 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50">
          {pending ? "Bezig…" : "Toevoegen"}
        </button>
      </div>

      <style>{`
        .input { width:100%; background:white; border:1px solid #e3e6eb; border-radius:8px; padding:8px 12px; font-size:13px; color:#0f1115; outline:none; transition: border-color 150ms, box-shadow 150ms; }
        .input:focus { border-color:#ffa66e; box-shadow:0 0 0 3px rgba(255,166,110,0.35); }
      `}</style>
    </form>
  );
}

function RequirementRow({ artistId, item }: { artistId: string; item: ArtistTechRequirement }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(item.item_description);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [mandatory, setMandatory] = useState(item.is_mandatory);

  function save() {
    startTransition(async () => {
      await updateTechRequirementAction(item.id, artistId, {
        item_description: desc,
        notes: notes || undefined,
        is_mandatory: mandatory,
      });
      setEditing(false);
    });
  }

  function remove() {
    if (!confirm(`Item "${item.item_description}" verwijderen?`)) return;
    startTransition(async () => {
      await removeTechRequirementAction(item.id, artistId);
    });
  }

  if (editing) {
    return (
      <li className="bg-ink-50 rounded-md p-3 flex items-end gap-2 flex-wrap">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="flex-1 min-w-[200px] bg-white border border-ink-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note"
          className="flex-1 min-w-[150px] bg-white border border-ink-200 rounded-md px-2 py-1.5 text-xs italic focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <label className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700">
          <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
          Mandatory
        </label>
        <button onClick={() => setEditing(false)} className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1">Annuleer</button>
        <button onClick={save} disabled={pending} className="bg-ink-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-black transition disabled:opacity-50">
          {pending ? "Bezig…" : "Opslaan"}
        </button>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 px-2 py-1.5 -mx-2 rounded-md hover:bg-ink-50 transition">
      <span className={item.is_mandatory ? "text-red-600 font-bold mt-0.5" : "text-ink-300 mt-0.5"}>•</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink-900">
          {item.item_description}
          {item.is_mandatory && <span className="ml-2 text-[10px] font-bold uppercase text-red-600">mandatory</span>}
        </div>
        {item.notes && <p className="text-[11px] text-ink-500 italic mt-0.5">{item.notes}</p>}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
        <button onClick={() => setEditing(true)} disabled={pending} className="text-[11px] text-ink-700 font-semibold px-2 py-1 rounded hover:bg-white hover:text-brand-700 transition">
          Bewerk
        </button>
        <button onClick={remove} disabled={pending} className="text-[11px] text-red-600 font-semibold px-2 py-1 rounded hover:bg-white transition">
          Verwijder
        </button>
      </div>
    </li>
  );
}

function Field({ label, children, cols = 4 }: { label: string; children: React.ReactNode; cols?: number }) {
  return (
    <label className={`md:col-span-${cols} block`}>
      <span className="text-[11px] font-semibold text-ink-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function CategoriesManager({
  artistId,
  customCategories,
  onClose,
}: {
  artistId: string;
  customCategories: ArtistCustomTechCategory[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!label.trim()) return;
    startTransition(async () => {
      const r = await addCustomTechCategoryAction(artistId, label.trim());
      if (!r.ok) setErr(r.error ?? "Toevoegen faalde");
      else setLabel("");
    });
  }

  function remove(id: string, lbl: string) {
    if (!confirm(`Categorie "${lbl}" verwijderen? Bestaande items in deze categorie blijven bestaan.`)) return;
    startTransition(async () => {
      await removeCustomTechCategoryAction(artistId, id);
    });
  }

  return (
    <div className="px-5 py-4 bg-ink-50 border-b border-ink-200 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-bold text-ink-900 text-sm">Custom categorieën</h4>
          <p className="text-xs text-ink-500 mt-0.5">
            Voeg eigen categorieën toe bovenop de standaard 12. Verschijnen in de dropdown bij &quot;Item toevoegen&quot;
            en in de PLEASE CONFIRM lijst van het festival.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1">Sluit</button>
      </div>

      <form onSubmit={add} className="flex items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Bv. 'Crew catering', 'Pyrotechniek'"
          className="flex-1 bg-white border border-ink-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <button
          type="submit"
          disabled={pending || !label.trim()}
          className="text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-black transition font-semibold disabled:opacity-50"
        >
          Toevoegen
        </button>
      </form>

      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">{err}</div>}

      {customCategories.length === 0 ? (
        <div className="text-xs text-ink-400 italic">Nog geen custom categorieën.</div>
      ) : (
        <ul className="space-y-1">
          {customCategories.map((c) => (
            <li key={c.id} className="flex items-center justify-between bg-white border border-ink-200 rounded-md px-3 py-1.5">
              <div>
                <span className="text-sm font-semibold text-ink-900">{c.label}</span>
                <span className="ml-2 text-[10px] font-mono text-ink-400">{c.key}</span>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(c.id, c.label)}
                className="text-[11px] text-red-700 font-semibold hover:underline disabled:opacity-50"
              >
                Verwijder
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
