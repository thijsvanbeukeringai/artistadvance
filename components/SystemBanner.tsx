type System = "agency" | "artist";

const COPY: Record<System, { title: string; subtitle: string; bg: string; text: string; dot: string }> = {
  agency: {
    title: "Bookings Agency",
    subtitle: "Deal-flow · contracten · festivals · holds",
    bg: "bg-ink-900",
    text: "text-white",
    dot: "bg-brand-400",
  },
  artist: {
    title: "Artist Team · Advancing",
    subtitle: "Productie · crew · riders · callsheets",
    bg: "bg-gradient-to-r from-violet-700 to-fuchsia-700",
    text: "text-white",
    dot: "bg-fuchsia-300",
  },
};

export default function SystemBanner({ system }: { system: System }) {
  const c = COPY[system];
  return (
    <div className={`${c.bg} ${c.text} px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} aria-hidden="true" />
      <span className="text-[10px] uppercase tracking-[0.18em] font-bold">{c.title}</span>
      <span className="text-[11px] opacity-70 hidden sm:inline">· {c.subtitle}</span>
    </div>
  );
}
