"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_KEY = "aa_cookie_consent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) setOpen(true);
  }, []);

  function accept(level: "all" | "essential") {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      COOKIE_KEY,
      JSON.stringify({ level, ts: Date.now() }),
    );
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-4">
      <div className="max-w-4xl mx-auto bg-canvas-mid border border-white/15 rounded-2xl shadow-2xl p-5 backdrop-blur-md">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start md:items-center">
          <div>
            <h3 className="font-bold text-white text-sm">Cookies & gegevens</h3>
            <p className="mt-1 text-[12px] text-white/70 leading-relaxed">
              Wij gebruiken alleen functionele cookies (login-sessie, account-keuze, voorkeur). Geen tracking, geen advertising-cookies. Wat we wel opslaan: jouw login en de bookings/festival-data die je in het platform invoert (versleuteld bij Supabase, hosted in de EU).
              {" "}
              <Link href="/landing#faq" className="underline text-neon-amber hover:text-neon-ember">Meer in de FAQ</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => accept("essential")}
              className="text-xs font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-3 py-2 rounded-md transition"
            >
              Alleen essentieel
            </button>
            <button
              type="button"
              onClick={() => accept("all")}
              className="text-xs font-semibold bg-neon-amber hover:bg-neon-ember text-canvas-deep px-3 py-2 rounded-md shadow-cta-glow transition"
            >
              Akkoord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
