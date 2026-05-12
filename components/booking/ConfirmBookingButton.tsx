"use client";

import { useTransition } from "react";
import { confirmBookingAction } from "@/lib/actions";

export default function ConfirmBookingButton({ bookingId, label = "Bevestig booking" }: { bookingId: string; label?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await confirmBookingAction(bookingId);
        })
      }
      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
    >
      {pending ? "Bezig…" : label}
    </button>
  );
}
