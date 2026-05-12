"use client";

import { useState, useTransition } from "react";
import { signInAction, signUpAction } from "./actions";

type Mode = "signin" | "signup";
type System = "agency" | "artist";

const COPY: Record<System, { signinTitle: string; signinIntro: string; signupTitle: string; signupIntro: string; accent: string }> = {
  agency: {
    signinTitle: "Bookings Agency · Sign in",
    signinIntro: "Toegang tot deal-flow, kalender en festivals.",
    signupTitle: "Bookings Agency · Account aanmaken",
    signupIntro: "De eerste account wordt super-admin. Daarna kun je via /admin nieuwe leden toevoegen.",
    accent: "bg-ink-900 hover:bg-black",
  },
  artist: {
    signinTitle: "Artist Team · Sign in",
    signinIntro: "Toegang tot advancing, crew, riders en callsheets.",
    signupTitle: "Artist Team · Account aanmaken",
    signupIntro: "Voor productieleden van een artist. Vraag de agency-admin om een uitnodiging.",
    accent: "bg-gradient-to-r from-violet-700 to-fuchsia-700 hover:from-violet-800 hover:to-fuchsia-800",
  },
};

export default function LoginForm({
  next,
  initialMode,
  system = "agency",
}: {
  next: string;
  initialMode: Mode;
  system?: System;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const copy = COPY[system];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("next", next);
    formData.set("system", system);
    start(async () => {
      const action = mode === "signin" ? signInAction : signUpAction;
      const result = await action(formData);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
      <h1 className="text-xl font-extrabold text-ink-900">
        {mode === "signin" ? copy.signinTitle : copy.signupTitle}
      </h1>
      <p className="text-xs text-ink-500 mt-1">
        {mode === "signin" ? copy.signinIntro : copy.signupIntro}
      </p>

      <form onSubmit={onSubmit} className="space-y-3 mt-5">
        {mode === "signup" && (
          <label className="block">
            <span className="text-xs font-semibold text-ink-700">Naam</span>
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
            />
          </label>
        )}

        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Wachtwoord</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        {error && (
          <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`w-full px-3 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-50 ${copy.accent}`}
        >
          {pending ? "Bezig..." : mode === "signin" ? "Sign in" : "Account aanmaken"}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-ink-500">
        {mode === "signin" ? (
          <>
            Nog geen account?{" "}
            <button onClick={() => setMode("signup")} className="font-semibold text-brand-700 hover:underline">
              Maak er een aan
            </button>
          </>
        ) : (
          <>
            Heb je al een account?{" "}
            <button onClick={() => setMode("signin")} className="font-semibold text-brand-700 hover:underline">
              Sign in
            </button>
          </>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-ink-100 text-center text-[11px] text-ink-400">
        {system === "agency" ? (
          <>Werk je in het artist/advancing team? <a href="/login/artist" className="font-semibold text-violet-700 hover:underline">Login hier</a></>
        ) : (
          <>Werk je in de booking-agency? <a href="/login" className="font-semibold text-ink-900 hover:underline">Login hier</a></>
        )}
      </div>
    </div>
  );
}
