import Link from "next/link";
import { notFound } from "next/navigation";
import { createArtistAction, deleteArtistAction, deleteCompanyAction } from "@/lib/actions";
import { computeReadiness } from "@/lib/readiness";
import ReadinessRow from "@/components/readiness/ReadinessRow";
import DeleteConfirm from "@/components/admin/DeleteConfirm";
import CompanyEditor from "@/components/admin/CompanyEditor";
import AgencyBookingPanel from "@/components/booking/AgencyBookingPanel";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import { buildCalendarEvents } from "@/lib/calendarEvents";
import { loadSnapshot } from "@/lib/snapshot";
import { readAccount } from "@/lib/account";

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const company = snap.organizations.find((o) => o.id === params.id && o.type === "management");
  if (!company) return notFound();
  const artists = snap.artists.filter((a) => a.organization_id === company.id);
  const today = new Date("2026-05-09");
  const isOwn = account.organizationId === company.id;
  const artistIds = new Set(artists.map((a) => a.id));
  const companyBookings = snap.bookings.filter((b) => artistIds.has(b.artist_id));
  const companyAdvancings = snap.advancings.filter((a) => companyBookings.some((b) => b.id === a.booking_id));
  const calendarEvents = buildCalendarEvents(snap, artistIds, account.mode);
  const artistOptions = artists.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/admin/companies" className="hover:text-ink-700">Bedrijven</Link>
        <span>/</span>
        <span className="text-ink-700">{company.name}</span>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Super-admin</div>
          <h2 className="text-2xl font-extrabold text-ink-900 mt-1">{company.name}</h2>
          <p className="text-sm text-ink-500 mt-1">
            {artists.length} artiest{artists.length !== 1 ? "en" : ""} ·{" "}
            {company.dropbox_connected ? "Dropbox gekoppeld" : "Geen Dropbox-koppeling"}
            {company.dropbox_root_folder ? ` · ${company.dropbox_root_folder}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/companies" className="text-sm text-ink-700 hover:underline">← Alle bedrijven</Link>
          <CompanyEditor
            companyId={company.id}
            initialName={company.name}
            initialDropbox={company.dropbox_root_folder ?? null}
          />
          {!isOwn && (
            <DeleteConfirm
              id={company.id}
              name={company.name}
              noun="bedrijf"
              size="button"
              consequences={[
                `${artists.length} artiest${artists.length === 1 ? "" : "en"} (incl. crew, templates, defaults)`,
                `${companyBookings.length} booking${companyBookings.length === 1 ? "" : "s"} en ${companyAdvancings.length} advancing${companyAdvancings.length === 1 ? "" : "s"}`,
                "Alle gebruikers van dit bedrijf",
                "Festivals die aan dit bedrijf gekoppeld zijn",
              ]}
              action={deleteCompanyAction}
            />
          )}
          {isOwn && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded">
              Jouw workspace
            </span>
          )}
        </div>
      </header>

      {/* Agency-wide calendar */}
      {artists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-ink-900">Kalender — alle artiesten</h3>
              <p className="text-[11px] text-ink-500 mt-0.5">
                Shows, vluchten en hotels van alle {artists.length} artiest{artists.length === 1 ? "" : "en"} in {company.name}.
              </p>
            </div>
            <div className="text-[11px] text-ink-400 tabular-nums">{companyBookings.length} bookings totaal</div>
          </div>
          <MonthCalendar
            events={calendarEvents}
            emptyHint={`Nog geen events ingepland voor ${company.name}. Maak hieronder een boeking aan.`}
          />
        </section>
      )}

      {/* Agency-wide booking creator */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div className="p-5">
          <AgencyBookingPanel
            artists={artistOptions}
            festivals={snap.festivals}
            stages={snap.stages}
            festivalContacts={snap.festivalCrmContacts}
          />
        </div>
      </section>

      {/* Add artist form */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Artiest toevoegen aan {company.name}</h3>
        </header>
        <form action={createArtistAction.bind(null, company.id)} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink-700 mb-1.5 block">Artiestennaam *</label>
              <input
                required
                name="name"
                placeholder="Bijv. Sam Feldt"
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 mb-1.5 block">Dropbox folder (optioneel)</label>
              <input
                name="dropbox_artist_folder"
                placeholder={`${company.dropbox_root_folder ?? "/Bedrijf"}/Artiest`}
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 font-mono"
              />
            </div>
          </div>

          <div className="border-t border-ink-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700">Manager voor deze artiest</label>
                <p className="text-[11px] text-ink-500 mt-0.5">Hoofdcontact binnen {company.name} dat deze artiest beheert.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                name="manager_name"
                placeholder="Naam manager"
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              />
              <input
                name="manager_email"
                type="email"
                placeholder="manager@bedrijf.com"
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              />
              <input
                name="manager_phone"
                placeholder="+31 6 ..."
                className="w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
              Artiest toevoegen
            </button>
          </div>
        </form>
      </section>

      {/* Artists portfolio */}
      <section>
        <h3 className="font-bold text-ink-900 mb-3">Artiesten</h3>
        {artists.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center">
            <p className="text-sm text-ink-500">Nog geen artiesten in dit bedrijf. Voeg er één toe hierboven.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {artists.map((artist) => {
              const aBookings = snap.bookings.filter((b) => b.artist_id === artist.id);
              const aAdvancings = snap.advancings.filter((a) => aBookings.some((b) => b.id === a.booking_id));
              const readinessList = aAdvancings
                .map((adv) => computeReadiness(snap, adv.id, today))
                .filter((r): r is NonNullable<typeof r> => !!r);
              const avgScore = readinessList.length
                ? Math.round(readinessList.reduce((s, x) => s + x.score, 0) / readinessList.length)
                : null;
              const disputed = readinessList.reduce((s, x) => s + x.riders.disputed, 0);

              return (
                <div
                  key={artist.id}
                  className="relative group bg-white border border-ink-200 rounded-2xl shadow-card p-5 hover:border-brand-400 hover:shadow-md transition"
                >
                  <Link
                    href={`/artists/${artist.id}`}
                    className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
                    aria-label={`Open ${artist.name}`}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 grid place-items-center text-white text-xl font-extrabold flex-shrink-0">
                        {artist.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-ink-900 truncate">{artist.name}</div>
                        <div className="text-xs text-ink-400">{aBookings.length} booking{aBookings.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1 flex-shrink-0">
                      {avgScore !== null && (
                        <div className="text-right">
                          <div className="text-xs text-ink-400">avg readiness</div>
                          <div className="text-2xl font-extrabold text-ink-900 tabular-nums">{avgScore}</div>
                        </div>
                      )}
                      <DeleteConfirm
                        id={artist.id}
                        name={artist.name}
                        noun="artiest"
                        consequences={[
                          `${aBookings.length} booking${aBookings.length === 1 ? "" : "s"} en ${aAdvancings.length} advancing${aAdvancings.length === 1 ? "" : "s"}`,
                          "Crew defaults, rider templates en tech requirements",
                          "Alle getekende riders, hotels, flights en hospitality",
                        ]}
                        action={deleteArtistAction}
                      />
                    </div>
                  </div>
                  <div className="relative mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-ink-100 px-3 py-2">
                      <div className="text-ink-400">Bookings</div>
                      <div className="font-bold text-ink-900 tabular-nums">{aBookings.length}</div>
                    </div>
                    <div className="rounded-lg bg-ink-100 px-3 py-2">
                      <div className="text-ink-400">Advancings</div>
                      <div className="font-bold text-ink-900 tabular-nums">{aAdvancings.length}</div>
                    </div>
                    <div className={`rounded-lg px-3 py-2 ${disputed > 0 ? "bg-red-50" : "bg-ink-100"}`}>
                      <div className={disputed > 0 ? "text-red-700" : "text-ink-400"}>Disputed</div>
                      <div className={`font-bold tabular-nums ${disputed > 0 ? "text-red-700" : "text-ink-900"}`}>{disputed}</div>
                    </div>
                  </div>
                  {artist.manager_name && (
                    <div className="relative mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700">Manager</div>
                      <div className="mt-0.5 text-ink-900 font-semibold">{artist.manager_name}</div>
                      {(artist.manager_email || artist.manager_phone) && (
                        <div className="text-[11px] text-ink-500">
                          {[artist.manager_email, artist.manager_phone].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  )}
                  {artist.dropbox_artist_folder && (
                    <div className="relative mt-2 text-[11px] font-mono text-ink-500 truncate">{artist.dropbox_artist_folder}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
