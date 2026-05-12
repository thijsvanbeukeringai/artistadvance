import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { findAdvancingDetail, loadSnapshot } from "@/lib/snapshot";
import { CallsheetPDF } from "@/lib/pdf/CallsheetPDF";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const snap = await loadSnapshot();
  const detail = findAdvancingDetail(snap, params.id);
  if (!detail) {
    return NextResponse.json({ error: "Advancing niet gevonden" }, { status: 404 });
  }
  const timeline = snap.timelineByAdvancing[detail.advancing.id] ?? [];

  const buffer = await renderToBuffer(
    React.createElement(CallsheetPDF, { detail, timeline }) as any,
  );

  const filename = `callsheet_${detail.artist.name}_${detail.festival.name}_${detail.booking.show_date}.pdf`
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
