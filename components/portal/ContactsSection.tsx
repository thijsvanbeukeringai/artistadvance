"use client";

import { useState, useTransition } from "react";
import { addArtistContactAction, removeArtistContactAction } from "@/lib/actions";
import type { ContactPerson } from "@/lib/types";

const ROLE_OPTIONS = [
  "Tour Manager",
  "Production Manager",
  "FOH Engineer",
  "Monitor Engineer",
  "Lighting Director",
  "DJ / Artiest",
  "Artiest Assistent",
  "Agent / Booker",
  "VJ / Visual Operator",
  "Overig",
];

export default function ContactsSection({
  token,
  contacts,
}: {
  token: string;
  contacts: ContactPerson[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Contactpersonen artiest ({contacts.length})</h3>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            Contact toevoegen
          </button>
        </header>

        {contacts.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-500">Nog geen contactpersonen toegevoegd.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {contacts.map((c) => (
              <li key={c.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-ink-100 grid place-items-center text-ink-700 font-bold flex-shrink-0">
                  {c.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900 truncate">{c.name}</span>
                    {c.is_onsite && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">on-site</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500 truncate">
                    {c.role}
                    {c.phone ? ` · ${c.phone}` : ""}
                    {c.email ? ` · ${c.email}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => removeArtistContactAction(token, c.id))}
                  className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
                >
                  Verwijder
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {adding && (
        <form
          action={(fd) => {
            startTransition(async () => {
              await addArtistContactAction(token, fd);
              setAdding(false);
            });
          }}
          className="bg-white border border-brand-200 rounded-2xl shadow-card p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Naam *">
              <input required name="name" className="input" placeholder="Voor- en achternaam" />
            </Field>
            <Field label="Rol">
              <select name="role" className="input" defaultValue="Tour Manager">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Telefoon">
              <input name="phone" className="input" placeholder="+31 6 …" />
            </Field>
            <Field label="E-mail">
              <input type="email" name="email" className="input" placeholder="naam@domein.nl" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="is_onsite" defaultChecked />
            Aanwezig op locatie
          </label>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-100 transition"
            >
              Annuleer
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-60"
            >
              {pending ? "Opslaan…" : "Toevoegen"}
            </button>
          </div>

          <style>{`
            .input {
              width: 100%;
              background: white;
              border: 1px solid #e3e6eb;
              border-radius: 8px;
              padding: 10px 12px;
              font-size: 14px;
              color: #0f1115;
              outline: none;
              transition: border-color 150ms, box-shadow 150ms;
            }
            .input:focus {
              border-color: #ffa66e;
              box-shadow: 0 0 0 3px rgba(255,166,110,0.35);
            }
          `}</style>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
