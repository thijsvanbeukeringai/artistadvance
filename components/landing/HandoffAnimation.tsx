"use client";

import { useEffect, useRef, useState } from "react";

export default function HandoffAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<"idle" | "confirming" | "moved">("idle");

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && phase === "idle") {
            setPhase("confirming");
            setTimeout(() => setPhase("moved"), 1200);
          }
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [phase]);

  function replay() {
    setPhase("idle");
    setTimeout(() => {
      setPhase("confirming");
      setTimeout(() => setPhase("moved"), 1200);
    }, 50);
  }

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto relative">
      {/* Left column = Bookings */}
      <div className="bg-canvas-mid border border-white/10 rounded-2xl p-5 min-h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider font-bold text-white/50">Bookings agency</span>
          <span className="text-[10px] text-white/30">pre-confirm</span>
        </div>
        <div className="space-y-2.5 relative">
          <BookingCardStatic title="Soundwave 2026" sub="Mainstage · 22:00" tag="3rd hold" />
          <BookingCardStatic title="Echo Beach" sub="Tent 2 · 23:30" tag="contract sent" />
          {/* Animated card */}
          {phase !== "moved" && (
            <div
              className={[
                "transition-all duration-[1100ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
                phase === "confirming" ? "translate-x-2 opacity-90" : "",
              ].join(" ")}
            >
              <BookingCard
                title="Mysteryland"
                sub="Main · 21:00 · Hardwell"
                state={phase === "confirming" ? "confirmed" : "hold"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right column = Advancing */}
      <div className="bg-canvas-mid border border-white/10 rounded-2xl p-5 min-h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-wider font-bold text-white/50">Advancing team</span>
          <span className="text-[10px] text-white/30">post-confirm</span>
        </div>
        <div className="space-y-2.5">
          <BookingCardStatic title="Festival X" sub="crew + 3 flights booked" tag="ready" tone="ok" />
          {/* Arrival */}
          <div
            className={[
              "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
              phase === "moved" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
            ].join(" ")}
          >
            <BookingCard
              title="Mysteryland"
              sub="Main · 21:00 · Hardwell"
              state="confirmed"
              fillIn={phase === "moved"}
            />
          </div>
        </div>
      </div>

      {/* Replay link */}
      <button
        type="button"
        onClick={replay}
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[11px] text-white/40 hover:text-white/80 underline"
      >
        replay
      </button>
    </div>
  );
}

function BookingCard({ title, sub, state, fillIn }: { title: string; sub: string; state: "hold" | "confirmed"; fillIn?: boolean }) {
  const tone = state === "confirmed" ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-400/40 bg-amber-400/10";
  return (
    <div className={`rounded-lg border ${tone} p-3`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white text-sm">{title}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
          state === "confirmed" ? "bg-emerald-500/30 text-emerald-100" : "bg-amber-400/30 text-amber-100"
        }`}>
          {state === "confirmed" ? "✓ confirmed" : "1st hold"}
        </span>
      </div>
      <div className="text-[11px] text-white/60 mt-0.5">{sub}</div>
      {fillIn && (
        <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-3 gap-1.5 text-[10px]">
          <Pill label="Crew × 5" />
          <Pill label="Hotel" />
          <Pill label="Flights" />
        </div>
      )}
    </div>
  );
}

function BookingCardStatic({ title, sub, tag, tone = "neutral" }: { title: string; sub: string; tag: string; tone?: "neutral" | "ok" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 opacity-60">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white text-sm">{title}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
          tone === "ok" ? "bg-emerald-500/30 text-emerald-100" : "bg-white/10 text-white/70"
        }`}>
          {tag}
        </span>
      </div>
      <div className="text-[11px] text-white/50 mt-0.5">{sub}</div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="bg-white/10 text-white/80 rounded px-1.5 py-1 text-center transition-opacity duration-700">
      {label}
    </span>
  );
}
