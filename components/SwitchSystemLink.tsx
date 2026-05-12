"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchSystemAction } from "@/lib/actions";

export default function SwitchSystemLink({ mode }: { mode: "agency" | "artist" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const target: "agency" | "artist" = mode === "artist" ? "agency" : "artist";

  function go() {
    start(async () => {
      const res = await switchSystemAction(target);
      if (res?.ok) {
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
        target === "artist"
          ? "bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-800 border border-violet-200 hover:from-violet-100 hover:to-fuchsia-100"
          : "bg-ink-100 text-ink-900 border border-ink-200 hover:bg-ink-200"
      }`}
      title="Wissel tussen agency en artist-systeem"
    >
      <span>{pending ? "Switching..." : target === "artist" ? "Naar Artist Team" : "Naar Bookings Agency"}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17l10-10 M7 7h10v10" />
      </svg>
    </button>
  );
}
