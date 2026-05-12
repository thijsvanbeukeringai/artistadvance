"use client";

export default function PrintButton({ advancingId }: { advancingId: string }) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/callsheet/${advancingId}/pdf`}
        target="_blank"
        rel="noopener"
        className="px-3 py-1.5 rounded-md bg-ink-900 text-white text-sm font-semibold hover:bg-black transition inline-flex items-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
        </svg>
        Download PDF
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 text-sm font-semibold hover:bg-ink-100 transition"
      >
        Print preview
      </button>
    </div>
  );
}
