import Link from "next/link";
import FestivalContactsEditor from "@/components/festivals/FestivalContactsEditor";
import NewFestivalForm from "@/components/festivals/NewFestivalForm";
import FestivalSearchClient from "@/components/festivals/FestivalSearchClient";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default async function FestivalsCRMPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const visibleArtists = scopedArtistIds(account, snap.artists);

  const visibleFestivalIds = new Set(
    snap.bookings.filter((b) => visibleArtists.has(b.artist_id)).map((b) => b.festival_id)
  );
  const showAll = account.role === "super_admin" || account.role === "agency_admin";
  const festivals = showAll ? snap.festivals : snap.festivals.filter((f) => visibleFestivalIds.has(f.id));

  const enriched = festivals.map((f) => {
    const contacts = snap.festivalCrmContacts.filter((c) => c.festival_id === f.id);
    const bookings = snap.bookings.filter((b) => b.festival_id === f.id && visibleArtists.has(b.artist_id));
    const upcoming = bookings.filter((b) => b.show_date >= "2026-05-09");
    return { festival: f, contacts, bookings, upcoming };
  }).sort((a, b) => {
    if (a.contacts.length === 0 && b.contacts.length > 0) return 1;
    if (b.contacts.length === 0 && a.contacts.length > 0) return -1;
    return a.festival.name.localeCompare(b.festival.name);
  });

  const totalContacts = snap.festivalCrmContacts.length;
  const withoutContacts = festivals.filter((f) => !snap.festivalCrmContacts.some((c) => c.festival_id === f.id)).length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Festivals CRM</div>
          <h2 className="text-2xl font-extrabold text-ink-900 mt-1">Promoters & buyers per festival</h2>
          <p className="text-sm text-ink-500 mt-1">
            Centraal contactenboek voor alle festivals waar je boekt. Voeg promoters, bookers en agency-contacts toe — herbruikbaar over alle artiesten.
          </p>
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          <FestivalSearchClient />
          <NewFestivalForm />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Festivals</div>
            <div className="font-extrabold text-ink-900 text-lg tabular-nums">{festivals.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400">Contacten</div>
            <div className="font-extrabold text-ink-900 text-lg tabular-nums">{totalContacts}</div>
          </div>
          {withoutContacts > 0 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-800">Geen contact</div>
              <div className="font-extrabold text-amber-800 text-lg tabular-nums">{withoutContacts}</div>
            </div>
          )}
        </div>
      </header>

      {enriched.length === 0 ? (
        <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center">
          <p className="text-sm text-ink-500">Nog geen festivals zichtbaar.</p>
          <Link href="/bookings" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Open boekingen →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enriched.map(({ festival, contacts, upcoming }) => {
            const stages = snap.stages.filter((s) => s.festival_id === festival.id);
            const primary = contacts.find((c) => c.is_primary);
            return (
              <section
                key={festival.id}
                data-festival-name={festival.name}
                data-festival-contacts={contacts.map((c) => `${c.name} ${c.email ?? ""} ${c.role ?? ""}`).join(" ")}
                className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden"
              >
                <header className="px-5 py-4 border-b border-ink-200 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-ink-900 text-lg">{festival.name}</h3>
                      {primary ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                          Primary: {primary.name}
                        </span>
                      ) : contacts.length === 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                          Geen contact
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      {festival.location}
                      {festival.country ? ` · ${festival.country}` : ""}
                      <span className="mx-1.5">·</span>
                      <span className="tabular-nums">{festival.start_date} → {festival.end_date}</span>
                    </div>
                    {stages.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {stages.map((s) => (
                          <span key={s.id} className="text-[10px] font-semibold bg-ink-100 text-ink-700 px-1.5 py-0.5 rounded">{s.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-ink-500">
                    <div className="font-bold text-ink-900 tabular-nums text-base">{upcoming.length}</div>
                    aankomende booking{upcoming.length === 1 ? "" : "s"}
                  </div>
                </header>
                <div className="p-5">
                  <FestivalContactsEditor festivalId={festival.id} contacts={contacts} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
