"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadArtistRiderTemplateAction, removeArtistRiderTemplateAction } from "@/lib/actions";
import { RIDER_TYPES, RIDER_TYPE_LABELS, type ArtistRiderTemplate, type RiderType } from "@/lib/types";

export default function RiderTemplatesEditor({
  artistId,
  templates,
}: {
  artistId: string;
  templates: ArtistRiderTemplate[];
}) {
  const router = useRouter();
  // Map per rider_type → meest recente template (waar show_type=null)
  const byType = new Map<RiderType, ArtistRiderTemplate>();
  for (const t of templates) {
    if (t.show_type) continue; // legacy show-type-gebonden negeren
    const prev = byType.get(t.rider_type);
    if (!prev || (t.version ?? 1) > (prev.version ?? 1)) byType.set(t.rider_type, t);
  }

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Rider templates</h3>
        <p className="text-xs text-ink-500 mt-1">
          Upload één PDF per rider-type. Per booking kies je in het show-detail welke riders meegaan naar het
          festival portal.
        </p>
      </header>
      <ul className="divide-y divide-ink-200">
        {RIDER_TYPES.map((rt) => (
          <RiderRow
            key={rt}
            artistId={artistId}
            riderType={rt}
            template={byType.get(rt)}
            onChange={() => router.refresh()}
          />
        ))}
      </ul>
    </section>
  );
}

function RiderRow({
  artistId,
  riderType,
  template,
  onChange,
}: {
  artistId: string;
  riderType: RiderType;
  template: ArtistRiderTemplate | undefined;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    const fd = new FormData();
    fd.set("rider_type", riderType);
    fd.set("file", file);
    startTransition(async () => {
      const r = await uploadArtistRiderTemplateAction(artistId, fd);
      if (e.target) e.target.value = "";
      if (!r.ok) setErr(r.error ?? "Upload faalde");
      else onChange();
    });
  }

  function onRemove() {
    if (!confirm(`${RIDER_TYPE_LABELS[riderType]} verwijderen?`)) return;
    startTransition(async () => {
      await removeArtistRiderTemplateAction(artistId, riderType);
      onChange();
    });
  }

  return (
    <li className="px-5 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-900">{RIDER_TYPE_LABELS[riderType]}</span>
          {template && (
            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
              v{template.version}
            </span>
          )}
        </div>
        {template ? (
          <div className="text-[11px] font-mono text-ink-500 mt-0.5 truncate" title={template.file_name}>
            {template.file_name}
          </div>
        ) : (
          <div className="text-[11px] text-ink-400 mt-0.5">Geen PDF geüpload</div>
        )}
        {err && <div className="text-[11px] text-red-700 mt-1">{err}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onFileChosen}
          className="hidden"
        />
        <button
          type="button"
          disabled={pending}
          onClick={pickFile}
          className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold disabled:opacity-50"
        >
          {pending ? "..." : template ? "Vervang" : "Upload PDF"}
        </button>
        {template && (
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            className="text-xs px-2.5 py-1.5 rounded-md text-red-700 hover:bg-red-50 transition font-semibold disabled:opacity-50"
          >
            Verwijder
          </button>
        )}
      </div>
    </li>
  );
}
