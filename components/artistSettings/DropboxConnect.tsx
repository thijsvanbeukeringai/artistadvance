"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateArtistDropboxFolderAction } from "@/lib/actions";

export default function DropboxConnect({
  artistId,
  artistName,
  connected,
  accountEmail,
  rootFolder,
}: {
  artistId: string;
  artistName: string;
  connected: boolean;
  accountEmail: string | null;
  rootFolder: string | null;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const status = sp.get("dropbox");
  const msg = sp.get("msg");

  const [folder, setFolder] = useState<string>(rootFolder ?? "");
  const [savingFolder, startSaveFolder] = useTransition();
  const [disconnecting, startDisconnect] = useTransition();

  function onSaveFolder() {
    startSaveFolder(async () => {
      await updateArtistDropboxFolderAction(artistId, folder || null);
      router.refresh();
    });
  }

  function onDisconnect() {
    if (!confirm(`Dropbox koppeling voor ${artistName} verwijderen?`)) return;
    startDisconnect(async () => {
      const r = await fetch(`/api/dropbox/disconnect?artistId=${encodeURIComponent(artistId)}`, {
        method: "POST",
      });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {status === "ok" && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          Dropbox succesvol gekoppeld.
        </div>
      )}
      {status === "error" && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Koppelen faalde{msg ? `: ${decodeURIComponent(msg)}` : ""}.
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {connected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">Gekoppeld</span>
              </div>
              {accountEmail && (
                <div className="text-xs text-ink-500 mt-1 font-mono truncate">{accountEmail}</div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ink-300" />
                <span className="text-sm font-semibold text-ink-700">Niet gekoppeld</span>
              </div>
              <div className="text-xs text-ink-500 mt-1">
                Klik &quot;Koppel Dropbox&quot; om in te loggen. Alle toekomstige uploads voor {artistName} gaan dan
                automatisch naar de juiste map.
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <button
              type="button"
              disabled={disconnecting}
              onClick={onDisconnect}
              className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition font-semibold disabled:opacity-50"
            >
              {disconnecting ? "Bezig..." : "Ontkoppel"}
            </button>
          ) : (
            <a
              href={`/api/dropbox/connect?artistId=${encodeURIComponent(artistId)}`}
              className="text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-black transition font-semibold"
            >
              Koppel Dropbox
            </a>
          )}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-ink-700 mb-1 block">
          Root-map binnen Dropbox
        </label>
        <div className="flex items-center gap-2">
          <input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder={`/${artistName}`}
            className="flex-1 bg-white border border-ink-200 rounded-md px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <button
            type="button"
            onClick={onSaveFolder}
            disabled={savingFolder || folder === (rootFolder ?? "")}
            className="text-xs px-3 py-1.5 rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition font-semibold disabled:opacity-50"
          >
            {savingFolder ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
        <p className="text-[11px] text-ink-400 mt-1">
          Pad in de gekoppelde Dropbox-account waaronder show-mappen worden aangemaakt. Leeg = root.
        </p>
      </div>
    </div>
  );
}
