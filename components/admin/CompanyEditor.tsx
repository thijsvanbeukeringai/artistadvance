"use client";

import { useState, useTransition } from "react";
import { updateCompanyAction } from "@/lib/actions";

export default function CompanyEditor({
  companyId,
  initialName,
  initialDropbox,
}: {
  companyId: string;
  initialName: string;
  initialDropbox: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [dropbox, setDropbox] = useState(initialDropbox ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const result = await updateCompanyAction(companyId, {
        name,
        dropbox_root_folder: dropbox,
      });
      if (result.ok) {
        setEditing(false);
        setSavedAt(Date.now());
      } else {
        setError(result.error);
      }
    });
  }

  function cancel() {
    setName(initialName);
    setDropbox(initialDropbox ?? "");
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {savedAt && Date.now() - savedAt < 2500 && (
          <span className="text-[11px] text-emerald-700 font-semibold">✓ Opgeslagen</span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Naam / Dropbox bewerken
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-ink-200 rounded-xl p-4 space-y-3">
      <div>
        <label className="text-[11px] font-semibold text-ink-700 mb-1 block">Bedrijfsnaam</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bedrijfsnaam"
          className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-ink-700 mb-1 block">Dropbox root folder (optioneel)</label>
        <input
          value={dropbox}
          onChange={(e) => setDropbox(e.target.value)}
          placeholder="/Bedrijf"
          className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 font-mono"
        />
      </div>
      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-ink-700 hover:bg-ink-100 transition disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-ink-900 text-white hover:bg-black transition disabled:opacity-50"
        >
          {pending ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
