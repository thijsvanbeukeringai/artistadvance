"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncAdvancingTechAction } from "@/lib/actions";

export default function SyncTechFromTemplateButton({ advancingId }: { advancingId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err" | "neutral"; msg: string } | null>(null);

  function go() {
    setFeedback(null);
    start(async () => {
      const res = await syncAdvancingTechAction(advancingId);
      if (!res.ok) {
        setFeedback({ tone: "err", msg: res.error });
        return;
      }
      if (res.inserted === 0) {
        setFeedback({ tone: "neutral", msg: "Geen nieuwe items — advancing is al gesynchroniseerd of de artist heeft geen template-items voor dit show-type." });
        return;
      }
      setFeedback({ tone: "ok", msg: `${res.inserted} item${res.inserted === 1 ? "" : "s"} gekloond vanuit artist-template.` });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-300 bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition disabled:opacity-50"
        title="Kloon de tech-template items van de artiest naar deze advancing"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        {pending ? "Synchroniseren..." : "Sync vanuit artist-template"}
      </button>
      {feedback && (
        <span
          role="status"
          className={`text-[11px] font-medium ${
            feedback.tone === "ok" ? "text-emerald-700" : feedback.tone === "err" ? "text-red-700" : "text-ink-500"
          }`}
        >
          {feedback.msg}
        </span>
      )}
    </div>
  );
}
