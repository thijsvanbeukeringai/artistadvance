import type { Booking } from "./types";

export interface BookingConflict {
  type: "same_date" | "radius";
  with: Booking;
  daysDiff: number;
  message: string;
}

/**
 * Detecteer conflicten voor een booking tegen andere bookings van dezelfde artiest:
 *  - same_date: één of meer bookings op identieke datum (hold-conflict)
 *  - radius: andere confirmed/advancing booking binnen radius_days_before/after dagen
 */
export function detectBookingConflicts(
  booking: Booking,
  allBookings: Booking[],
): BookingConflict[] {
  const conflicts: BookingConflict[] = [];
  const others = allBookings.filter((b) => b.id !== booking.id && b.artist_id === booking.artist_id);
  const targetDate = new Date(booking.show_date + "T00:00:00").getTime();

  for (const other of others) {
    if (other.status === "cancelled") continue;
    const otherDate = new Date(other.show_date + "T00:00:00").getTime();
    const diffDays = Math.abs((otherDate - targetDate) / 86400000);

    if (diffDays === 0) {
      conflicts.push({
        type: "same_date",
        with: other,
        daysDiff: 0,
        message: `Andere booking voor deze artiest op dezelfde dag (${other.show_date}).`,
      });
      continue;
    }

    // Radius check: gebruik de booking's eigen radius_days_before/after, OF de ander, OF default 30.
    const before = booking.radius_days_before ?? other.radius_days_before ?? 0;
    const after = booking.radius_days_after ?? other.radius_days_after ?? 0;
    if ((before > 0 || after > 0) && (other.status === "confirmed" || other.status === "advancing")) {
      const otherTime = new Date(other.show_date + "T00:00:00").getTime();
      const isBeforeTarget = otherTime < targetDate;
      const window = isBeforeTarget ? before : after;
      if (window > 0 && diffDays <= window) {
        conflicts.push({
          type: "radius",
          with: other,
          daysDiff: Math.round(diffDays),
          message: `Binnen radius (${Math.round(diffDays)} dgn) van andere bevestigde booking op ${other.show_date}.`,
        });
      }
    }
  }
  return conflicts;
}
