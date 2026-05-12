type Props = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: { value: string; positive: boolean };
  caption?: string;
};

export default function KpiCard({ icon, label, value, delta, caption = "From Last Month" }: Props) {
  return (
    <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-card flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-ink-500 text-sm font-medium">
          <span className="text-ink-400">{icon}</span>
          {label}
        </div>
        <button className="w-7 h-7 grid place-items-center rounded-md bg-ink-100 text-ink-500 hover:text-ink-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </button>
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-ink-900">{value}</div>
      <div className="mt-4 pt-3 border-t border-ink-200 flex items-center justify-between text-xs">
        <span className="text-ink-400">{caption}</span>
        {delta && (
          <span
            className={[
              "inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold",
              delta.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {delta.positive ? <path d="M7 17l5-5 5 5M7 7l5 5 5-5" /> : <path d="M7 7l5 5 5-5M7 17l5-5 5 5" />}
            </svg>
            {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
