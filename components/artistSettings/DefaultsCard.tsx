"use client";

import { useState, useTransition } from "react";

export type FieldKind = "text" | "number" | "checkbox" | "select" | "textarea";

export interface DefaultField<K extends string = string> {
  key: K;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: { value: string; label: string }[];
  cols?: 1 | 2 | 3;
  hint?: string;
}

export default function DefaultsCard<T extends Record<string, any>>({
  title,
  description,
  defaults,
  fields,
  onSave,
}: {
  title: string;
  description: string;
  defaults: Partial<T>;
  fields: DefaultField<Extract<keyof T, string>>[];
  onSave: (patch: Partial<T>) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [values, setValues] = useState<Partial<T>>(defaults);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function setField(key: string, value: any) {
    setValues((v) => ({ ...v, [key]: value }) as Partial<T>);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await onSave(values);
      if (!r.ok) { setErr(r.error ?? "Opslaan mislukt"); return; }
      setSavedAt(Date.now());
    });
  }

  const filledCount = Object.values(values).filter((v) => v !== undefined && v !== null && v !== "" && v !== false).length;

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500 mt-0.5">{description}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
          {filledCount} velden ingevuld
        </span>
      </header>
      <form onSubmit={save} className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map((f) => (
            <div key={f.key} className={f.cols === 3 ? "lg:col-span-3" : f.cols === 2 ? "md:col-span-2 lg:col-span-2" : ""}>
              <FieldInput field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)} />
            </div>
          ))}
        </div>
        {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-1">
          {savedAt && Date.now() - savedAt < 2500 && <span className="text-[11px] text-emerald-700 font-semibold">✓ Opgeslagen</span>}
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50"
          >
            {pending ? "Opslaan..." : "Defaults opslaan"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FieldInput({ field, value, onChange }: { field: DefaultField; value: any; onChange: (v: any) => void }) {
  const base = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
  const label = (
    <span className="text-[11px] font-semibold text-ink-700 mb-1 block">{field.label}</span>
  );
  switch (field.kind) {
    case "text":
      return (
        <label className="block">
          {label}
          <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} placeholder={field.placeholder} className={base} />
          {field.hint && <span className="text-[10px] text-ink-400 mt-0.5 block">{field.hint}</span>}
        </label>
      );
    case "number":
      return (
        <label className="block">
          {label}
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder}
            className={base}
          />
          {field.hint && <span className="text-[10px] text-ink-400 mt-0.5 block">{field.hint}</span>}
        </label>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm text-ink-700 py-1.5">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked || undefined)} className="rounded" />
          {field.label}
        </label>
      );
    case "select":
      return (
        <label className="block">
          {label}
          <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className={base}>
            <option value="">- Niet ingesteld -</option>
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      );
    case "textarea":
      return (
        <label className="block">
          {label}
          <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder={field.placeholder}
            rows={3}
            className={`${base} resize-y`}
          />
          {field.hint && <span className="text-[10px] text-ink-400 mt-0.5 block">{field.hint}</span>}
        </label>
      );
  }
}
