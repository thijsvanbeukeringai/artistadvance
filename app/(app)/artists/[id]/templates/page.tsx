import Link from "next/link";
import { notFound } from "next/navigation";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import TechRequirementsEditor from "@/components/templates/TechRequirementsEditor";
import RiderImporter from "@/components/templates/RiderImporter";
import PageIntro from "@/components/PageIntro";
import type { ShowType } from "@/lib/types";
import { loadSnapshot } from "@/lib/snapshot";
import LiveSync from "@/components/realtime/LiveSync";

const SHOW_TYPES: ShowType[] = ["festival", "club", "full_production", "ldjv", "venue", "corporate", "private"];
const RIDER_TYPES: ("technical" | "hospitality" | "sfx_pyro")[] = ["technical", "hospitality", "sfx_pyro"];

export default async function ArtistTemplatesPage({ params }: { params: { id: string } }) {
  const snap = await loadSnapshot();
  const artist = snap.artists.find((a) => a.id === params.id);
  if (!artist) return notFound();

  const templates = snap.artistRiderTemplates.filter((t) => t.artist_id === artist.id);
  const techReqs = snap.artistTechRequirements.filter((t) => t.artist_id === artist.id);

  return (
    <div className="space-y-6">
      <LiveSync scope={{ mode: "artist", ids: [artist.id] }} />
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/artists" className="hover:text-ink-700">Artists</Link>
        <span>/</span>
        <Link href={`/artists/${artist.id}`} className="hover:text-ink-700">{artist.name}</Link>
        <span>/</span>
        <span className="text-ink-700">Templates</span>
      </div>

      <PageIntro
        eyebrow={`Templates · ${artist.name}`}
        title="Wat het festival per booking moet bevestigen"
        description="Hier definieer je per show-type één keer welke items festivals moeten bevestigen via hun PLEASE CONFIRM-portal. Bij elke nieuwe booking-confirmed worden ze automatisch gekloond."
        steps={[
          { label: "Kies show-type", description: "Festival ≠ club - aparte lijsten." },
          { label: "Voeg items toe", description: "Bijv. '4x CDJ3000' of 'GrandMA3 MODE 3'." },
          { label: "Markeer mandatory", description: "Verplichte items krijgen rode marker." },
          { label: "Festival ziet dit", description: "Per booking: confirm / alternatief / weigeren." },
        ]}
      />

      {/* Rider files matrix */}
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <header className="px-5 py-4 border-b border-ink-200">
          <h3 className="font-bold text-ink-900">Rider files</h3>
          <p className="text-xs text-ink-500 mt-1">PDF's die als bijlage meegestuurd worden bij elke booking - per show-type × rider-type.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50">
                <th className="px-4 py-3 font-semibold">Show type</th>
                {RIDER_TYPES.map((rt) => (
                  <th key={rt} className="px-4 py-3 font-semibold">{rt.replace("_", " / ")}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {SHOW_TYPES.map((st) => (
                <tr key={st} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-semibold text-ink-900">{SHOW_TYPE_LABELS[st]}</td>
                  {RIDER_TYPES.map((rt) => {
                    const tpl = templates.find((t) => t.show_type === st && t.rider_type === rt);
                    return (
                      <td key={rt} className="px-4 py-3 text-xs">
                        {tpl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 font-semibold">v{tpl.version}</span>
                            <span className="text-ink-700 truncate max-w-[200px]" title={tpl.file_name}>{tpl.file_name}</span>
                          </div>
                        ) : (
                          <span className="text-ink-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI rider importer */}
      <RiderImporter artistId={artist.id} />

      {/* Tech requirements editor */}
      <TechRequirementsEditor
        artistId={artist.id}
        requirements={techReqs}
        customCategories={snap.artistCustomTechCategories.filter((c) => c.artist_id === artist.id)}
      />
    </div>
  );
}
