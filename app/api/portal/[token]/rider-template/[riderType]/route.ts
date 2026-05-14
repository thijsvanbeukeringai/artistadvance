import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase-service";
import { getSignedUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string; riderType: string } },
) {
  const c = supabaseService();

  // Token → advancing → booking → artist
  const { data: adv } = await c
    .from("advancings")
    .select("id, booking_id, portal_token_expires_at")
    .eq("portal_token", params.token)
    .maybeSingle();
  if (!adv?.id) return NextResponse.json({ error: "invalid token" }, { status: 404 });

  if (adv.portal_token_expires_at && new Date(adv.portal_token_expires_at) < new Date()) {
    return NextResponse.json({ error: "token expired" }, { status: 410 });
  }

  const { data: booking } = await c
    .from("bookings")
    .select("artist_id, selected_riders")
    .eq("id", adv.booking_id)
    .maybeSingle();
  if (!booking?.artist_id) return NextResponse.json({ error: "booking missing" }, { status: 404 });

  // Check dat rider geselecteerd is voor deze booking
  const selected: string[] = Array.isArray(booking.selected_riders) ? booking.selected_riders : [];
  if (selected.length > 0 && !selected.includes(params.riderType)) {
    return NextResponse.json({ error: "rider not in selection" }, { status: 403 });
  }

  // Zoek template
  const { data: tpl } = await c
    .from("artist_rider_templates")
    .select("storage_path, file_name")
    .eq("artist_id", booking.artist_id)
    .eq("rider_type", params.riderType)
    .is("show_type", null)
    .maybeSingle();
  if (!tpl?.storage_path) return NextResponse.json({ error: "template not uploaded" }, { status: 404 });

  const url = await getSignedUrl("rider-templates", tpl.storage_path, 60 * 60);
  if (!url) return NextResponse.json({ error: "signed url failed" }, { status: 500 });

  return NextResponse.redirect(url);
}
