"use client";

import { useState, useTransition } from "react";
import {
  addFestivalCrmContactAction,
  updateFestivalCrmContactAction,
  removeFestivalCrmContactAction,
} from "@/lib/actions";
import type { FestivalCRMContact } from "@/lib/types";

export default function FestivalContactsEditor({
  festivalId,
  contacts,
}: {
  festivalId: string;
  contacts: FestivalCRMContact[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !adding && (
        <div className="text-xs text-ink-500 italic">Nog geen contacten — voeg de eerste promoter/booker toe.</div>
      )}

      {contacts.map((c) => (
        <ContactRow key={c.id} contact={c} festivalId={festivalId} />
      ))}

      {adding ? (
        <AddForm
          festivalId={festivalId}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-semibold text-brand-700 hover:underline"
        >
          + Contact toevoegen
        </button>
      )}
    </div>
  );
}

function ContactRow({ contact, festivalId }: { contact: FestivalCRMContact; festivalId: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState(contact.name);
  const [role, setRole] = useState(contact.role ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [isPrimary, setIsPrimary] = useState(contact.is_primary);
  const [notes, setNotes] = useState(contact.notes ?? "");

  function save() {
    start(async () => {
      await updateFestivalCrmContactAction(contact.id, {
        name: name.trim(),
        role: role.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        is_primary: isPrimary,
        notes: notes.trim() || null,
      });
      setEditing(false);
    });
  }

  function remove() {
    if (!confirm(`Verwijder contact "${contact.name}"?`)) return;
    start(async () => {
      await removeFestivalCrmContactAction(contact.id, festivalId);
    });
  }

  if (editing) {
    return (
      <div className="bg-white border border-ink-200 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam" className={cls} />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Rol (bv. Promoter, Booker)" className={cls} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." className={cls} type="email" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 ..." className={cls} />
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notities (bv. eerder gewerkt met X, vraagt altijd Y)" className={`${cls} min-h-[60px]`} />
        <label className="flex items-center gap-2 text-xs text-ink-700">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          Primair contact
        </label>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
          <button type="button" onClick={save} disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">
            {pending ? "..." : "Opslaan"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink-900">{contact.name}</span>
          {contact.is_primary && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">Primary</span>
          )}
          {contact.role && (
            <span className="text-[11px] text-ink-500">· {contact.role}</span>
          )}
        </div>
        {(contact.email || contact.phone) && (
          <div className="text-[12px] text-ink-600 mt-0.5">
            {[contact.email, contact.phone].filter(Boolean).join(" · ")}
          </div>
        )}
        {contact.notes && (
          <div className="text-[11px] text-ink-500 mt-1 italic">{contact.notes}</div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={pending}
          className="p-1.5 rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-50"
          title="Bewerk"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="p-1.5 rounded text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Verwijder"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AddForm({ festivalId, onDone }: { festivalId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    start(async () => {
      const result = await addFestivalCrmContactAction(festivalId, formData);
      if (result.ok) {
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="bg-white border-2 border-dashed border-brand-300 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input name="name" placeholder="Naam *" required className={cls} />
        <input name="role" placeholder="Rol (bv. Promoter, Booker)" className={cls} />
        <input name="email" type="email" placeholder="email@..." className={cls} />
        <input name="phone" placeholder="+31 ..." className={cls} />
      </div>
      <textarea name="notes" placeholder="Notities" className={`${cls} min-h-[60px]`} />
      <label className="flex items-center gap-2 text-xs text-ink-700">
        <input type="checkbox" name="is_primary" />
        Primair contact
      </label>
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">
          {pending ? "..." : "Toevoegen"}
        </button>
      </div>
    </form>
  );
}

const cls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
