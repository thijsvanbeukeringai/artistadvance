import EmptyState from "@/components/EmptyState";

export default function TeamPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900">Team</h2>
        <p className="text-sm text-ink-500 mt-1">Beheer rollen en organisaties.</p>
      </div>
      <EmptyState
        title="Team management komt binnenkort"
        description="Uitnodigingen, rollen en organisatie-koppeling worden gekoppeld aan Supabase Auth."
      />
    </div>
  );
}
