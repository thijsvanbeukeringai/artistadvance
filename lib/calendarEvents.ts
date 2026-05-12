import type { Snapshot } from "./snapshot";
import type { CalEvent, CalEventMeta } from "@/components/calendar/MonthCalendar";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
}
function dateOnly(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

const TIMELINE_LABEL: Record<string, string> = {
  load_in: "Load-in", setup: "Set-up", soundcheck: "Soundcheck",
  programming_led: "LED programming", programming_laser: "Laser programming", programming_video: "Video programming",
  booth_time: "Booth time", load_out: "Load-out", departure: "Departure",
};

/**
 * Bouw kalender-events met rijke `meta` voor de popup.
 *
 * `system` bepaalt of commerciële velden (zoals `fee`) in de meta verschijnen.
 * Artist-mode = advancing-team voor de artiest — die mogen GEEN financials
 * zien. Default is "agency" voor backwards-compat in agency-routes.
 */
export function buildCalendarEvents(
  snap: Snapshot,
  artistIds: Set<string> | null,
  system: "agency" | "artist" = "agency",
): CalEvent[] {
  const events: CalEvent[] = [];
  const visibleBookings = artistIds
    ? snap.bookings.filter((b) => artistIds.has(b.artist_id))
    : snap.bookings;
  const visibleAdvancingIds = new Set(
    snap.advancings
      .filter((a) => visibleBookings.some((b) => b.id === a.booking_id))
      .map((a) => a.id),
  );

  const artistOf = (advId: string) => {
    const adv = snap.advancings.find((a) => a.id === advId);
    if (!adv) return "?";
    const b = snap.bookings.find((bb) => bb.id === adv.booking_id);
    return b ? snap.artists.find((a) => a.id === b.artist_id)?.name ?? "?" : "?";
  };

  // SHOWS
  for (const b of visibleBookings) {
    if (b.status === "draft") continue;
    const festival = snap.festivals.find((f) => f.id === b.festival_id);
    const stage = snap.stages.find((s) => s.id === b.stage_id);
    const artist = snap.artists.find((a) => a.id === b.artist_id);
    const adv = snap.advancings.find((a) => a.booking_id === b.id);
    const meta: CalEventMeta = {
      kind: "show",
      advancingId: adv?.id ?? "",
      artistName: artist?.name ?? "?",
      festivalName: festival?.name ?? "?",
      stageName: stage?.name ?? "?",
      venueLocation: festival?.location,
      showTime: b.show_time,
      setDuration: b.set_duration_minutes,
      doorsTime: b.doors_time,
      curfewTime: b.curfew_time,
      status: adv?.status ?? b.status,
      fee: system === "agency" ? b.fee : undefined,
      programmingSlot: b.programming_slot,
      soundcheckSlot: b.soundcheck_slot,
    };
    events.push({
      id: `show_${b.id}`,
      type: "show",
      time: b.show_time?.slice(0, 5) || "TBA",
      title: `${festival?.name ?? "?"} · ${stage?.name ?? ""}`.trim(),
      startDate: b.show_date,
      endDate: b.show_date,
      href: adv ? `/advancings/${adv.id}` : undefined,
      subtitle: festival?.location,
      meta,
    });
  }

  // HOTELS
  for (const [advId, hotel] of Object.entries(snap.hotelByAdvancing)) {
    if (!visibleAdvancingIds.has(advId)) continue;
    if (!hotel.hotel_required || !hotel.hotel_check_in) continue;
    const adv = snap.advancings.find((a) => a.id === advId);
    const booking = adv ? snap.bookings.find((b) => b.id === adv.booking_id) : null;
    const festival = booking ? snap.festivals.find((f) => f.id === booking.festival_id) : null;
    const hotelName = hotel.hotel_confirmed_name ?? hotel.hotel_preference ?? "Hotel";
    const crew = booking ? snap.bookingCrew.filter((c) => c.booking_id === booking.id && c.is_traveling).map((c) => c.name) : [];
    const hospitality = snap.hospitalityByAdvancing[advId];

    const meta: CalEventMeta = {
      kind: "hotel",
      advancingId: advId,
      artistName: artistOf(advId),
      hotelName: hotel.hotel_confirmed_name,
      preference: hotel.hotel_preference,
      starRating: hotel.hotel_star_rating,
      roomCount: hotel.hotel_room_count,
      roomType: hotel.hotel_room_type,
      nights: hotel.hotel_nights,
      nightsDescription: hotel.hotel_nights_description,
      checkIn: hotel.hotel_check_in,
      checkOut: hotel.hotel_check_out,
      lateCheckout: hotel.hotel_late_checkout,
      partySize: hospitality?.party_size,
      roomAssignments: hotel.room_assignments,
      travelingCrew: crew,
    };

    events.push({
      id: `hotel_${advId}`,
      type: "hotel",
      time: hotel.hotel_check_in === hotel.hotel_check_out ? "00:00" : "All Day",
      title: `${hotelName}${festival ? ` · ${festival.location ?? festival.name}` : ""}`,
      startDate: hotel.hotel_check_in,
      endDate: hotel.hotel_check_out ?? hotel.hotel_check_in,
      href: `/advancings/${advId}`,
      meta,
    });
  }

  // TRAVEL (flights)
  for (const [advId, flights] of Object.entries(snap.flightsByAdvancing)) {
    if (!visibleAdvancingIds.has(advId)) continue;
    for (const f of flights) {
      const meta: CalEventMeta = {
        kind: "travel",
        advancingId: advId,
        artistName: artistOf(advId),
        flightNumber: f.flight_number,
        airline: f.airline,
        departureAirport: f.departure_airport,
        arrivalAirport: f.arrival_airport,
        departureDatetime: f.departure_datetime,
        arrivalDatetime: f.arrival_datetime,
        passengers: f.passengers,
        status: f.status,
        bookingReference: f.booking_reference,
        direction: f.direction,
        notes: f.notes,
      };
      events.push({
        id: `flight_${f.id}`,
        type: "travel",
        time: fmtTime(f.departure_datetime),
        title: `${f.departure_airport} - ${f.arrival_airport}`,
        startDate: dateOnly(f.departure_datetime),
        endDate: dateOnly(f.departure_datetime),
        href: `/advancings/${advId}`,
        subtitle: `${f.airline} ${f.flight_number}`,
        meta,
      });
    }
  }

  // TIMELINE events (+ reminders die als event_type:"other" zijn opgeslagen)
  for (const [advId, items] of Object.entries(snap.timelineByAdvancing)) {
    if (!visibleAdvancingIds.has(advId)) continue;
    for (const t of items) {
      // Reminder = timeline-event van type "other"; location bevat de titel.
      if (t.event_type === "other") {
        const title = t.location?.trim() || "Reminder";
        const meta: CalEventMeta = {
          kind: "reminder",
          advancingId: advId,
          artistName: artistOf(advId),
          title,
          datetime: t.datetime,
          notes: t.notes,
        };
        events.push({
          id: `rm_${t.id}`,
          type: "reminder",
          time: fmtTime(t.datetime),
          title,
          startDate: dateOnly(t.datetime),
          endDate: dateOnly(t.datetime),
          href: `/advancings/${advId}`,
          meta,
        });
        continue;
      }
      if (!(t.event_type in TIMELINE_LABEL)) continue;
      const label = TIMELINE_LABEL[t.event_type];
      const meta: CalEventMeta = {
        kind: "soundcheck",
        advancingId: advId,
        artistName: artistOf(advId),
        eventType: t.event_type,
        datetime: t.datetime,
        location: t.location,
        responsibleContact: t.responsible_contact,
        notes: t.notes,
      };
      events.push({
        id: `tl_${t.id}`,
        type: "soundcheck",
        time: fmtTime(t.datetime),
        title: label,
        startDate: dateOnly(t.datetime),
        endDate: dateOnly(t.datetime),
        href: `/advancings/${advId}`,
        subtitle: t.location,
        meta,
      });
    }
  }

  return events;
}
