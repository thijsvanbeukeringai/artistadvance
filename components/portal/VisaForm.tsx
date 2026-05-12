"use client";

import { useState, useTransition } from "react";
import { addVisaCrewAction, setVisaAction, setVisaCrewStatusAction } from "@/lib/actions";
import type { AdvancingVisa, AdvancingVisaCrew, VisaStatus } from "@/lib/types";

const STATUS_OPTIONS: VisaStatus[] = ["not_needed", "pending", "applied", "approved", "denied"];

const STATUS_TONE: Record<VisaStatus, string> = {
  not_needed: "bg-ink-100 text-ink-500",
  pending: "bg-amber-50 text-amber-700",
  applied: "bg-sky-50 text-sky-700",
  approved: "bg-emerald-50 text-emerald-700",
  denied: "bg-red-50 text-red-700",
};

export default function VisaForm({
  token,
  visa,
  crew,
}: {
  token: string;
  visa: AdvancingVisa | null;
  crew: AdvancingVisaCrew[];
}) {
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState({
    visa_required: visa?.visa_required ?? false,
    work_permit_required: visa?.work_permit_required ?? false,
    visa_type: visa?.visa_type ?? "",
    deadline: visa?.deadline ?? "",
    notes: visa?.notes ?? "",
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  function save() {
    startTransition(async () => {
      await setVisaAction(token, data as any);
      setSavedAt(new Date().toLocaleTimeString("nl-NL"));
    });
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <header className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink-900">Visa eisen</h3>
          <div className="flex items-center gap-2">
            {savedAt && <span className="text-[11px] text-emerald-700">Opgeslagen {savedAt}</span>}
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="bg-ink-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-black transition disabled:opacity-50"
            >
              {pending ? "Bezig…" : "Opslaan"}
            </button>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle label="Visa nodig" value={data.visa_required} onChange={(v) => setData({ ...data, visa_required: v })} />
          <Toggle label="Work permit nodig" value={data.work_permit_required} onChange={(v) => setData({ ...data, work_permit_required: v })} />
          <Field label="Visa type">
            <input
              value={data.visa_type}
              onChange={(e) => setData({ ...data, visa_type: e.target.value })}
              placeholder="Schengen short stay"
              className="input"
              disabled={!data.visa_required}
            />
          </Field>
          <Field label="Aanvraag deadline">
            <input
              type="date"
              value={data.deadline}
              onChange={(e) => setData({ ...data, deadline: e.target.value })}
              className="input"
              disabled={!data.visa_required}
            />
          </Field>
          <Field label="Notities" cols={2}>
            <textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              rows={2}
              className="input"
              placeholder="Bijv. 'Schengen voor non-EU crew'"
            />
          </Field>
        </div>
      </section>

      {data.visa_required && (
        <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
            <h3 className="font-bold text-ink-900">Visa status per crewlid ({crew.length})</h3>
            <button
              type="button"
              onClick={() => setAdding(!adding)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-black transition"
            >
              {adding ? "Annuleer" : "Crewlid toevoegen"}
            </button>
          </header>
          {adding && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  await addVisaCrewAction(token, fd);
                  setNewName("");
                  setAdding(false);
                });
              }}
              className="px-5 py-4 bg-ink-50 flex items-end gap-2 border-b border-ink-200"
            >
              <Field label="Naam">
                <input required name="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="Voor- en achternaam" />
              </Field>
              <Field label="Status">
                <select name="status" defaultValue="pending" className="input">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <button type="submit" className="bg-ink-900 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-black transition">Toevoegen</button>
            </form>
          )}
          {crew.length === 0 ? (
            <div className="px-5 py-8 text-sm text-ink-500 text-center">Voeg crewleden toe waarvoor visa-status bijgehouden moet worden.</div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {crew.map((c) => (
                <CrewRow key={c.id} token={token} entry={c} />
              ))}
            </ul>
          )}
        </section>
      )}

      <style>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid #e3e6eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #0f1115;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .input:focus {
          border-color: #ffa66e;
          box-shadow: 0 0 0 3px rgba(255,166,110,0.35);
        }
        .input:disabled { background: #f3f5f8; color: #8a92a0; }
      `}</style>
    </div>
  );
}

function CrewRow({ token, entry }: { token: string; entry: AdvancingVisaCrew }) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="px-5 py-3 flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-ink-900">{entry.name}</span>
      <select
        value={entry.status}
        onChange={(e) => {
          const status = e.target.value as VisaStatus;
          startTransition(async () => {
            await setVisaCrewStatusAction(token, entry.id, status);
          });
        }}
        disabled={pending}
        className={`text-[11px] font-bold uppercase px-2 py-1 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-brand-300 ${STATUS_TONE[entry.status]}`}
      >
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </li>
  );
}

function Field({ label, children, cols = 1 }: { label: string; children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <label className={`block ${cols === 2 ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-ink-700 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 bg-ink-50 rounded-lg px-3 py-2.5">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition relative flex-shrink-0 ${value ? "bg-brand-500" : "bg-ink-200"}`}
        aria-pressed={value}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}
