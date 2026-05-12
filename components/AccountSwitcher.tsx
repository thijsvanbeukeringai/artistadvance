"use client";

import { useState, useTransition } from "react";
import { setAccountAction } from "@/lib/actions";

type Choice = { id: string; name: string; organizationId?: string };

export default function AccountSwitcher({
  mode,
  currentId,
  agencies,
  artists,
  label,
  sublabel,
}: {
  mode: "artist" | "agency";
  currentId: string | null;
  agencies: Choice[];
  artists: Choice[];
  label: string;
  sublabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(nextMode: "artist" | "agency", id: string) {
    startTransition(async () => {
      await setAccountAction(nextMode, id);
      setOpen(false);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1.5 rounded-lg border border-ink-200 bg-white hover:border-brand-400 hover:shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 max-w-[60vw] sm:max-w-none"
      >
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider flex-shrink-0 ${
          mode === "artist" ? "bg-brand-50 text-brand-700" : "bg-ink-900 text-white"
        }`}>
          {mode}
        </span>
        <div className="text-left leading-tight min-w-0">
          <div className="text-sm font-semibold text-ink-900 truncate">{label}</div>
          <div className="hidden sm:block text-[10px] text-ink-400 truncate max-w-[180px]">{sublabel}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400 flex-shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="sluiten"
            className="fixed inset-0 z-40"
          />
          <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white border border-ink-200 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 pt-3 pb-2 border-b border-ink-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Workspace switcher</div>
              <p className="text-[11px] text-ink-400 mt-0.5">Kies of je per artiest of per agency werkt.</p>
            </div>

            <div className="px-4 py-3 border-b border-ink-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-700 mb-2">Agency view</div>
              <ul className="space-y-1">
                {agencies.map((a) => {
                  const active = mode === "agency" && currentId === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => pick("agency", a.id)}
                        className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition disabled:opacity-50 ${
                          active ? "bg-ink-900 text-white font-semibold" : "hover:bg-ink-100 text-ink-700"
                        }`}
                      >
                        <span className="truncate">{a.name}</span>
                        {active && <span className="text-[10px] font-bold uppercase">actief</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-700 mb-2">Artist view</div>
              <ul className="space-y-1 max-h-60 overflow-y-auto">
                {artists.map((a) => {
                  const active = mode === "artist" && currentId === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => pick("artist", a.id)}
                        className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition disabled:opacity-50 ${
                          active ? "bg-brand-500 text-white font-semibold" : "hover:bg-ink-100 text-ink-700"
                        }`}
                      >
                        <span className="truncate">{a.name}</span>
                        {active && <span className="text-[10px] font-bold uppercase">actief</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
