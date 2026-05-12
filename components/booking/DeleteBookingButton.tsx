"use client";

import { useState, useTransition } from "react";
import { deleteBookingAction } from "@/lib/actions";

export default function DeleteBookingButton({ bookingId, artistId }: { bookingId: string; artistId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function fire() {
    setError(null);
    start(async () => {
      const result = await deleteBookingAction(bookingId, artistId);
      if (result && result.ok === false) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Verwijder draft-booking"
        className="p-1.5 rounded text-ink-400 hover:bg-red-50 hover:text-red-600 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {error ? (
        <span className="text-[11px] text-red-700 max-w-[200px]">{error}</span>
      ) : (
        <span className="text-[11px] text-red-700 font-semibold">Zeker weten?</span>
      )}
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        disabled={pending}
        className="text-[11px] px-2 py-1 rounded text-ink-700 hover:bg-ink-100 disabled:opacity-50"
      >
        Nee
      </button>
      {!error && (
        <button
          type="button"
          onClick={fire}
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "..." : "Ja, wis"}
        </button>
      )}
    </div>
  );
}
