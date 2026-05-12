"use client";

import { useState, useTransition } from "react";
import {
  addArtistCrewAction,
  updateArtistCrewAction,
  removeArtistCrewAction,
} from "@/lib/actions";
import { CREW_ROLE_LABELS } from "@/lib/data";
import type { ArtistCrew, CrewRole } from "@/lib/types";

const ROLES: CrewRole[] = ["pm", "tm", "tm2", "foh", "ld", "vj", "bl", "media1", "media2", "vi", "sfx", "laser", "makeup", "mgmt", "artist", "other"];

export default function CrewDefaultsEditor({
  artistId,
  crew,
}: {
  artistId: string;
  crew: ArtistCrew[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-ink-900">Vaste crew</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Crewleden die standaard meereizen. <span className="font-semibold text-emerald-700">Default-leden</span> worden automatisch toegevoegd aan elke nieuwe booking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded-md font-semibold transition ${adding ? "bg-ink-100 text-ink-700" : "bg-ink-900 text-white hover:bg-black"}`}
        >
          {adding ? "Annuleer" : "+ Crew lid toevoegen"}
        </button>
      </header>

      {adding && <AddCrewForm artistId={artistId} onDone={() => setAdding(false)} />}

      {crew.length === 0 ? (
        <div className="px-5 py-8 text-sm text-ink-500 text-center">
          Nog geen vaste crew. Klik op "+ Crew lid toevoegen".
        </div>
      ) : (
        <ul className="divide-y divide-ink-200">
          {crew.map((c) => (
            <CrewRow key={c.id} member={c} artistId={artistId} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CrewRow({ member, artistId }: { member: ArtistCrew; artistId: string }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <EditCrewForm member={member} artistId={artistId} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className={`px-5 py-3 flex items-center gap-3 ${pending ? "opacity-50" : ""}`}>
      <span className="text-[10px] font-bold uppercase bg-ink-900 text-white px-2 py-1 rounded w-12 text-center flex-shrink-0">{member.role.toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-ink-900">{member.name}</div>
        <div className="text-[11px] text-ink-500">
          {CREW_ROLE_LABELS[member.role]}
          {(member.email || member.phone) && (
            <span>{" · "}{[member.email, member.phone].filter(Boolean).join(" · ")}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await updateArtistCrewAction(member.id, artistId, { is_default: !member.is_default }); })}
        className={`text-[11px] px-2 py-1 rounded-md font-semibold transition ${
          member.is_default
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-ink-100 text-ink-500 hover:bg-ink-200"
        }`}
        title={member.is_default ? "Default voor nieuwe shows - klik om uit te zetten" : "Niet default - klik om aan te zetten"}
      >
        {member.is_default ? "✓ Default" : "Optioneel"}
      </button>

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[11px] font-semibold text-ink-700 hover:text-ink-900 hover:underline"
      >
        Bewerk
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`${member.name} verwijderen uit vaste crew?`)) return;
          start(async () => { await removeArtistCrewAction(member.id, artistId); });
        }}
        className="text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-50"
      >
        Verwijder
      </button>
    </li>
  );
}

function AddCrewForm({ artistId, onDone }: { artistId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      role: String(fd.get("role") || "tm") as CrewRole,
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim() || undefined,
      phone: String(fd.get("phone") || "").trim() || undefined,
      is_default: fd.get("is_default") === "on",
    };
    start(async () => {
      const r = await addArtistCrewAction(artistId, payload);
      if (r && !r.ok) { setErr(r.error ?? "Toevoegen mislukt"); return; }
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="px-5 py-4 bg-ink-50/40 border-b border-ink-200 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Rol *">
          <select name="role" required defaultValue="tm" className={cls}>
            {ROLES.map((r) => <option key={r} value={r}>{r.toUpperCase()} - {CREW_ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Naam *">
          <input name="name" required placeholder="Voor- en achternaam" className={cls} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" placeholder="naam@example.com" className={cls} />
        </Field>
        <Field label="Telefoon">
          <input name="phone" placeholder="+31 6 ..." className={cls} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="is_default" defaultChecked className="rounded" />
        Default voor nieuwe shows (wordt automatisch in touring party gezet)
      </label>
      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50">
          {pending ? "Bezig..." : "Crew lid toevoegen"}
        </button>
      </div>
    </form>
  );
}

function EditCrewForm({ member, artistId, onDone }: { member: ArtistCrew; artistId: string; onDone: () => void }) {
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patch = {
      role: String(fd.get("role") || member.role) as CrewRole,
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim() || null,
      phone: String(fd.get("phone") || "").trim() || null,
      is_default: fd.get("is_default") === "on",
    };
    start(async () => {
      await updateArtistCrewAction(member.id, artistId, patch);
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="px-5 py-4 bg-amber-50/30 border-b border-amber-100 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Rol *">
          <select name="role" required defaultValue={member.role} className={cls}>
            {ROLES.map((r) => <option key={r} value={r}>{r.toUpperCase()} - {CREW_ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Naam *">
          <input name="name" required defaultValue={member.name} className={cls} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={member.email ?? ""} className={cls} />
        </Field>
        <Field label="Telefoon">
          <input name="phone" defaultValue={member.phone ?? ""} className={cls} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="is_default" defaultChecked={member.is_default} className="rounded" />
        Default voor nieuwe shows
      </label>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-md border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50">
          {pending ? "Opslaan..." : "Update crew lid"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}

const cls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
