"use client";

import { useEffect, useState, useTransition } from "react";

type DeleteAction = (id: string, confirmName: string) => Promise<{ ok: false; error: string } | void>;

export default function DeleteConfirm({
  id,
  name,
  noun,
  consequences,
  action,
  size = "icon",
}: {
  id: string;
  name: string;
  noun: string;
  consequences: string[];
  action: DeleteAction;
  size?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const matches = typed.trim() === name;

  function close() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function submit() {
    if (!matches) return;
    setError(null);
    start(async () => {
      const result = await action(id, typed);
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title={`Verwijder ${noun}`}
        aria-label={`Verwijder ${noun} ${name}`}
        className={
          size === "icon"
            ? "p-2 rounded-md text-ink-400 hover:bg-red-50 hover:text-red-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            : "inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition"
        }
      >
        <svg width={size === "icon" ? "16" : "14"} height={size === "icon" ? "16" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6" />
        </svg>
        {size === "button" && <span>Verwijder</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            className="bg-white border border-ink-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-4 border-b border-ink-200 bg-red-50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 grid place-items-center text-red-700 flex-shrink-0" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M12 9v4 M12 17h.01 M10.29 3.86l-8.18 14.18A2 2 0 003.83 21h16.34a2 2 0 001.72-2.96L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 id="delete-confirm-title" className="font-bold text-ink-900 text-sm">Verwijder {noun} permanent</h3>
                  <p className="text-xs text-ink-700 mt-0.5 break-words">
                    "{name}"
                  </p>
                </div>
              </div>
            </header>

            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-ink-700">Deze actie wist het volgende permanent:</p>
              <ul className="text-xs text-ink-700 space-y-1 list-disc pl-5">
                {consequences.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>

              <div className="pt-2">
                <label className="text-[11px] font-semibold text-ink-700 mb-1.5 block">
                  Typ <span className="font-mono bg-ink-100 px-1.5 py-0.5 rounded text-ink-900">{name}</span> om te bevestigen
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={name}
                  autoFocus
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              {error && (
                <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
                  {error}
                </div>
              )}
            </div>

            <footer className="px-5 py-3 border-t border-ink-200 bg-ink-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-ink-700 hover:bg-ink-100 transition disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!matches || pending}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {pending ? "Verwijderen..." : "Definitief verwijderen"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
