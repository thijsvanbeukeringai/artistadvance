"use client";

import { useState, useTransition } from "react";
import {
  addBookingContactAction,
  removeBookingContactAction,
  updateBookingContactAction,
  createBookingContactInCrmAction,
} from "@/lib/actions";
import type { BookingContact, BookingContactRole, FestivalCRMContact } from "@/lib/types";

const ROLE_LABELS: Record<BookingContactRole, string> = {
  promoter: "Promoter",
  talent_buyer: "Talent buyer",
  production_manager: "Production manager",
  stage_manager: "Stage manager",
  payment_contact: "Payment contact",
  local_runner: "Local runner",
  hospitality_contact: "Hospitality contact",
  other: "Anders",
};

export default function BookingContactsEditor({
  bookingId,
  festivalId,
  bookingContacts,
  festivalContacts,
}: {
  bookingId: string;
  festivalId: string;
  bookingContacts: BookingContact[];
  festivalContacts: FestivalCRMContact[];
}) {
  const [pickMode, setPickMode] = useState<"closed" | "existing" | "new">("closed");

  const linked = new Set(bookingContacts.map((bc) => bc.festival_crm_contact_id));
  const available = festivalContacts.filter((c) => !linked.has(c.id));

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-3 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-ink-900 text-sm">Contacten voor deze booking</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">Promoter, buyer, production. Nieuwe contacten worden ook in de festival-CRM opgeslagen.</p>
        </div>
      </header>
      <div className="p-5 space-y-3">
        {bookingContacts.length === 0 && pickMode === "closed" && (
          <div className="text-xs text-ink-500 italic">Nog geen contacten gekoppeld aan deze booking.</div>
        )}
        {bookingContacts.map((bc) => {
          const crm = festivalContacts.find((c) => c.id === bc.festival_crm_contact_id);
          if (!crm) return null;
          return <LinkedRow key={bc.id} bc={bc} crm={crm} bookingId={bookingId} />;
        })}

        {pickMode === "closed" && (
          <div className="flex items-center gap-2 pt-1">
            {available.length > 0 && (
              <button
                type="button"
                onClick={() => setPickMode("existing")}
                className="text-xs font-semibold text-brand-700 hover:bg-brand-50 px-2.5 py-1.5 rounded-md transition"
              >
                + Uit CRM ({available.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setPickMode("new")}
              className="text-xs font-semibold text-ink-700 hover:bg-ink-100 px-2.5 py-1.5 rounded-md transition"
            >
              + Nieuwe contact
            </button>
          </div>
        )}

        {pickMode === "existing" && (
          <PickExistingPanel
            bookingId={bookingId}
            available={available}
            onClose={() => setPickMode("closed")}
          />
        )}

        {pickMode === "new" && (
          <NewContactPanel
            bookingId={bookingId}
            festivalId={festivalId}
            onClose={() => setPickMode("closed")}
          />
        )}
      </div>
    </section>
  );
}

function LinkedRow({ bc, crm, bookingId }: { bc: BookingContact; crm: FestivalCRMContact; bookingId: string }) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState<BookingContactRole>(bc.role);
  const [isPrimary, setIsPrimary] = useState(bc.is_primary);

  function update(patch: { role?: BookingContactRole; is_primary?: boolean }) {
    start(async () => {
      await updateBookingContactAction(bc.id, bookingId, patch);
    });
  }

  function remove() {
    if (!confirm(`Verwijder contact "${crm.name}" van deze booking? (Het blijft wel in de CRM staan.)`)) return;
    start(async () => {
      await removeBookingContactAction(bc.id, bookingId);
    });
  }

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-3 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink-900">{crm.name}</span>
          {isPrimary && <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">Primary</span>}
        </div>
        {(crm.email || crm.phone) && (
          <div className="text-[12px] text-ink-600 mt-0.5">{[crm.email, crm.phone].filter(Boolean).join(" · ")}</div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          value={role}
          onChange={(e) => {
            const next = e.target.value as BookingContactRole;
            setRole(next);
            update({ role: next });
          }}
          disabled={pending}
          className="text-xs px-2 py-1 rounded border border-ink-200 bg-white"
        >
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="flex items-center gap-1 text-[11px] text-ink-700">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => {
              setIsPrimary(e.target.checked);
              update({ is_primary: e.target.checked });
            }}
            disabled={pending}
          />
          primary
        </label>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="p-1.5 rounded text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Verwijder van booking"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function PickExistingPanel({ bookingId, available, onClose }: { bookingId: string; available: FestivalCRMContact[]; onClose: () => void }) {
  const [pending, start] = useTransition();
  function add(contactId: string) {
    start(async () => {
      await addBookingContactAction(bookingId, {
        festival_crm_contact_id: contactId,
        role: "promoter",
        is_primary: false,
      });
      onClose();
    });
  }

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-brand-900">Kies een contact uit de festival-CRM</div>
        <button type="button" onClick={onClose} className="text-[11px] text-ink-500 hover:text-ink-900">Sluiten</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {available.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => add(c.id)}
            disabled={pending}
            className="text-left bg-white border border-ink-200 rounded-md p-2.5 hover:border-brand-400 hover:shadow-card transition disabled:opacity-50"
          >
            <div className="font-semibold text-ink-900 text-sm">{c.name}</div>
            {c.role && <div className="text-[11px] text-ink-500">{c.role}</div>}
            {(c.email || c.phone) && (
              <div className="text-[11px] text-ink-600 mt-1">{[c.email, c.phone].filter(Boolean).join(" · ")}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function NewContactPanel({ bookingId, festivalId, onClose }: { bookingId: string; festivalId: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await createBookingContactInCrmAction(bookingId, festivalId, {
        name: String(formData.get("name") || ""),
        role: String(formData.get("crm_role") || ""),
        email: String(formData.get("email") || "") || null,
        phone: String(formData.get("phone") || "") || null,
        is_primary: formData.get("is_primary") === "on",
        notes: String(formData.get("notes") || "") || null,
        booking_role: String(formData.get("booking_role") || "promoter"),
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <form action={submit} className="bg-brand-50 border border-brand-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-brand-900">Nieuwe contact + opslaan in CRM</div>
        <button type="button" onClick={onClose} className="text-[11px] text-ink-500 hover:text-ink-900">Sluiten</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input name="name" placeholder="Naam *" required className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm" />
        <input name="crm_role" placeholder="Functie in CRM (bv. Booker)" className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm" />
        <input name="email" type="email" placeholder="email@..." className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm" />
        <input name="phone" placeholder="+31 ..." className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm" />
        <select name="booking_role" defaultValue="promoter" className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm bg-white">
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>Rol op booking: {v}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-ink-700">
          <input type="checkbox" name="is_primary" />
          Primair contact (CRM + booking)
        </label>
      </div>
      <textarea name="notes" placeholder="Notities (eerder gewerkt, voorkeuren, ...)" className="w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm min-h-[60px]" />
      {error && <div className="text-xs text-red-700">{error}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} disabled={pending} className="text-xs text-ink-700 hover:bg-ink-100 px-2 py-1 rounded disabled:opacity-50">Annuleren</button>
        <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50">
          {pending ? "Opslaan..." : "Toevoegen + sync naar CRM"}
        </button>
      </div>
    </form>
  );
}
