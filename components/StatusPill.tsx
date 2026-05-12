type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "soft";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  ok: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
  soft: "bg-brand-50 text-brand-700",
};

export default function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : tone === "bad" ? "bg-red-500" : tone === "info" ? "bg-sky-500" : tone === "soft" ? "bg-brand-500" : "bg-ink-400"}`} />
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  if (["complete", "accepted", "locked", "completed", "signed"].includes(status)) return "ok";
  if (["in_progress", "advancing", "sent_to_festival", "confirmed"].includes(status)) return "info";
  if (["pending", "draft", "empty"].includes(status)) return "warn";
  if (["disputed", "cancelled"].includes(status)) return "bad";
  return "neutral";
}

export function humanStatus(s: string) {
  return s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
