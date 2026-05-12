"use client";

import { useState, useTransition } from "react";
import { signRiderInPortalAction, uploadSignedRiderAction } from "@/lib/actions";
import type { SignedRider } from "@/lib/types";
import { humanStatus } from "@/components/StatusPill";

const RIDER_LABELS: Record<string, string> = {
  technical: "Technische rider",
  hospitality: "Hospitality rider",
  sfx_pyro: "SFX/Pyro rider",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-ink-100 text-ink-700",
  sent_to_festival: "bg-sky-50 text-sky-700",
  signed: "bg-emerald-50 text-emerald-700",
  accepted: "bg-emerald-50 text-emerald-700",
  disputed: "bg-red-50 text-red-700",
};

export default function SignedRidersBlock({
  token,
  riders,
}: {
  token: string;
  riders: SignedRider[];
}) {
  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-200">
        <h3 className="font-bold text-ink-900">Riders</h3>
        <p className="text-xs text-ink-500 mt-0.5">Bekijk het document, teken digitaal of upload een PDF met handtekening.</p>
      </header>
      <ul className="divide-y divide-ink-200">
        {riders.length === 0 && (
          <li className="px-5 py-6 text-sm text-ink-500">Geen rider records voor deze advancing.</li>
        )}
        {riders.map((r) => (
          <RiderRow key={r.id} token={token} rider={r} />
        ))}
      </ul>
    </section>
  );
}

type Mode = "closed" | "view" | "sign" | "upload";

function RiderRow({ token, rider }: { token: string; rider: SignedRider }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("closed");
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("Production Manager");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const signedUrl = rider.signed_url ?? null;

  function close() { setMode("closed"); setErr(null); }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!signerName.trim()) { setErr("Naam verplicht"); return; }
    if (!file) { setErr("Kies een PDF"); return; }
    const fd = new FormData();
    fd.set("token", token);
    fd.set("rider_type", rider.rider_type);
    fd.set("signer_name", signerName.trim());
    fd.set("signer_role", signerRole.trim());
    fd.set("file", file);
    startTransition(async () => {
      const r = await uploadSignedRiderAction(fd);
      if (r && !r.ok) { setErr(r.error ?? "Upload mislukt"); return; }
      close();
    });
  }

  function handleSign() {
    if (!signerName.trim()) return;
    startTransition(async () => {
      await signRiderInPortalAction(token, rider.rider_type, signerName.trim(), signerRole.trim() || undefined);
      close();
    });
  }

  return (
    <li className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink-900">
            {RIDER_LABELS[rider.rider_type] ?? rider.rider_type}
            {rider.version && rider.version > 1 && (
              <span className="ml-2 text-[10px] font-bold uppercase bg-ink-100 text-ink-700 px-1.5 py-0.5 rounded">v{rider.version}</span>
            )}
          </div>
          {rider.signed_by_name && (
            <div className="text-[11px] text-emerald-700 mt-0.5">
              ✓ Getekend door <span className="font-bold">{rider.signed_by_name}</span>
              {rider.signed_by_role && <span> ({rider.signed_by_role})</span>}
              {rider.signed_at && <span className="text-ink-500 ml-1">op {new Date(rider.signed_at).toLocaleString("nl-NL")}</span>}
              {rider.signed_method === "in_portal" && <span className="ml-2 text-[10px] uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">digitaal</span>}
              {rider.signed_method === "uploaded_pdf" && <span className="ml-2 text-[10px] uppercase bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">PDF</span>}
            </div>
          )}
          {rider.festival_notes && rider.signed_method === "uploaded_pdf" && (
            <div className="text-[11px] text-ink-500 mt-0.5 font-mono">{rider.festival_notes}</div>
          )}
          {rider.dispute_notes && (
            <div className="text-xs text-red-600 mt-0.5 italic">{rider.dispute_notes}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_TONE[rider.status]}`}>
            {humanStatus(rider.status)}
          </span>
          <button type="button" onClick={() => setMode(mode === "view" ? "closed" : "view")} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition">
            Bekijk
          </button>
          {(rider.status === "pending" || rider.status === "sent_to_festival" || rider.status === "disputed") && (
            <>
              <button type="button" onClick={() => setMode(mode === "sign" ? "closed" : "sign")} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition">
                Teken digitaal
              </button>
              <button type="button" onClick={() => setMode(mode === "upload" ? "closed" : "upload")} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition">
                Upload PDF
              </button>
            </>
          )}
        </div>
      </div>

      {mode === "view" && (
        <div className="mt-3 p-4 bg-ink-50 rounded-lg border border-ink-200">
          <div className="flex items-start gap-3">
            <div className="w-12 h-14 bg-white border border-ink-200 rounded grid place-items-center text-[10px] font-bold text-ink-500">PDF</div>
            <div className="flex-1">
              <div className="font-semibold text-ink-900 text-sm">{rider.signed_rider_file_name ?? RIDER_LABELS[rider.rider_type]}</div>
              <div className="text-xs text-ink-500 mt-0.5">
                {signedUrl
                  ? "Getekende PDF in Supabase Storage. Open in nieuwe tab."
                  : "Nog geen getekende PDF geupload. Origineel komt nog van management."}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {signedUrl ? (
                  <a href={signedUrl} target="_blank" rel="noopener" className="text-xs font-semibold text-brand-600 hover:underline">
                    Open document →
                  </a>
                ) : (
                  <span className="text-[10px] text-ink-400">Origineel-link komt zodra management de template upload.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "sign" && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSign(); }}
          className="mt-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Digitaal tekenen</div>
          <p className="text-sm text-emerald-900">
            Door hier te tekenen, bevestig je namens het festival dat deze {RIDER_LABELS[rider.rider_type].toLowerCase()} is geaccepteerd.
            Naam + tijdstip worden vastgelegd.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-emerald-900 mb-1 block">Volledige naam *</span>
              <input required autoFocus value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Voor- en achternaam" className="w-full bg-white border border-emerald-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-emerald-900 mb-1 block">Rol</span>
              <input value={signerRole} onChange={(e) => setSignerRole(e.target.value)} placeholder="Production Manager" className="w-full bg-white border border-emerald-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </label>
          </div>
          <div className="bg-white border border-emerald-200 rounded p-3 text-[11px] text-ink-700 font-mono">
            <div>Document: {RIDER_LABELS[rider.rider_type]}</div>
            <div>Tekent: <span className="text-emerald-700 font-bold">{signerName || "-"}</span>{signerRole ? `, ${signerRole}` : ""}</div>
            <div>Tijdstip: <span className="tabular-nums">{new Date().toLocaleString("nl-NL")}</span> (NU)</div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={close} className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-white transition">Annuleer</button>
            <button type="submit" disabled={pending || !signerName.trim()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
              {pending ? "Tekenen…" : "✓ Teken hier"}
            </button>
          </div>
        </form>
      )}

      {mode === "upload" && (
        <form onSubmit={handleUpload} className="mt-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Upload getekende PDF</div>
          <label className="block">
            <span className="text-xs font-semibold text-emerald-900 mb-1 block">PDF bestand *</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full bg-white border border-emerald-200 rounded-md px-2.5 py-1.5 text-xs file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-emerald-700"
            />
            {file && (
              <span className="text-[10px] text-emerald-700 mt-1 block tabular-nums">{file.name} · {Math.round(file.size / 1024)} KB</span>
            )}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-emerald-900 mb-1 block">Naam ondertekenaar *</span>
              <input required value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Voor- en achternaam" className="w-full bg-white border border-emerald-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-emerald-900 mb-1 block">Rol</span>
              <input value={signerRole} onChange={(e) => setSignerRole(e.target.value)} className="w-full bg-white border border-emerald-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </label>
          </div>
          {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{err}</div>}
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={close} className="px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-white transition">Annuleer</button>
            <button type="submit" disabled={pending || !signerName.trim() || !file} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
              {pending ? "Uploaden..." : "Verzenden"}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
