import { NextRequest, NextResponse } from "next/server";
import { disconnectArtist } from "@/lib/dropbox";
import { requireArtistAccess } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const artistId = req.nextUrl.searchParams.get("artistId");
  if (!artistId) return NextResponse.json({ error: "artistId vereist" }, { status: 400 });
  const access = await requireArtistAccess(artistId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  await disconnectArtist(artistId);
  revalidatePath(`/artists/${artistId}/settings`);
  return NextResponse.json({ ok: true });
}
