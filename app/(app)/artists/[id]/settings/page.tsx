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

export const dynamic = "force-dynamic";

export default async function ArtistSettingsPage({ params }: { params: { id: string } }) {
  const snap = await loadSnapshot();
  const artist = snap.artists.find((a) => a.id === params.id);
  if (!artist) return notFound();

  const crew = snap.artistCrew.filter((c) => c.artist_id === artist.id);
  const defaultCrew = crew.filter((c) => c.is_default).length;
  const bookingCount = snap.bookings.filter((b) => b.artist_id === artist.id && b.status !== "draft").length;

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
    </div>
  );
}
