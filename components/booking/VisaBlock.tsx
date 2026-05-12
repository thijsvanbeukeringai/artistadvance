import type { AdvancingVisa, AdvancingVisaCrew } from "@/lib/types";

const visaStatusTone: Record<string, string> = {
  not_needed: "bg-ink-100 text-ink-500",
  pending: "bg-amber-50 text-amber-700",
  applied: "bg-sky-50 text-sky-700",
  approved: "bg-emerald-50 text-emerald-700",
  denied: "bg-red-50 text-red-700",
};

export default function VisaBlock({ visa, crew, today }: { visa: AdvancingVisa | null; crew: AdvancingVisaCrew[]; today?: Date }) {
  if (!visa || !visa.visa_required) {
    return (
      <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5">
        <header className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-ink-900">Visa / Paperwork</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-ink-100 text-ink-500 px-2 py-1 rounded-full">Niet nodig</span>
        </header>
        <p className="text-sm text-ink-500">Geen visa vereist voor deze show.</p>
      </section>
    );
  }

  const ref = today ?? new Date();
  const deadline = visa.deadline ? new Date(visa.deadline + "T00:00:00") : null;
  const daysToDeadline = deadline ? Math.ceil((deadline.getTime() - ref.getTime()) / 86400000) : null;
  const deadlineTone = daysToDeadline === null ? "neutral" : daysToDeadline < 7 ? "bad" : daysToDeadline < 30 ? "warn" : "ok";

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Visa / Paperwork</h3>
        <div className="flex items-center gap-2 text-xs">
          {visa.visa_type && (
            <span className="bg-ink-100 text-ink-700 px-2 py-1 rounded-md font-semibold">{visa.visa_type}</span>
          )}
          {daysToDeadline !== null && (
            <span
              className={`px-2 py-1 rounded-md font-bold tabular-nums ${
                deadlineTone === "bad" ? "bg-red-50 text-red-700" : deadlineTone === "warn" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              Deadline: {visa.deadline} ({daysToDeadline}d)
            </span>
          )}
        </div>
      </header>
      <div className="px-5 py-4">
        <p className="text-xs text-ink-500 mb-3">{crew.length} crew lid{crew.length !== 1 ? "en" : ""} ingevoerd</p>
        {crew.length === 0 ? (
          <p className="text-sm text-ink-500">Voeg crewleden toe waarvoor visa-status bijgehouden moet worden.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {crew.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-900 font-medium">{c.name}</span>
                <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-full ${visaStatusTone[c.status]}`}>
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {visa.notes && <p className="mt-3 text-xs text-ink-500 italic">{visa.notes}</p>}
      </div>
    </section>
  );
}
