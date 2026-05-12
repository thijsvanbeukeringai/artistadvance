"use client";

import { useState, useTransition } from "react";
import { addFestivalDocumentAction, removeFestivalDocumentAction } from "@/lib/actions";
import type { DropboxFolder, FestivalDocument, FestivalDocumentCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<FestivalDocumentCategory, { label: string; folder: DropboxFolder }> = {
  timetable: { label: "Timetable (laatste versie)", folder: "00_GENERAL" },
  deal_memo: { label: "Deal memo", folder: "00_GENERAL" },
  contract: { label: "Contract", folder: "00_GENERAL" },
  stage_specs: { label: "Stage specs", folder: "01_STAGE" },
  stage_drawings: { label: "Stage drawings", folder: "01_STAGE" },
  stage_view: { label: "Stage view foto (front/back/side)", folder: "01_STAGE" },
  audio_specs: { label: "Audio specs venue", folder: "05_AUDIO" },
  monitor_specs: { label: "Monitor specs", folder: "05_AUDIO" },
  venue_light_specs: { label: "Venue light specs", folder: "02_LIGHTING" },
  patch_file: { label: "Patch file", folder: "02_LIGHTING" },
  wysiwyg: { label: "WYSIWYG file", folder: "02_LIGHTING" },
  grandma_showfile: { label: "GrandMA showfile", folder: "02_LIGHTING" },
  video_specs: { label: "Video specs stage", folder: "03_VIDEO" },
  pixel_mapping: { label: "Pixel mapping", folder: "03_VIDEO" },
  resolume_xml: { label: "Resolume XML", folder: "03_VIDEO" },
  laser_specs: { label: "Laser specs", folder: "06_LASER" },
  laser_positions: { label: "Laser posities tekening", folder: "06_LASER" },
  network_diagram: { label: "Network diagram", folder: "01_STAGE" },
  other: { label: "Overig document", folder: "00_GENERAL" },
};

const PRIORITY: FestivalDocumentCategory[] = [
  "timetable", "stage_specs", "stage_drawings", "stage_view",
  "patch_file", "wysiwyg", "venue_light_specs",
  "pixel_mapping", "resolume_xml", "video_specs",
  "audio_specs", "monitor_specs",
  "laser_specs", "laser_positions",
  "network_diagram", "deal_memo", "contract", "grandma_showfile", "other",
];

const FOLDER_TONE: Record<DropboxFolder, string> = {
  "00_GENERAL": "bg-ink-100 text-ink-700",
  "01_STAGE": "bg-sky-50 text-sky-700",
  "02_LIGHTING": "bg-amber-50 text-amber-700",
  "03_VIDEO": "bg-violet-50 text-violet-700",
  "04_SFX_PYRO": "bg-red-50 text-red-700",
  "05_AUDIO": "bg-emerald-50 text-emerald-700",
  "06_LASER": "bg-fuchsia-50 text-fuchsia-700",
  "07_TRAVEL": "bg-orange-50 text-orange-700",
  "08_SIGNED_RIDERS": "bg-ink-900 text-white",
};

export default function FestivalDocumentsBlock({
  token,
  documents,
}: {
  token: string;
  documents: FestivalDocument[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<FestivalDocumentCategory | null>(null);

  const grouped = new Map<FestivalDocumentCategory, FestivalDocument[]>();
  for (const d of documents) {
    const arr = grouped.get(d.category) ?? [];
    arr.push(d);
    grouped.set(d.category, arr);
  }

  const totalRequested = PRIORITY.length;
  const totalUploaded = grouped.size;

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-ink-900">Documenten van festival</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Upload venue specs, drawings, patch files. Elk document gaat automatisch naar de juiste Dropbox-map van management.
            </p>
          </div>
          <span className="text-xs text-ink-500 tabular-nums">
            {totalUploaded}/{totalRequested} categorieën met upload
          </span>
        </div>
      </header>

      <ul className="divide-y divide-ink-200">
        {PRIORITY.map((cat) => {
          const meta = CATEGORY_LABELS[cat];
          const docs = grouped.get(cat) ?? [];
          const isAdding = adding === cat;
          return (
            <li key={cat} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-900">{meta.label}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${FOLDER_TONE[meta.folder]}`}>
                      {meta.folder}
                    </span>
                    {docs.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-700">✓ {docs.length} upload{docs.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {docs.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {docs.map((d) => {
                        const url = d.url ?? null;
                        const fileEl = (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400 flex-shrink-0">
                              <path d="M14 2v6h6 M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            </svg>
                            <span className="font-mono truncate flex-1">{d.file_name}</span>
                          </>
                        );
                        return (
                          <li key={d.id} className="flex items-center gap-2 text-xs text-ink-700">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener"
                                className="flex items-center gap-2 flex-1 min-w-0 hover:underline text-brand-700"
                              >
                                {fileEl}
                              </a>
                            ) : (
                              <span className="flex items-center gap-2 flex-1 min-w-0">{fileEl}</span>
                            )}
                            {d.uploaded_by_name && <span className="text-[10px] text-ink-400">({d.uploaded_by_name})</span>}
                            <span className="text-[10px] text-ink-400 tabular-nums">{new Date(d.uploaded_at).toLocaleDateString("nl-NL")}</span>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => startTransition(() => { void removeFestivalDocumentAction(token, d.id); })}
                              className="text-[10px] text-red-600 font-semibold hover:underline disabled:opacity-50"
                            >
                              x
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAdding(isAdding ? null : cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-md transition whitespace-nowrap ${
                    isAdding
                      ? "bg-ink-100 text-ink-700"
                      : docs.length > 0
                        ? "border border-ink-200 text-ink-700 hover:bg-ink-50"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {isAdding ? "Annuleer" : docs.length > 0 ? "Nog een uploaden" : "Upload"}
                </button>
              </div>

              {isAdding && (
                <UploadForm
                  token={token}
                  category={cat}
                  onDone={() => setAdding(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UploadForm({
  token,
  category,
  onDone,
}: {
  token: string;
  category: FestivalDocumentCategory;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const meta = CATEGORY_LABELS[category];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!file) { setErr("Kies een bestand"); return; }
    const fd = new FormData(e.currentTarget);
    fd.set("token", token);
    fd.set("category", category);
    fd.set("file", file);
    startTransition(async () => {
      const r = await addFestivalDocumentAction(fd);
      if (r && !r.ok) {
        setErr(r.error ?? "Upload mislukt");
        return;
      }
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg space-y-3">
      <p className="text-[11px] text-emerald-900">
        Wordt automatisch gerouteerd naar Dropbox: <span className="font-mono font-bold">{meta.folder}/</span>
      </p>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1 block">Bestand *</span>
        <input
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full bg-white border border-emerald-200 rounded-md px-2.5 py-1.5 text-xs file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-emerald-700"
        />
        {file && (
          <span className="text-[10px] text-emerald-700 mt-1 block tabular-nums">
            {file.name} · {Math.round(file.size / 1024)} KB
          </span>
        )}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1 block">Wie heeft geüpload</span>
          <input
            name="uploaded_by_name"
            placeholder="Voor- en achternaam"
            className="w-full bg-white border border-emerald-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1 block">Notitie</span>
          <input
            name="notes"
            placeholder="Bv. 'v2 met aanpassingen'"
            className="w-full bg-white border border-emerald-200 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </label>
      </div>
      {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-white transition">Annuleer</button>
        <button type="submit" disabled={pending || !file} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
          {pending ? "Uploaden..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
