import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSnapshot } from "@/lib/snapshot";
import CrewDefaultsEditor from "@/components/artistSettings/CrewDefaultsEditor";
import HospitalityDefaultsEditor from "@/components/artistSettings/HospitalityDefaultsEditor";
import HotelDefaultsEditor from "@/components/artistSettings/HotelDefaultsEditor";
import TravelDefaultsEditor from "@/components/artistSettings/TravelDefaultsEditor";
import LogisticsDefaultsEditor from "@/components/artistSettings/LogisticsDefaultsEditor";
import ManagerEditor from "@/components/artistSettings/ManagerEditor";
import ContractTemplateEditor from "@/components/artistSettings/ContractTemplateEditor";
import DropboxTree from "@/components/booking/DropboxTree";
import StatusPill, { humanStatus } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function ArtistSettingsPage({ params }: { params: { id: string } }) {
  const snap = await loadSnapshot();
  const artist = snap.artists.find((a) => a.id === params.id);
  if (!artist) return notFound();

  const crew = snap.artistCrew.filter((c) => c.artist_id === artist.id);
  const defaultCrew = crew.filter((c) => c.is_default).length;
  const bookingCount = snap.bookings.filter((b) => b.artist_id === artist.id && b.status !== "draft").length;

  // Activity aggregeren over alle advancings van deze artist
  const artistBookingIds = new Set(snap.bookings.filter((b) => b.artist_id === artist.id).map((b) => b.id));
  const artistAdvancingIds = new Set(
    snap.advancings.filter((a) => artistBookingIds.has(a.booking_id)).map((a) => a.id),
  );
  const artistActivity = snap.activity
    .filter((a) => artistAdvancingIds.has(a.advancing_id))
    .slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/artists" className="hover:text-ink-700">Artists</Link>
        <span>/</span>
        <Link href={`/artists/${artist.id}`} className="hover:text-ink-700">{artist.name}</Link>
        <span>/</span>
        <span className="text-ink-700">Settings</span>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600 font-bold">Standaarden</div>
          <h1 className="text-2xl font-extrabold text-ink-900 mt-1">{artist.name} · Settings</h1>
          <p className="text-sm text-ink-500 mt-1">
            Vaste crew + standaarden die automatisch worden overgenomen bij elke nieuwe show. Hier ingevuld = bij elke booking-bevestiging direct in de advancing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/artists/${artist.id}/templates`}
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold"
          >
            Tech requirements & rider templates →
          </Link>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600 flex-shrink-0 mt-0.5">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z M12 8v4 M12 16h.01" />
        </svg>
        <div className="text-sm text-brand-900">
          <span className="font-bold">Hoe het werkt:</span> {defaultCrew} crewleden staan als default, {bookingCount} shows zijn al bevestigd voor {artist.name}.
          Wijzigingen hier gelden voor <span className="font-semibold">nieuwe bookings</span>. Lopende advancings blijven ongewijzigd — ga daar handmatig naar de specifieke sectie.
        </div>
      </div>

      {/* Manager */}
      <ManagerEditor
        artistId={artist.id}
        managerName={artist.manager_name}
        managerEmail={artist.manager_email}
        managerPhone={artist.manager_phone}
      />

      {/* Crew defaults */}
      <CrewDefaultsEditor artistId={artist.id} crew={crew} />

      {/* Hospitality defaults */}
      <HospitalityDefaultsEditor artistId={artist.id} defaults={artist.defaults_hospitality ?? {}} />

      {/* Hotel defaults */}
      <HotelDefaultsEditor artistId={artist.id} defaults={artist.defaults_hotel ?? {}} />

      {/* Travel defaults */}
      <TravelDefaultsEditor artistId={artist.id} defaults={artist.defaults_travel ?? {}} />

      {/* Logistics defaults */}
      <LogisticsDefaultsEditor artistId={artist.id} defaults={artist.defaults_logistics ?? {}} />

      {/* Contract template */}
      <ContractTemplateEditor artistId={artist.id} initialTemplate={artist.contract_template_md ?? null} />

      {/* Dropbox koppeling + folder-structuur */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="font-bold text-ink-900">Dropbox</h3>
            <p className="text-xs text-ink-500 mt-1">
              Koppel een Dropbox root-folder voor {artist.name}. Bij elke booking-bevestiging wordt automatisch een
              show-folder aangemaakt volgens de structuur hieronder.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-400 bg-ink-50 cursor-not-allowed font-semibold"
            title="Coming soon"
          >
            Koppel Dropbox (binnenkort)
          </button>
        </div>
        <div className="text-xs text-ink-500 mb-2 font-mono">
          Root folder: <span className="text-ink-900">{artist.dropbox_artist_folder ?? `/${artist.name}/`}</span>
        </div>
        <DropboxTree rootFolder={artist.dropbox_artist_folder ?? undefined} />
      </section>

      {/* Activity log (geaggregeerd over alle shows) */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Activity</h3>
          <p className="text-xs text-ink-500 mt-1">Laatste 50 acties op shows en advancings van {artist.name}.</p>
        </div>
        {artistActivity.length === 0 ? (
          <div className="px-5 py-8 text-sm text-ink-400">Nog geen activiteit voor deze artiest.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {artistActivity.map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-ink-900">
                    <span className="font-semibold">{a.user_name}</span> · {a.details ?? humanStatus(a.action)}
                  </div>
                  <div className="text-xs text-ink-400">{new Date(a.created_at).toLocaleString("nl-NL")}</div>
                </div>
                {a.section_type && <StatusPill tone="soft">{a.section_type}</StatusPill>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
