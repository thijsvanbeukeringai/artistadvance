"use client";

import { useState, useTransition } from "react";
import { addHotelProposalAction, removeHotelProposalAction } from "@/lib/actions";
import type { HotelAmenity, HotelProposal, HotelRoomOption } from "@/lib/types";

const AMENITY_LABELS: Record<HotelAmenity, string> = {
  breakfast: "Ontbijt",
  wifi: "Wifi",
  gym: "Gym",
  spa: "Spa",
  pool: "Zwembad",
  parking: "Parking",
  room_service: "Room service",
  restaurant: "Restaurant",
  bar: "Bar",
  laundry: "Wasserij",
  airport_shuttle: "Airport shuttle",
  soundproof: "Geluiddicht",
};

const AMENITY_KEYS = Object.keys(AMENITY_LABELS) as HotelAmenity[];

export default function HotelProposalsForm({
  token,
  proposals,
}: {
  token: string;
  proposals: HotelProposal[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
        <div>
          <h3 className="font-bold text-ink-900">Hotelvoorstellen</h3>
          <p className="text-xs text-ink-500 mt-0.5">Stel hotels voor aan management - naam, sterren, kamertypes met prijzen, voorzieningen.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(!adding)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
        >
          {adding ? "Annuleer" : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
              Voorstel toevoegen
            </>
          )}
        </button>
      </header>

      {adding && <AddProposalForm token={token} onDone={() => setAdding(false)} />}

      {proposals.length === 0 && !adding ? (
        <div className="px-5 py-10 text-center text-sm text-ink-500">Nog geen hotelvoorstellen gedaan.</div>
      ) : (
        <ul className="divide-y divide-ink-200">
          {proposals.map((p) => (
            <li key={p.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="font-bold text-ink-900">{p.hotel_name}</h4>
                    {p.star_rating && <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{p.star_rating}</span>}
                    {typeof p.distance_to_venue_km === "number" && <span className="text-[11px] text-ink-500">{p.distance_to_venue_km} km van venue</span>}
                  </div>
                  {p.address && <div className="text-xs text-ink-500 mt-0.5">{p.address}</div>}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => { void removeHotelProposalAction(token, p.id); })}
                  className="text-[11px] text-red-600 font-semibold hover:underline disabled:opacity-50"
                >
                  Verwijder
                </button>
              </div>

              {p.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.amenities.map((a) => (
                    <span key={a} className="text-[10px] font-semibold bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full">{AMENITY_LABELS[a]}</span>
                  ))}
                </div>
              )}

              {p.room_options.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-ink-400 text-[10px] uppercase tracking-wider">
                        <th className="py-1 pr-3 font-semibold">Kamertype</th>
                        <th className="py-1 pr-3 font-semibold">Bed</th>
                        <th className="py-1 pr-3 font-semibold">Prijs/nacht</th>
                        <th className="py-1 pr-3 font-semibold">Incl. ontbijt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {p.room_options.map((r, i) => (
                        <tr key={i} className="text-ink-700">
                          <td className="py-1.5 pr-3 font-medium">{r.room_type}</td>
                          <td className="py-1.5 pr-3">{r.bed_type ?? "-"}</td>
                          <td className="py-1.5 pr-3 tabular-nums font-bold text-ink-900">{r.currency} {r.price_per_night}</td>
                          <td className="py-1.5 pr-3">{r.includes_breakfast ? "Ja" : "Nee"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-ink-500">
                {p.late_checkout_available && <div>✓ Late check-out mogelijk</div>}
                {p.cancellation_policy && <div>Annulering: <span className="text-ink-700">{p.cancellation_policy}</span></div>}
              </div>

              {p.notes && <p className="mt-2 text-xs italic text-ink-500">{p.notes}</p>}
              <div className="mt-2 text-[10px] text-ink-400 tabular-nums">Voorgesteld {new Date(p.proposed_at).toLocaleString("nl-NL")}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddProposalForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [hotelName, setHotelName] = useState("");
  const [starRating, setStarRating] = useState<"3*" | "4*" | "5*" | "">("");
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState("");
  const [lateCheckout, setLateCheckout] = useState(false);
  const [amenities, setAmenities] = useState<Set<HotelAmenity>>(new Set());
  const [rooms, setRooms] = useState<HotelRoomOption[]>([{ room_type: "Kingsize", price_per_night: 250, currency: "EUR", includes_breakfast: true }]);
  const [cancellation, setCancellation] = useState("");
  const [notes, setNotes] = useState("");

  function toggleAmenity(a: HotelAmenity) {
    const next = new Set(amenities);
    if (next.has(a)) next.delete(a); else next.add(a);
    setAmenities(next);
  }

  function updateRoom(i: number, patch: Partial<HotelRoomOption>) {
    setRooms((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRoom() {
    setRooms([...rooms, { room_type: "Double", price_per_night: 180, currency: "EUR" }]);
  }

  function removeRoom(i: number) {
    setRooms(rooms.filter((_, idx) => idx !== i));
  }

  function submit() {
    if (!hotelName.trim()) return;
    startTransition(async () => {
      await addHotelProposalAction(token, {
        hotel_name: hotelName,
        star_rating: starRating || undefined,
        address: address || undefined,
        distance_to_venue_km: distance ? Number(distance) : undefined,
        amenities: Array.from(amenities),
        room_options: rooms.filter((r) => r.room_type && r.price_per_night > 0),
        late_checkout_available: lateCheckout,
        cancellation_policy: cancellation || undefined,
        notes: notes || undefined,
      });
      onDone();
    });
  }

  return (
    <div className="px-5 py-5 bg-emerald-50 border-b border-emerald-100 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="Hotelnaam *" cols={2}>
          <input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Sir Adam Hotel" className="input" />
        </Field>
        <Field label="Sterren">
          <select value={starRating} onChange={(e) => setStarRating(e.target.value as any)} className="input">
            <option value="">- kies -</option>
            <option value="3*">3*</option>
            <option value="4*">4*</option>
            <option value="5*">5*</option>
          </select>
        </Field>
        <Field label="Afstand venue (km)">
          <input type="number" min={0} value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="2.5" className="input" />
        </Field>
        <Field label="Adres" cols={4}>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Stad / straat" className="input" />
        </Field>
      </div>

      <div>
        <div className="text-xs font-semibold text-ink-700 mb-2">Voorzieningen</div>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_KEYS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${
                amenities.has(a)
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-ink-700 border border-ink-200 hover:border-emerald-400"
              }`}
            >
              {AMENITY_LABELS[a]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-ink-700">Kamertypes + prijzen</span>
          <button type="button" onClick={addRoom} className="text-[11px] font-semibold text-emerald-700 hover:underline">+ Kamer toevoegen</button>
        </div>
        <div className="space-y-2">
          {rooms.map((r, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-white p-2 rounded-md border border-ink-200">
              <Field label="Type" cols={3}>
                <input value={r.room_type} onChange={(e) => updateRoom(i, { room_type: e.target.value })} className="input" />
              </Field>
              <Field label="Bed" cols={2}>
                <input value={r.bed_type ?? ""} onChange={(e) => updateRoom(i, { bed_type: e.target.value })} placeholder="King" className="input" />
              </Field>
              <Field label="Prijs/nacht" cols={3}>
                <div className="flex items-center gap-1">
                  <input type="number" min={0} value={r.price_per_night} onChange={(e) => updateRoom(i, { price_per_night: Number(e.target.value) })} className="input" />
                  <select value={r.currency} onChange={(e) => updateRoom(i, { currency: e.target.value })} className="input w-20">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </Field>
              <Field label="Incl. ontbijt" cols={2}>
                <select value={r.includes_breakfast ? "yes" : "no"} onChange={(e) => updateRoom(i, { includes_breakfast: e.target.value === "yes" })} className="input">
                  <option value="no">Nee</option>
                  <option value="yes">Ja</option>
                </select>
              </Field>
              <div className="md:col-span-2 flex items-end justify-end pb-1">
                <button type="button" onClick={() => removeRoom(i)} className="text-[11px] text-red-600 font-semibold hover:underline">Verwijder</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Annulerings­voorwaarden">
          <input value={cancellation} onChange={(e) => setCancellation(e.target.value)} placeholder="Bv. tot 48u voor check-in" className="input" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-700 pt-6">
          <input type="checkbox" checked={lateCheckout} onChange={(e) => setLateCheckout(e.target.checked)} />
          Late check-out mogelijk
        </label>
      </div>

      <Field label="Notities (voor management)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Bv. 'Geluiddichte kamers gegarandeerd' of 'wij hebben deal met dit hotel'" className="input" />
      </Field>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="button" disabled={pending || !hotelName.trim()} onClick={submit} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
          {pending ? "Versturen…" : "Voorstel verzenden"}
        </button>
      </div>

      <style>{`
        .input { width:100%; background:white; border:1px solid #e3e6eb; border-radius:8px; padding:7px 10px; font-size:13px; color:#0f1115; outline:none; transition: border-color 150ms, box-shadow 150ms; }
        .input:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.25); }
      `}</style>
    </div>
  );
}

function Field({ label, children, cols }: { label: string; children: React.ReactNode; cols?: number }) {
  return (
    <label className={`block ${cols ? `md:col-span-${cols}` : ""}`}>
      <span className="text-[11px] font-semibold text-ink-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
