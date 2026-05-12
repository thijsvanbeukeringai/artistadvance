/**
 * Centrale datum/tijd-formatters die ALTIJD Europe/Amsterdam gebruiken,
 * zodat UI (client-side, browser-TZ) en PDF (server-side, Vercel UTC)
 * hetzelfde resultaat geven.
 *
 * Reden: datetimes worden in UTC opgeslagen (toISOString uit datetime-local
 * input). Zonder expliciete timeZone-optie rendert Node/Vercel in UTC en
 * de browser in de lokale TZ van de gebruiker. Voor agencies + festivals in
 * NL/BE/DE willen we Europe/Amsterdam als bron-of-truth.
 */

const TZ = "Europe/Amsterdam";

/**
 * Vandaag als "YYYY-MM-DD" in Europe/Amsterdam.
 *
 * NIET gebruiken: `new Date().toISOString().slice(0, 10)` — dat is UTC en
 * loopt rond middernacht in CEST/CET een dag uit de pas.
 */
export function todayAmsterdamIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/**
 * "YYYY-MM-DD" voor een Date in Europe/Amsterdam. Gebruikt lokale getters
 * (geen toISOString) zodat de datum niet schuift bij TZ-conversie.
 */
export function isoDayAmsterdam(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** "HH:MM" (24-uur). */
export function formatTimeNL(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** "dd-mm-yyyy" of leeg. */
export function formatDateNL(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("nl-NL", { timeZone: TZ });
}

/** Korte datum: "dd MMM" (08 aug). */
export function formatDateShortNL(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    timeZone: TZ,
  });
}

/** Volledig: "dd-mm-yyyy HH:MM". */
export function formatDateTimeNL(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("nl-NL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TZ,
  });
}

/** Lange weekdag + datum: "vrijdag 08 augustus 2026". */
export function formatLongDateNL(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}
