"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateArtistIntakeAction } from "@/lib/actions";

export default function IntakeLinkEditor({
  artistId,
  artistName,
  initialSlug,
  initialEnabled,
}: {
  artistId: string;
  artistName: string;
  initialSlug: string | null;
  initialEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState(initialSlug ?? slugify(artistName));
  const [enabled, setEnabled] = useState(initialEnabled);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/intake/${slug}` : `/intake/${slug}`;

  function save() {
    setErr(null);
    startTransition(async () => {
      const r = await updateArtistIntakeAction(artistId, { intake_slug: slug, intake_enabled: enabled });
      if (!r.ok) setErr(r.error ?? "Opslaan faalde");
      else router.refresh();
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-5 space-y-4">
      <header>
        <h3 className="font-bold text-ink-900">Intake-link</h3>
        <p className="text-xs text-ink-500 mt-1">
          Deel deze URL met promoters/festivals die {artistName} willen boeken. Aanvragen verschijnen
          hieronder en kun je accepteren of weigeren.
        </p>
      </header>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-300"
        />
        <span className="text-sm text-ink-900 font-semibold">Intake-link actief</span>
      </label>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-ink-700 mb-1 block">Slug</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-400 font-mono whitespace-nowrap">/intake/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="artist-naam"
            className="flex-1 bg-white border border-ink-200 rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-black transition font-semibold disabled:opacity-50"
          >
            {pending ? "..." : "Opslaan"}
          </button>
        </div>
      </div>

      {enabled && slug && initialSlug === slug && initialEnabled && (
        <div className="bg-ink-50 border border-ink-200 rounded-lg p-3 flex items-center gap-3">
          <code className="flex-1 text-xs font-mono text-ink-900 truncate">{url}</code>
          <button
            type="button"
            onClick={copy}
            className="text-xs px-2.5 py-1 rounded-md border border-ink-200 hover:bg-white transition font-semibold"
          >
            {copied ? "✓ Gekopieerd" : "Kopieer"}
          </button>
        </div>
      )}

      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
    </section>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
