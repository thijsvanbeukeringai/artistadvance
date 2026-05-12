import Link from "next/link";
import { createCompanyAction, deleteCompanyAction } from "@/lib/actions";
import PageIntro from "@/components/PageIntro";
import DeleteConfirm from "@/components/admin/DeleteConfirm";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount } from "@/lib/account";

export default async function AdminCompaniesPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const companies = snap.organizations.filter((o) => o.type === "management");
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Super-admin"
        title="Beheer agencies en artiesten"
        description="Begin hier met setup. Een agency (= management-bedrijf) doet advancing voor één of meer artiesten."
        steps={[
          { label: "Maak agency", description: "Bedrijfsnaam + optioneel Dropbox-pad." },
          { label: "Voeg artiesten toe", description: "Open een agency → 'Artiest toevoegen'." },
          { label: "Stel templates in", description: "Per artiest rider + tech-requirements." },
          { label: "Switch workspace", description: "Gebruik switcher rechtsboven in topbar." },
        ]}
      />

      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Nieuw bedrijf aanmaken</h3>
          <span className="text-xs text-ink-400">{companies.length} actieve bedrijven</span>
        </header>
        <form action={createCompanyAction} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-ink-700 mb-1.5 block">Bedrijfsnaam *</label>
            <input
              required
              name="name"
              placeholder="Bijv. Spinnin' Records Management"
              className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-ink-700 mb-1.5 block">Dropbox root folder (optioneel)</label>
            <input
              name="dropbox_root_folder"
              placeholder="/Spinnin"
              className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 font-mono"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
              Bedrijf aanmaken
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="font-bold text-ink-900 mb-3">Alle bedrijven</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((c) => {
            const cArtists = snap.artists.filter((a) => a.organization_id === c.id);
            const artistIds = new Set(cArtists.map((a) => a.id));
            const cBookings = snap.bookings.filter((b) => artistIds.has(b.artist_id));
            const advCount = snap.advancings.filter((a) => cBookings.some((b) => b.id === a.booking_id)).length;
            const isOwn = account.organizationId === c.id;
            return (
              <div
                key={c.id}
                className="relative group bg-white border border-ink-200 rounded-2xl shadow-card p-5 hover:border-brand-400 hover:shadow-md transition"
              >
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
                  aria-label={`Open ${c.name}`}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-ink-900 truncate">{c.name}</div>
                    <div className="text-xs text-ink-400 mt-0.5">id {c.id}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        c.dropbox_connected ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {c.dropbox_connected ? "Dropbox aan" : "Geen Dropbox"}
                    </span>
                    {!isOwn && (
                      <DeleteConfirm
                        id={c.id}
                        name={c.name}
                        noun="bedrijf"
                        consequences={[
                          `${cArtists.length} artiest${cArtists.length === 1 ? "" : "en"} (incl. crew, templates, bookings, advancings)`,
                          `${cBookings.length} booking${cBookings.length === 1 ? "" : "s"} en ${advCount} advancing${advCount === 1 ? "" : "s"}`,
                          "Alle gebruikers van dit bedrijf (CASCADE)",
                          "Festivals die aan dit bedrijf hangen",
                        ]}
                        action={deleteCompanyAction}
                      />
                    )}
                  </div>
                </div>
                <div className="relative mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-ink-100 px-3 py-2">
                    <div className="text-ink-400">Artiesten</div>
                    <div className="font-bold text-ink-900 tabular-nums">{cArtists.length}</div>
                  </div>
                  <div className="rounded-lg bg-ink-100 px-3 py-2">
                    <div className="text-ink-400">Bookings</div>
                    <div className="font-bold text-ink-900 tabular-nums">{cBookings.length}</div>
                  </div>
                  <div className="rounded-lg bg-ink-100 px-3 py-2">
                    <div className="text-ink-400">Advancings</div>
                    <div className="font-bold text-ink-900 tabular-nums">{advCount}</div>
                  </div>
                </div>
                {c.dropbox_root_folder && (
                  <div className="relative mt-3 text-[11px] font-mono text-ink-500 truncate">{c.dropbox_root_folder}</div>
                )}
                {isOwn && (
                  <div className="relative mt-3 text-[10px] uppercase tracking-wider font-bold text-brand-700 bg-brand-50 inline-block px-2 py-0.5 rounded">
                    Jouw workspace
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
