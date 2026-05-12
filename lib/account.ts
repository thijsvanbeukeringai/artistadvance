// Account context. In dev/demo: cookie-based switcher. Met Auth:
// - Sessie ophalen via supabaseServer().auth.getUser()
// - users-row matchen via auth_id -> krijgt organization_id + role
// - super_admin mag impersonaten via cookies; anderen zijn vast aan eigen org.

import { cache } from "react";
import { cookies } from "next/headers";
import { supabaseServer } from "./supabase-server";
import { loadSnapshot } from "./snapshot";

export type AccountMode = "artist" | "agency";
export type AccountRole =
  | "super_admin"
  | "agency_admin"
  | "agency_member"
  | "advancing_member"
  | "festival_admin"
  | "festival_member"
  | "guest";

/**
 * Booking-agency-medewerkers werken alleen tot "confirm" — daarna gaat
 * een show naar het advancing-team (een aparte rol). Alleen agency_admin,
 * advancing_member en super_admin hebben toegang tot de advancing-flow.
 */
export function canAccessAdvancing(role: AccountRole): boolean {
  return role === "super_admin" || role === "agency_admin" || role === "advancing_member";
}

export interface AccountContext {
  mode: AccountMode;
  artistId: string | null;
  organizationId: string | null;
  label: string;
  sublabel: string;
  role: AccountRole;
  userEmail: string | null;
  userName: string | null;
  canImpersonate: boolean;
}

const COOKIE_MODE = "aa_account_mode";
const COOKIE_ID = "aa_account_id";

const GUEST: AccountContext = {
  mode: "agency",
  artistId: null,
  organizationId: null,
  label: "Niet aangemeld",
  sublabel: "Geen sessie",
  role: "guest",
  userEmail: null,
  userName: null,
  canImpersonate: false,
};

export const readAccount = cache(async (): Promise<AccountContext> => {
  // Lokale dev-bypass: hardcoded super_admin context, geen DB-lookup nodig.
  if (process.env.DEV_AUTH_BYPASS === "1") {
    const HARDCODED_EMAIL = "thijsvanbeukering@icloud.com";
    const HARDCODED_ORG_ID = "e0de2820-e4f4-40a6-b342-5cbe23579471";
    const jar = cookies();
    const modeCookie = (jar.get(COOKIE_MODE)?.value as AccountMode | undefined) ?? "agency";
    const idCookie = jar.get(COOKIE_ID)?.value;

    // Try snapshot voor labels — als die crasht, fallback naar bare context
    try {
      const { loadSnapshot } = await import("./snapshot");
      const snap = await loadSnapshot();
      if (modeCookie === "artist") {
        const artist = snap.artists.find((a) => a.id === idCookie) ?? snap.artists[0];
        if (artist) {
          const org = snap.organizations.find((o) => o.id === artist.organization_id);
          return {
            mode: "artist",
            artistId: artist.id,
            organizationId: artist.organization_id,
            label: artist.name,
            sublabel: org?.name ?? "Artist",
            role: "super_admin",
            userEmail: HARDCODED_EMAIL,
            userName: "Thijs (dev)",
            canImpersonate: true,
          };
        }
      }
      const managementOrgs = snap.organizations.filter((o) => o.type === "management");
      const org = managementOrgs.find((o) => o.id === idCookie) ?? managementOrgs.find((o) => o.id === HARDCODED_ORG_ID) ?? managementOrgs[0];
      return {
        mode: "agency",
        artistId: null,
        organizationId: org?.id ?? HARDCODED_ORG_ID,
        label: org?.name ?? "Super-admin (dev)",
        sublabel: "DEV_AUTH_BYPASS actief",
        role: "super_admin",
        userEmail: HARDCODED_EMAIL,
        userName: "Thijs (dev)",
        canImpersonate: true,
      };
    } catch {
      return {
        mode: "agency",
        artistId: null,
        organizationId: HARDCODED_ORG_ID,
        label: "Super-admin (dev)",
        sublabel: "DEV_AUTH_BYPASS actief",
        role: "super_admin",
        userEmail: HARDCODED_EMAIL,
        userName: "Thijs (dev)",
        canImpersonate: true,
      };
    }
  }

  const c = supabaseServer();
  if (!c) return GUEST;

  const { data: { user } } = await c.auth.getUser();
  if (!user) return GUEST;

  // Resolve users row via service-role (RLS bypass) — anon/authenticated kan
  // de users-tabel niet lezen na lockdown.
  const { supabaseService } = await import("./supabase-service");
  const svc = supabaseService();
  const { data: profile } = await svc
    .from("users")
    .select("id, name, email, role, organization_id")
    .eq("auth_id", user.id)
    .maybeSingle();

  const role: AccountRole = (profile?.role as AccountRole) ?? "guest";
  const isSuperAdmin = role === "super_admin";

  const snap = await loadSnapshot();
  const jar = cookies();
  const modeCookie = (jar.get(COOKIE_MODE)?.value as AccountMode | undefined) ?? "agency";
  const idCookie = jar.get(COOKIE_ID)?.value;

  // Super-admin: gebruik cookies om te impersonaten.
  if (isSuperAdmin) {
    if (modeCookie === "artist") {
      const artist = snap.artists.find((a) => a.id === idCookie) ?? snap.artists[0];
      if (!artist) {
        return {
          ...GUEST,
          role,
          userEmail: user.email ?? null,
          userName: profile?.name ?? null,
          canImpersonate: true,
          mode: "agency",
          label: "Super-admin",
          sublabel: "Geen artiesten in seed",
        };
      }
      const org = snap.organizations.find((o) => o.id === artist.organization_id);
      return {
        mode: "artist",
        artistId: artist.id,
        organizationId: artist.organization_id,
        label: artist.name,
        sublabel: org?.name ?? "Artist",
        role,
        userEmail: user.email ?? null,
        userName: profile?.name ?? null,
        canImpersonate: true,
      };
    }
    const managementOrgs = snap.organizations.filter((o) => o.type === "management");
    const org = managementOrgs.find((o) => o.id === idCookie) ?? managementOrgs[0];
    return {
      mode: "agency",
      artistId: null,
      organizationId: org?.id ?? null,
      label: org?.name ?? "Super-admin",
      sublabel: "Super-admin · impersonating",
      role,
      userEmail: user.email ?? null,
      userName: profile?.name ?? null,
      canImpersonate: true,
    };
  }

  // Agency-member: vast aan eigen org.
  const orgId = profile?.organization_id ?? null;
  const org = orgId ? snap.organizations.find((o) => o.id === orgId) : null;
  if (modeCookie === "artist" && idCookie) {
    const artist = snap.artists.find((a) => a.id === idCookie && a.organization_id === orgId);
    if (artist) {
      return {
        mode: "artist",
        artistId: artist.id,
        organizationId: orgId,
        label: artist.name,
        sublabel: org?.name ?? "Artist",
        role,
        userEmail: user.email ?? null,
        userName: profile?.name ?? null,
        canImpersonate: false,
      };
    }
  }
  return {
    mode: "agency",
    artistId: null,
    organizationId: orgId,
    label: org?.name ?? profile?.name ?? "Agency",
    sublabel: org?.dropbox_root_folder ?? "Management agency",
    role,
    userEmail: user.email ?? null,
    userName: profile?.name ?? null,
    canImpersonate: false,
  };
});

export async function listAccountChoices() {
  const snap = await loadSnapshot();
  const managementOrgs = snap.organizations.filter((o) => o.type === "management");
  return {
    agencies: managementOrgs.map((o) => ({ id: o.id, name: o.name })),
    artists: snap.artists.map((a) => ({ id: a.id, name: a.name, organizationId: a.organization_id })),
  };
}

/**
 * Geef de artiest-IDs terug die binnen huidige modus zichtbaar zijn.
 */
export function scopedArtistIds(account: AccountContext, allArtists: { id: string; organization_id: string }[]): Set<string> {
  if (account.mode === "artist") {
    return new Set(account.artistId ? [account.artistId] : []);
  }
  return new Set(allArtists.filter((a) => a.organization_id === account.organizationId).map((a) => a.id));
}
