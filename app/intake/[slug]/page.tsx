import { notFound } from "next/navigation";
import { findArtistByIntakeSlug } from "@/lib/db";
import IntakeForm from "@/components/intake/IntakeForm";

export const dynamic = "force-dynamic";

export default async function IntakePage({ params }: { params: { slug: string } }) {
  const artist = await findArtistByIntakeSlug(params.slug);
  if (!artist || !artist.intake_enabled) return notFound();

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="text-center mb-8">
          <div className="text-xs uppercase tracking-wider text-brand-600 font-bold">Show-aanvraag</div>
          <h1 className="text-3xl font-extrabold text-ink-900 mt-2">{artist.name}</h1>
          <p className="text-sm text-ink-500 mt-2">
            Vul de show-details in. {artist.name} ontvangt je aanvraag en bevestigt zelf.
          </p>
        </header>
        <IntakeForm slug={params.slug} artistName={artist.name} />
      </div>
    </div>
  );
}
