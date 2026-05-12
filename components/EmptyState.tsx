export default function EmptyState({ title, description, cta }: { title: string; description: string; cta?: string }) {
  return (
    <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-12 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-ink-100 grid place-items-center mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
          <path d="M9 11l3 3 8-8 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      </div>
      <h3 className="font-bold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">{description}</p>
      {cta && (
        <button className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black">
          {cta}
        </button>
      )}
    </div>
  );
}
