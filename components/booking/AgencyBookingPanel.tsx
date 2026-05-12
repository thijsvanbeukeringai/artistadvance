"use client";

import { useMemo, useState, useTransition } from "react";
import { createBookingAction, addFestivalCrmContactAction } from "@/lib/actions";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import type { Festival, FestivalCRMContact, Stage, ShowType } from "@/lib/types";

type ArtistOption = { id: string; name: string };

export default function AgencyBookingPanel({
  artists,
  festivals,
  stages,
  festivalContacts = [],
  defaultDate,
  openByDefault,
  onCreated,
}: {
  artists: ArtistOption[];
  festivals: Festival[];
  stages: Stage[];
  festivalContacts?: FestivalCRMContact[];
  defaultDate?: string;
  openByDefault?: boolean;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(!!openByDefault);
  const [artistId, setArtistId] = useState("");
  const [festivalId, setFestivalId] = useState("");
  const [stageId, setStageId] = useState("");
  const [showType, setShowType] = useState<ShowType>("festival");
  const [date, setDate] = useState(defaultDate ?? "");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [fee, setFee] = useState("");
  const [contractStatus, setContractStatus] = useState("");
  const [contactId, setContactId] = useState("");
  const [showNewContact, setShowNewContact] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<{ time: number; artistName: string } | null>(null);

  const stagesForFestival = useMemo(
    () => stages.filter((s) => s.festival_id === festivalId),
    [stages, festivalId]
  );

  const contactsForFestival = useMemo(
    () => festivalContacts.filter((c) => c.festival_id === festivalId),
    [festivalContacts, festivalId]
  );

  function reset(keepArtist = false) {
    if (!keepArtist) setArtistId("");
    setFestivalId("");
    setStageId("");
    setShowType("festival");
    setDate("");
    setTime("");
    setDuration("");
    setFee("");
    setContractStatus("");
    setContactId("");
    setShowNewContact(false);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!artistId) {
      setError("Kies eerst een artiest.");
      return;
    }
    if (!festivalId || !stageId || !date) {
      setError("Festival, stage en datum zijn verplicht.");
      return;
    }
    const artistName = artists.find((a) => a.id === artistId)?.name ?? "Artiest";
    start(async () => {
      const fd = new FormData();
      fd.set("festival_id", festivalId);
      fd.set("stage_id", stageId);
      fd.set("show_type", showType);
      fd.set("show_date", date);
      if (time) fd.set("show_time", time);
      if (duration) fd.set("set_duration_minutes", duration);
      if (fee) fd.set("fee", fee);
      if (contractStatus) fd.set("contract_status", contractStatus);
      if (contactId) fd.set("contact_id", contactId);
      const result = await createBookingAction(artistId, fd);
      if (result.ok) {
        setSavedAt({ time: Date.now(), artistName });
        reset(true);
        if (onCreated) onCreated();
      } else {
        setError(result.error);
      }
    });
  }

  if (artists.length === 0) {
    return (
      <div className="rounded-xl bg-ink-50 border border-ink-200 px-4 py-3 text-xs text-ink-500">
        Voeg eerst een artiest toe aan dit bedrijf voordat je boekingen kunt maken.
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-bold text-ink-900">Nieuwe boeking voor een artiest</h4>
          <p className="text-[11px] text-ink-500 mt-0.5">
            Maak een booking voor één van de {artists.length} artiesten in dit bedrijf. Begint als draft — bevestigen start automatisch de advancing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && Date.now() - savedAt.time < 4000 && (
            <span className="text-[11px] text-emerald-700 font-semibold">✓ Booking voor {savedAt.artistName} aangemaakt</span>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-900 text-white text-xs font-semibold hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nieuwe boeking
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-ink-900">Nieuwe boeking</h4>
          <p className="text-[11px] text-ink-500 mt-0.5">Begint als draft. Bevestigen start automatisch de advancing.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={pending}
          className="text-xs text-ink-500 hover:text-ink-900 px-2 py-1 rounded disabled:opacity-50"
        >
          Sluiten
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Artiest *</span>
          <select
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none bg-white"
            required
          >
            <option value="">— Kies artiest —</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Festival *</span>
          <select
            value={festivalId}
            onChange={(e) => {
              setFestivalId(e.target.value);
              setStageId("");
            }}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none bg-white"
            required
          >
            <option value="">— Kies festival —</option>
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.location})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Stage *</span>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            disabled={!festivalId}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none bg-white disabled:bg-ink-50 disabled:text-ink-400"
            required
          >
            <option value="">{festivalId ? "— Kies stage —" : "Kies eerst festival"}</option>
            {stagesForFestival.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Show type</span>
          <select
            value={showType}
            onChange={(e) => setShowType(e.target.value as ShowType)}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none bg-white"
          >
            {Object.entries(SHOW_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Datum *</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
            required
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Show tijd</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Set duur (min)</span>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Fee (EUR)</span>
          <input
            type="number"
            step="0.01"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="0.00"
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Contract status</span>
          <select
            value={contractStatus}
            onChange={(e) => setContractStatus(e.target.value)}
            className="w-full px-2.5 py-2 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none bg-white"
          >
            <option value="">—</option>
            <option value="pending">Pending</option>
            <option value="sent">Verstuurd</option>
            <option value="signed">Getekend</option>
          </select>
        </label>
      </div>

      {festivalId && (
        <div className="border-t border-ink-100 pt-3 space-y-2">
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-700 mb-1 block">
              Promoter / contact uit CRM ({contactsForFestival.length} bekend)
            </span>
            <div className="flex items-center gap-2">
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                disabled={showNewContact}
                className="flex-1 px-2.5 py-2 rounded-md border border-ink-200 text-sm bg-white disabled:bg-ink-50"
              >
                <option value="">— Geen / later koppelen —</option>
                {contactsForFestival.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.role ? ` (${c.role})` : ""}{c.is_primary ? " · primary" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewContact((v) => !v)}
                className="text-xs font-semibold text-brand-700 hover:bg-brand-50 px-2 py-1 rounded whitespace-nowrap"
              >
                {showNewContact ? "Annuleren" : "+ Nieuw contact"}
              </button>
            </div>
          </label>
          {showNewContact && (
            <InlineNewContact festivalId={festivalId} />
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50"
        >
          {pending ? "Aanmaken..." : "Booking opslaan (draft)"}
        </button>
      </div>
    </form>
  );
}

function InlineNewContact({ festivalId }: { festivalId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    start(async () => {
      const result = await addFestivalCrmContactAction(festivalId, formData);
      if (result.ok) {
        if (typeof window !== "undefined") window.location.reload();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="bg-brand-50 border border-brand-200 rounded-md p-2.5 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input name="name" placeholder="Naam *" required className="px-2 py-1 rounded border border-ink-200 text-xs" />
        <input name="role" placeholder="Functie (Promoter)" className="px-2 py-1 rounded border border-ink-200 text-xs" />
        <input name="email" type="email" placeholder="email@..." className="px-2 py-1 rounded border border-ink-200 text-xs" />
        <input name="phone" placeholder="+31 ..." className="px-2 py-1 rounded border border-ink-200 text-xs" />
      </div>
      <label className="flex items-center gap-2 text-[11px] text-ink-700">
        <input type="checkbox" name="is_primary" />
        Primair contact
      </label>
      {error && <div className="text-[11px] text-red-700">{error}</div>}
      <button type="submit" disabled={pending} className="text-xs font-semibold bg-ink-900 text-white px-2.5 py-1 rounded-md hover:bg-black disabled:opacity-50">
        {pending ? "..." : "Contact toevoegen aan CRM"}
      </button>
    </form>
  );
}
