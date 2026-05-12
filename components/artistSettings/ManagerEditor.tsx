"use client";

import { useState, useTransition } from "react";
import { updateArtistManagerAction } from "@/lib/actions";

export default function ManagerEditor({
  artistId,
  managerName,
  managerEmail,
  managerPhone,
}: {
  artistId: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
}) {
  const [name, setName] = useState(managerName ?? "");
  const [email, setEmail] = useState(managerEmail ?? "");
  const [phone, setPhone] = useState(managerPhone ?? "");
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await updateArtistManagerAction(artistId, {
        manager_name: name.trim() || null,
        manager_email: email.trim() || null,
        manager_phone: phone.trim() || null,
      });
      setSavedAt(Date.now());
    });
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Manager voor deze artiest</h3>
        <p className="text-xs text-ink-500 mt-0.5">
          Hoofdcontact binnen het management-bedrijf dat deze artiest beheert. Komt straks in callsheets + portals.
        </p>
      </header>
      <form onSubmit={save} className="p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Naam</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Voor- en achternaam" className={cls} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@bedrijf.com" className={cls} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-ink-700 mb-1 block">Telefoon</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+31 6 ..." className={cls} />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          {savedAt && Date.now() - savedAt < 2500 && <span className="text-[11px] text-emerald-700 font-semibold">✓ Opgeslagen</span>}
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50"
          >
            {pending ? "Opslaan..." : "Manager opslaan"}
          </button>
        </div>
      </form>
    </section>
  );
}

const cls = "w-full px-2.5 py-1.5 rounded-md border border-ink-200 text-sm focus:border-brand-500 focus:outline-none";
