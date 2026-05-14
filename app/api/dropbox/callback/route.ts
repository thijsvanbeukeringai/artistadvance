import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getCurrentAccountEmail, saveArtistTokens } from "@/lib/dropbox";
import { requireArtistAccess } from "@/lib/authz";

export const dynamic = "force-dynamic";

function backToArtist(origin: string, artistId: string | null, status: "ok" | "error", msg?: string) {
  const target = artistId ? `/artists/${artistId}/settings` : `/settings`;
  const url = new URL(target, origin);
  url.searchParams.set("dropbox", status);
  if (msg) url.searchParams.set("msg", msg);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const jar = cookies();
  const cookieState = jar.get("dbx_oauth_state")?.value;
  const artistId = jar.get("dbx_oauth_artist")?.value ?? null;
  jar.delete("dbx_oauth_state");
  jar.delete("dbx_oauth_artist");

  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const state = sp.get("state");
  const error = sp.get("error");

  if (error) return backToArtist(origin, artistId, "error", error);
  if (!code || !state) return backToArtist(origin, artistId, "error", "code_or_state_missing");
  if (!cookieState || state !== cookieState) return backToArtist(origin, artistId, "error", "state_mismatch");
  if (!artistId) return backToArtist(origin, null, "error", "artist_cookie_missing");

  const access = await requireArtistAccess(artistId);
  if (!access.ok) return backToArtist(origin, artistId, "error", "no_access");

  try {
    const tokens = await exchangeCodeForTokens(code, origin);
    const email = await getCurrentAccountEmail(tokens.access_token);
    await saveArtistTokens(artistId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      account_email: email ?? undefined,
    });
    return backToArtist(origin, artistId, "ok");
  } catch (e: any) {
    return backToArtist(origin, artistId, "error", encodeURIComponent(e?.message ?? "exchange_failed"));
  }
}
