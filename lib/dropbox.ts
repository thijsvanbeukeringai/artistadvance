import "server-only";
import { supabaseService } from "./supabase-service";

// ============================================================================
// Dropbox API helper - per-artist OAuth, file upload, folder structure.
// ============================================================================
//
// Setup (.env.local):
//   DROPBOX_APP_KEY=...
//   DROPBOX_APP_SECRET=...
//   DROPBOX_REDIRECT_URI=http://localhost:3010/api/dropbox/callback
//
// Dropbox App Console (https://www.dropbox.com/developers/apps):
//   - Scoped access, "Full Dropbox" (zodat management agency een eigen
//     bestaande mappenstructuur kan gebruiken).
//   - Permissions: files.content.write, files.content.read, files.metadata.read,
//     account_info.read.
//   - Redirect URI = DROPBOX_REDIRECT_URI.
//
// OAuth flow: token_access_type=offline → access_token (4h) + refresh_token.
// refresh_token wordt opgeslagen per artist; access_token wordt automatisch
// ververst door getValidAccessToken().

const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const RPC = "https://api.dropboxapi.com/2";
const CONTENT = "https://content.dropboxapi.com/2";

export const DROPBOX_FOLDER_STRUCTURE = [
  "00_GENERAL",
  "01_STAGE",
  "02_LIGHTING",
  "03_VIDEO",
  "04_SFX_PYRO",
  "05_AUDIO",
  "06_LASER",
  "07_TRAVEL",
  "08_SIGNED_RIDERS",
] as const;

export type DropboxConfigStatus =
  | { ok: true; appKey: string; appSecret: string }
  | { ok: false; reason: string };

export function getDropboxAppConfig(): DropboxConfigStatus {
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (!appKey || !appSecret) {
    return {
      ok: false,
      reason: "DROPBOX_APP_KEY / DROPBOX_APP_SECRET niet gezet in .env.local",
    };
  }
  return { ok: true, appKey, appSecret };
}

/**
 * Bouwt de redirect URI uit de huidige request origin (productie of localhost).
 * Override mogelijk via DROPBOX_REDIRECT_URI env var.
 *
 * Belangrijk: het pad MOET in de Dropbox App Console als "Allowed redirect URI"
 * staan voor elke origin (localhost + productiedomein).
 */
export function getRedirectUri(origin: string): string {
  if (process.env.DROPBOX_REDIRECT_URI) return process.env.DROPBOX_REDIRECT_URI;
  return `${origin.replace(/\/$/, "")}/api/dropbox/callback`;
}

export function buildAuthorizeUrl(state: string, origin: string): string | null {
  const cfg = getDropboxAppConfig();
  if (!cfg.ok) return null;
  const params = new URLSearchParams({
    client_id: cfg.appKey,
    response_type: "code",
    redirect_uri: getRedirectUri(origin),
    token_access_type: "offline",
    // Dwingt Dropbox om het account-keuze scherm te tonen. Zonder dit pakt
    // Dropbox automatisch de laatst-ingelogde account, waardoor je niet per
    // artiest een ander Dropbox-account kunt kiezen in dezelfde browser.
    force_reapprove: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

// ============================================================================
// Token management
// ============================================================================

type ArtistTokenRow = {
  id: string;
  dropbox_access_token: string | null;
  dropbox_refresh_token: string | null;
  dropbox_token_expires_at: string | null;
  dropbox_artist_folder: string | null;
};

async function loadArtistTokens(artistId: string): Promise<ArtistTokenRow | null> {
  const c = supabaseService();
  const { data, error } = await c
    .from("artists")
    .select("id, dropbox_access_token, dropbox_refresh_token, dropbox_token_expires_at, dropbox_artist_folder")
    .eq("id", artistId)
    .maybeSingle();
  if (error) throw error;
  return (data as ArtistTokenRow | null) ?? null;
}

export async function isArtistConnected(artistId: string): Promise<boolean> {
  const row = await loadArtistTokens(artistId);
  return !!row?.dropbox_refresh_token;
}

export async function exchangeCodeForTokens(code: string, origin: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  account_id: string;
}> {
  const cfg = getDropboxAppConfig();
  if (!cfg.ok) throw new Error(cfg.reason);
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: cfg.appKey,
    client_secret: cfg.appSecret,
    redirect_uri: getRedirectUri(origin),
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`Dropbox token exchange faalde: ${r.status} ${await r.text()}`);
  return r.json();
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const cfg = getDropboxAppConfig();
  if (!cfg.ok) throw new Error(cfg.reason);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.appKey,
    client_secret: cfg.appSecret,
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`Dropbox refresh faalde: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function saveArtistTokens(
  artistId: string,
  tokens: { access_token: string; refresh_token: string; expires_in: number; account_email?: string },
): Promise<void> {
  const c = supabaseService();
  const expiresAt = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString();
  const patch: Record<string, unknown> = {
    dropbox_access_token: tokens.access_token,
    dropbox_refresh_token: tokens.refresh_token,
    dropbox_token_expires_at: expiresAt,
  };
  if (tokens.account_email) patch.dropbox_account_email = tokens.account_email;
  const { error } = await c.from("artists").update(patch).eq("id", artistId);
  if (error) throw error;
}

export async function disconnectArtist(artistId: string): Promise<void> {
  const c = supabaseService();
  const { error } = await c.from("artists").update({
    dropbox_access_token: null,
    dropbox_refresh_token: null,
    dropbox_token_expires_at: null,
    dropbox_account_email: null,
  }).eq("id", artistId);
  if (error) throw error;
}

/** Geeft een geldig access_token; ververst indien nodig. Throwt als artist niet gekoppeld. */
export async function getValidAccessToken(artistId: string): Promise<string> {
  const row = await loadArtistTokens(artistId);
  if (!row?.dropbox_refresh_token) {
    throw new Error("artist not connected to Dropbox");
  }
  const stillValid =
    row.dropbox_access_token &&
    row.dropbox_token_expires_at &&
    new Date(row.dropbox_token_expires_at).getTime() > Date.now() + 30_000;
  if (stillValid) return row.dropbox_access_token!;

  const fresh = await refreshAccessToken(row.dropbox_refresh_token);
  const expiresAt = new Date(Date.now() + (fresh.expires_in - 60) * 1000).toISOString();
  const c = supabaseService();
  await c.from("artists").update({
    dropbox_access_token: fresh.access_token,
    dropbox_token_expires_at: expiresAt,
  }).eq("id", artistId);
  return fresh.access_token;
}

export async function getCurrentAccountEmail(accessToken: string): Promise<string | null> {
  const r = await fetch(`${RPC}/users/get_current_account`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.email ?? null;
}

// ============================================================================
// Folder operations
// ============================================================================

function joinPath(...parts: Array<string | null | undefined>): string {
  const cleaned = parts
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map((p) => p.replace(/^\/+|\/+$/g, ""));
  const joined = cleaned.join("/");
  return joined ? `/${joined}` : "";
}

/** Vervangt karakters die Dropbox afkeurt in pad-segmenten. */
function safeFolderSegment(name: string): string {
  return name
    .replace(/[\/\\?<>:*|"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Bouwt de show-folder naam: "{Festival} - {YYYY-MM-DD} - {City}". */
export function buildShowFolderName(input: { festival_name: string; show_date?: string; city?: string }): string {
  const parts: string[] = [];
  parts.push(safeFolderSegment(input.festival_name) || "Show");
  if (input.show_date) parts.push(input.show_date);
  if (input.city) parts.push(safeFolderSegment(input.city));
  return parts.join(" - ");
}

export async function createFolder(accessToken: string, path: string, autorename = false): Promise<void> {
  if (!path) return;
  const r = await fetch(`${RPC}/files/create_folder_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path, autorename }),
  });
  if (r.ok) return;
  const text = await r.text();
  // 409 = path/conflict (al bestaand). Negeren.
  if (r.status === 409 && /path/.test(text)) return;
  throw new Error(`Dropbox create_folder faalde: ${r.status} ${text}`);
}

export async function createFolderBatch(accessToken: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const r = await fetch(`${RPC}/files/create_folder_batch_v2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paths, autorename: false, force_async: false }),
  });
  if (!r.ok) throw new Error(`Dropbox create_folder_batch_v2 faalde: ${r.status} ${await r.text()}`);
}

/**
 * Maakt de complete show-mappenstructuur aan onder de artist-root. Idempotent:
 * een 409 (folder bestaat al) wordt genegeerd. Returns het volledige show-pad
 * relatief aan de Dropbox-root van de artiest.
 */
export async function createShowStructure(
  artistId: string,
  showFolderName: string,
): Promise<{ showPath: string; artistRoot: string }> {
  const row = await loadArtistTokens(artistId);
  if (!row?.dropbox_refresh_token) throw new Error("artist not connected to Dropbox");
  const token = await getValidAccessToken(artistId);

  const artistRoot = row.dropbox_artist_folder ?? "";
  const showPath = joinPath(artistRoot, showFolderName);

  // 1) show-map (sequentieel, want batch werkt niet als parent ontbreekt)
  await createFolder(token, showPath);

  // 2) 9 sub-mappen in 1 batch-call
  const subPaths = DROPBOX_FOLDER_STRUCTURE.map((sub) => `${showPath}/${sub}`);
  try {
    await createFolderBatch(token, subPaths);
  } catch (e: any) {
    // Fallback: één voor één (laat conflicts toe).
    for (const p of subPaths) {
      try {
        await createFolder(token, p);
      } catch {
        /* ignore individual failures */
      }
    }
  }
  return { showPath, artistRoot };
}

// ============================================================================
// File upload
// ============================================================================

export type UploadResult = { path_display: string; id: string };

export async function uploadFileToArtistDropbox(
  artistId: string,
  targetPath: string,
  data: ArrayBuffer | Uint8Array | Buffer,
  opts: { mode?: "add" | "overwrite"; autorename?: boolean } = {},
): Promise<UploadResult> {
  const token = await getValidAccessToken(artistId);
  const apiArg = {
    path: targetPath,
    mode: opts.mode ?? "add",
    autorename: opts.autorename ?? true,
    mute: true,
    strict_conflict: false,
  };
  const body =
    data instanceof Buffer
      ? data
      : data instanceof Uint8Array
        ? data
        : Buffer.from(data as ArrayBuffer);
  const r = await fetch(`${CONTENT}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify(apiArg),
    },
    body,
  });
  if (!r.ok) throw new Error(`Dropbox upload faalde: ${r.status} ${await r.text()}`);
  const json = await r.json();
  return { path_display: json.path_display ?? targetPath, id: json.id };
}

// ============================================================================
// Path resolver voor festival document uploads
// ============================================================================

export type FestivalDocPathContext = {
  artistId: string;
  artistRoot: string | null;
  showFolder: string | null;   // bv. "/Tomorrowland - 2026-07-19 - Boom"
  subFolder: string;            // bv. "01_STAGE"
};

export function buildFestivalDocPath(ctx: FestivalDocPathContext, fileName: string): string {
  const safe = safeFolderSegment(fileName).replace(/[ ]+/g, "_") || "file";
  return joinPath(ctx.artistRoot, ctx.showFolder ?? "_Unrouted", ctx.subFolder, safe);
}

/**
 * Haalt alle nodige velden op om een festival-doc te uploaden:
 *   - artist tokens
 *   - artist root-pad
 *   - show-folder (uit advancing). Als nog niet bestaat: maakt aan.
 */
export async function resolveFestivalDocContext(
  advancingId: string,
  subFolder: string,
): Promise<FestivalDocPathContext | { skipped: "not_connected" | "missing_data"; reason: string }> {
  const c = supabaseService();

  const { data: adv } = await c
    .from("advancings")
    .select("id, booking_id, dropbox_show_folder")
    .eq("id", advancingId)
    .maybeSingle();
  if (!adv) return { skipped: "missing_data", reason: "advancing niet gevonden" };

  const { data: booking } = await c
    .from("bookings")
    .select("id, artist_id, festival_id, show_date, venue_city")
    .eq("id", adv.booking_id)
    .maybeSingle();
  if (!booking) return { skipped: "missing_data", reason: "booking niet gevonden" };

  const { data: artist } = await c
    .from("artists")
    .select("id, name, dropbox_refresh_token, dropbox_artist_folder")
    .eq("id", booking.artist_id)
    .maybeSingle();
  if (!artist) return { skipped: "missing_data", reason: "artist niet gevonden" };
  if (!artist.dropbox_refresh_token) return { skipped: "not_connected", reason: "Dropbox niet gekoppeld voor deze artiest" };

  let showFolder = adv.dropbox_show_folder as string | null;

  if (!showFolder) {
    // Show-folder bestaat nog niet → lazy-create.
    const { data: festival } = await c
      .from("festivals")
      .select("name, location")
      .eq("id", booking.festival_id)
      .maybeSingle();
    const showFolderName = buildShowFolderName({
      festival_name: festival?.name ?? "Show",
      show_date: booking.show_date ?? undefined,
      city: booking.venue_city ?? festival?.location ?? undefined,
    });
    try {
      const result = await createShowStructure(artist.id, showFolderName);
      showFolder = result.showPath.startsWith(artist.dropbox_artist_folder ?? "")
        ? result.showPath.slice((artist.dropbox_artist_folder ?? "").length)
        : result.showPath;
      // Save naar advancing
      await c.from("advancings").update({ dropbox_show_folder: showFolder }).eq("id", advancingId);
    } catch (e: any) {
      return { skipped: "missing_data", reason: `kon show-folder niet aanmaken: ${e?.message ?? e}` };
    }
  }

  return {
    artistId: artist.id,
    artistRoot: artist.dropbox_artist_folder ?? null,
    showFolder,
    subFolder,
  };
}
