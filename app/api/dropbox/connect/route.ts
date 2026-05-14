import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl, getDropboxAppConfig } from "@/lib/dropbox";
import { requireArtistAccess } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * Start Dropbox OAuth voor een specifieke artiest.
 *
 *   GET /api/dropbox/connect?artistId=<uuid>
 *
 * Slaat artistId + CSRF state op in een httpOnly cookie en redirect naar Dropbox.
 */
export async function GET(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  if (!artistId) {
    return NextResponse.json({ error: "artistId vereist" }, { status: 400 });
  }
  const access = await requireArtistAccess(artistId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const cfg = getDropboxAppConfig();
  if (!cfg.ok) {
    return NextResponse.json({ error: cfg.reason }, { status: 500 });
  }

  const state = randomBytes(24).toString("base64url");
  const url = buildAuthorizeUrl(state, req.nextUrl.origin);
  if (!url) {
    return NextResponse.json({ error: "Dropbox config ontbreekt" }, { status: 500 });
  }

  const jar = cookies();
  jar.set("dbx_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  jar.set("dbx_oauth_artist", artistId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(url);
}
