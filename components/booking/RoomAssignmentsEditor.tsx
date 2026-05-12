"use client";

import { useState, useTransition } from "react";
import { setRoomAssignmentsAction } from "@/lib/actions";
import type { BookingCrew, HotelRoomAssignment } from "@/lib/types";

export default function RoomAssignmentsEditor({
  advancingId,
  initial,
  crew,
  hotelName,
  roomCount,
}: {
  advancingId: string;
  initial: HotelRoomAssignment[];
  crew: BookingCrew[];
  hotelName?: string;
  roomCount?: number;
}) {
  const [rooms, setRooms] = useState<HotelRoomAssignment[]>(
    initial.length > 0
      ? initial
      : Array.from({ length: roomCount ?? 1 }).map((_, i) => ({ label: `Kamer ${i + 1}`, occupants: [] })),
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<"idle" | "ok">("idle");

  const allPeople = crew.filter((c) => c.is_traveling).map((c) => c.name);
  const assigned = new Set(rooms.flatMap((r) => r.occupants));
  const unassigned = allPeople.filter((p) => !assigned.has(p));

  function patchRoom(i: number, patch: Partial<HotelRoomAssignment>) {
    setRooms(rooms.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }
  function toggleOccupant(roomIdx: number, name: string) {
    const r = rooms[roomIdx];
    const next = r.occupants.includes(name)
      ? r.occupants.filter((p) => p !== name)
      : [...r.occupants, name];
    patchRoom(roomIdx, { occupants: next });
  }
  function moveOccupant(name: string, toRoom: number) {
    setRooms(rooms.map((r, idx) => ({
      ...r,
      occupants: idx === toRoom
        ? (r.occupants.includes(name) ? r.occupants : [...r.occupants, name])
        : r.occupants.filter((p) => p !== name),
    })));
  }
  function addRoom() {
    setRooms([...rooms, { label: `Kamer ${rooms.length + 1}`, occupants: [] }]);
  }
  function removeRoom(i: number) {
    setRooms(rooms.filter((_, idx) => idx !== i));
  }
  function save() {
    setSaved("idle");
    start(async () => {
      await setRoomAssignmentsAction(advancingId, rooms);
      setSaved("ok");
      setTimeout(() => setSaved("idle"), 2000);
    });
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-ink-900">Kamer-indeling</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Wijs crew toe per kamer in {hotelName ? <span className="font-semibold text-ink-900">{hotelName}</span> : "het hotel"}.
            Klik op een naam onder een kamer om toe te voegen / te verwijderen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved === "ok" && <span className="text-[11px] text-emerald-700 font-semibold">✓ Opgeslagen</span>}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white font-semibold hover:bg-black transition disabled:opacity-50"
          >
            {pending ? "Bezig..." : "Opslaan"}
          </button>
        </div>
      </header>

      {unassigned.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Nog niet toegewezen ({unassigned.length})</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {unassigned.map((p) => (
              <span key={p} className="text-xs bg-white border border-amber-200 text-amber-900 px-2 py-1 rounded font-semibold">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 space-y-3">
        {rooms.map((r, i) => (
          <div key={i} className="rounded-lg border border-ink-200 p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <input
                value={r.label}
                onChange={(e) => patchRoom(i, { label: e.target.value })}
                className="font-bold text-ink-900 text-sm bg-transparent border-b border-transparent hover:border-ink-200 focus:border-brand-500 focus:outline-none px-1"
              />
              <button
                type="button"
                onClick={() => removeRoom(i)}
                className="text-[11px] text-red-600 font-semibold hover:underline"
              >
                Verwijder kamer
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allPeople.map((p) => {
                const inThis = r.occupants.includes(p);
                const inOther = !inThis && assigned.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => inOther ? moveOccupant(p, i) : toggleOccupant(i, p)}
                    title={inOther ? "In andere kamer - klik om hier te zetten" : ""}
                    className={`text-xs px-2 py-1 rounded font-semibold transition ${
                      inThis
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : inOther
                        ? "bg-ink-100 text-ink-400 line-through hover:bg-amber-50 hover:text-amber-700 hover:no-underline"
                        : "bg-white border border-ink-200 text-ink-700 hover:border-emerald-400"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {allPeople.length === 0 && (
                <span className="text-xs text-ink-400">Geen traveling crew. Stel eerst de touring party in.</span>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRoom}
          className="text-xs px-3 py-1.5 rounded-md border border-dashed border-ink-300 text-ink-600 font-semibold hover:bg-ink-50 transition"
        >
          + Kamer toevoegen
        </button>
      </div>
    </section>
  );
}
