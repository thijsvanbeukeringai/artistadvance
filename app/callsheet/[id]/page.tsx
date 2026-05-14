import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTION_LABELS, SHOW_TYPE_LABELS, CREW_ROLE_LABELS } from "@/lib/data";
import PrintButton from "@/components/callsheet/PrintButton";
import { findAdvancingDetail, loadSnapshot } from "@/lib/snapshot";

export const metadata = {
  title: "Callsheet",
};

export default async function CallsheetPage({ params }: { params: { id: string } }) {
  const snap = await loadSnapshot();
  const detail = findAdvancingDetail(snap, params.id);
  if (!detail) return notFound();
  const { booking, artist, festival, stage, technical, logistics, hotel, distances, booking_crew, flights, artist_contacts, festival_contacts, riders, tech_items } = detail;
  const timeline = snap.timelineByAdvancing[detail.advancing.id] ?? [];

  const techByCat: Record<string, typeof tech_items> = {};
  for (const t of tech_items) {
    techByCat[t.category] = techByCat[t.category] ?? [];
    techByCat[t.category].push(t);
  }

  return (
    <div className="callsheet-root bg-white text-ink-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .callsheet-root { background: white !important; padding: 12mm !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
        .callsheet-root { padding: 28px; max-width: 900px; margin: 0 auto; font-family: Inter, sans-serif; }
        .callsheet-root h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #5b6370; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #e3e6eb; }
        .callsheet-root h2:first-child { margin-top: 0; }
        .callsheet-root table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .callsheet-root th, .callsheet-root td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #f3f5f8; vertical-align: top; }
        .callsheet-root th { background: #f8fafc; font-weight: 700; color: #5b6370; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .meta { font-size: 10px; color: #5b6370; }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/advancings/${params.id}`} className="text-sm text-ink-700 hover:underline">← Terug naar advancing</Link>
        <PrintButton advancingId={params.id} />
      </div>

      <header className="border-b-2 border-ink-900 pb-4 mb-6">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5b6370" }}>Callsheet · {SHOW_TYPE_LABELS[booking.show_type]}</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{artist.name} @ {festival.name}</h1>
            <div className="meta mt-1">{stage.name} · {festival.location} · {booking.show_date} {booking.show_time}</div>
          </div>
          <div className="text-right meta">
            <div>Set: <strong>{booking.set_duration_minutes} min</strong></div>
            {booking.doors_time && <div>Doors: <strong>{booking.doors_time}</strong></div>}
            {booking.curfew_time && <div>Curfew: <strong>{booking.curfew_time}</strong></div>}
          </div>
        </div>
      </header>

      <h2>Run-of-show</h2>
      {timeline.length > 0 ? (
        <table>
          <thead><tr><th>Tijd</th><th>Wat</th><th>Locatie</th><th>Wie</th><th>Notitie</th></tr></thead>
          <tbody>
            {[...timeline].sort((a, b) => a.datetime.localeCompare(b.datetime)).map((ev) => {
              const dt = new Date(ev.datetime);
              return (
                <tr key={ev.id}>
                  <td style={{ width: 90 }}>
                    <strong>{dt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</strong>
                    <div style={{ fontSize: 9, color: "#5b6370" }}>{dt.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}</div>
                  </td>
                  <td><strong>{({ load_in: "Load-in", setup: "Set-up", soundcheck: "Soundcheck", programming_led: "LED prog", programming_laser: "Laser prog", programming_video: "Video prog", booth_time: "Booth", doors: "Doors", show: "Show", encore: "Encore", curfew: "Curfew", load_out: "Load-out", departure: "Departure", other: "Anders" } as Record<string, string>)[ev.event_type] ?? ev.event_type}</strong></td>
                  <td>{ev.location ?? "-"}</td>
                  <td>{ev.responsible_contact ?? "-"}</td>
                  <td>{ev.notes ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table>
          <tbody>
            {logistics.load_in_time && <tr><td style={{ width: 120 }}>Load-in</td><td><strong>{logistics.load_in_time}</strong></td></tr>}
            {logistics.soundcheck_time && <tr><td>Soundcheck</td><td><strong>{logistics.soundcheck_time}</strong></td></tr>}
            {booking.doors_time && <tr><td>Doors</td><td><strong>{booking.doors_time}</strong></td></tr>}
            <tr><td>Showtime</td><td><strong>{booking.show_time}</strong> ({booking.set_duration_minutes} min)</td></tr>
            {booking.curfew_time && <tr><td>Curfew</td><td><strong>{booking.curfew_time}</strong></td></tr>}
            {logistics.load_out_time && <tr><td>Load-out</td><td><strong>{logistics.load_out_time}</strong></td></tr>}
          </tbody>
        </table>
      )}

      <div className="grid2">
        <section>
          <h2>Touring party ({booking_crew.filter((c) => c.is_traveling).length})</h2>
          <table>
            <thead>
              <tr><th>Rol</th><th>Naam</th><th>Vlucht</th></tr>
            </thead>
            <tbody>
              {booking_crew.filter((c) => c.is_traveling).map((c) => (
                <tr key={c.id}>
                  <td>{CREW_ROLE_LABELS[c.role]}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.needs_flight ? c.flight_status : "n.v.t."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>Vluchten</h2>
          {flights.length === 0 ? (
            <p className="meta">Geen vluchten geregistreerd.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Direction</th><th>Flight</th><th>Time</th></tr>
              </thead>
              <tbody>
                {flights.map((f) => (
                  <tr key={f.id}>
                    <td>{f.direction}</td>
                    <td><strong>{f.airline} {f.flight_number}</strong> · {f.departure_airport}→{f.arrival_airport}</td>
                    <td className="meta">{f.departure_datetime ? new Date(f.departure_datetime).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" }) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid2">
        <section>
          <h2>Hotel</h2>
          {hotel.hotel_required ? (
            <table>
              <tbody>
                <tr><td>Hotel</td><td><strong>{hotel.hotel_confirmed_name ?? hotel.hotel_preference ?? "-"}</strong></td></tr>
                {hotel.hotel_star_rating && <tr><td>Sterren</td><td>{hotel.hotel_star_rating}</td></tr>}
                {hotel.hotel_room_count && <tr><td>Kamers</td><td>{hotel.hotel_room_count} × {hotel.hotel_room_type ?? "-"}</td></tr>}
                <tr><td>Check-in</td><td>{hotel.hotel_check_in ?? "-"}</td></tr>
                <tr><td>Check-out</td><td>{hotel.hotel_check_out ?? "-"}</td></tr>
                {hotel.hotel_late_checkout && <tr><td>Late check-out</td><td>Ja</td></tr>}
              </tbody>
            </table>
          ) : <p className="meta">Geen hotel.</p>}
        </section>

        <section>
          <h2>Afstanden</h2>
          <table>
            <tbody>
              <tr><td>Airport ↔ Hotel</td><td>{distances.airport_hotel_km ?? "-"} km · {distances.airport_hotel_minutes ?? "-"} min</td></tr>
              <tr><td>Hotel ↔ Venue</td><td>{distances.hotel_venue_km ?? "-"} km · {distances.hotel_venue_minutes ?? "-"} min</td></tr>
              <tr><td>Venue ↔ Airport</td><td>{distances.venue_airport_km ?? "-"} km · {distances.venue_airport_minutes ?? "-"} min</td></tr>
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid2">
        <section>
          <h2>Contactpersonen artiest</h2>
          {artist_contacts.length === 0 ? <p className="meta">Geen contacten.</p> : (
            <table>
              <tbody>
                {artist_contacts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ width: 130 }}>{c.role}</td>
                    <td>
                      <strong>{c.name}</strong>
                      <div className="meta">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <h2>Contactpersonen festival</h2>
          {festival_contacts.length === 0 ? <p className="meta">Geen contacten.</p> : (
            <table>
              <tbody>
                {festival_contacts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ width: 130 }}>{c.role}</td>
                    <td>
                      <strong>{c.name}</strong>
                      <div className="meta">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <h2>Tech requirements (samenvatting)</h2>
      {Object.entries(techByCat).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0f1115", marginBottom: 4 }}>{(SECTION_LABELS as Record<string, string>)[cat] ?? cat}</div>
          <table>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.item_description}{it.is_mandatory && <span style={{ color: "#dc2626", fontWeight: 700, marginLeft: 4 }}>*</span>}</td>
                  <td style={{ width: 100, textAlign: "right" }}><strong>{it.status}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <h2>Riders</h2>
      <table>
        <tbody>
          {riders.map((r) => (
            <tr key={r.id}>
              <td style={{ width: 200 }}>{r.rider_type === "technical" ? "Technische rider" : r.rider_type === "hospitality" ? "Hospitality rider" : "SFX/Pyro rider"}</td>
              <td><strong>{r.status}</strong></td>
              <td className="meta">{r.signed_at ? `Getekend ${r.signed_at}` : ""}{r.dispute_notes ? ` - Disputed: ${r.dispute_notes}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="meta" style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #e3e6eb", textAlign: "center" }}>
        ArtistAdvance · Gegenereerd {new Date().toLocaleString("nl-NL")} · Portal: /festival/{detail.advancing.portal_token}
      </footer>
    </div>
  );
}
