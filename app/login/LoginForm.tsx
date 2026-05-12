"use client";

import { useState, useTransition } from "react";
import { signInAction, signUpAction } from "./actions";

type Mode = "signin" | "signup";

export default function LoginForm({ next, initialMode }: { next: string; initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("next", next);
    start(async () => {
      const action = mode === "signin" ? signInAction : signUpAction;
      const result = await action(formData);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
      <h1 className="text-xl font-extrabold text-ink-900">
        {mode === "signin" ? "Sign in" : "Account aanmaken"}
      </h1>
      <p className="text-xs text-ink-500 mt-1">
        {mode === "signin"
          ? "Toegang tot je workspace."
          : "De eerste account wordt super-admin. Daarna kun je vanuit /admin nieuwe agency-leden toevoegen."}
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
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full px-3 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50"
        >
          {pending ? "Bezig..." : mode === "signin" ? "Sign in" : "Account aanmaken"}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-ink-500">
        {mode === "signin" ? (
          <>
            Nog geen account?{" "}
            <button onClick={() => setMode("signup")} className="font-semibold text-brand-600 hover:underline">
              Maak er een aan
            </button>
          </>
        ) : (
          <>
            Heb je al een account?{" "}
            <button onClick={() => setMode("signin")} className="font-semibold text-brand-600 hover:underline">
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
