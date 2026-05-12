export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900">Help</h2>
        <p className="text-sm text-ink-500 mt-1">Documentatie en support.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <h3 className="font-bold text-ink-900">Wat is advancing?</h3>
          <p className="text-sm text-ink-500 mt-2">
            Advancing is het proces waarbij artiestenmanagement en festival samen alle praktische details van een show op één plek vastleggen - van stageplot tot vluchten en hospitality. ArtistAdvance vervangt losse mailchains door één bron van waarheid.
          </p>
        </div>
        <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
          <h3 className="font-bold text-ink-900">Demo modus</h3>
          <p className="text-sm text-ink-500 mt-2">
            Je werkt nu met in-memory demo data. Wijzigingen worden niet bewaard - een Supabase-koppeling is nog niet actief.
          </p>
        </div>
      </div>
    </div>
  );
}
