"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Generieke realtime listener. Multiplext alle subscriptions over één Supabase
 * channel per scope, en triggert router.refresh() (debounced) bij elke event.
 *
 * Scopes:
 *  - advancing: kritische detail-data (tech items, sections, hospitality, ...)
 *  - booking:   advancing van booking + booking-level changes
 *  - artist:    artist-level templates + artist row
 *  - org:       lijstpaginas (alle bookings van organization)
 */
export type LiveSyncScope =
  | { mode: "advancing"; ids: string[] }
  | { mode: "booking"; ids: string[] }
  | { mode: "artist"; ids: string[] }
  | { mode: "org"; orgId: string };

type TableSpec = { table: string; column: string };

// Tabellen geindexeerd op advancing_id
const ADVANCING_TABLES: TableSpec[] = [
  { table: "advancing_tech_items", column: "advancing_id" },
  { table: "advancing_sections", column: "advancing_id" },
  { table: "signed_riders", column: "advancing_id" },
  { table: "advancing_activity", column: "advancing_id" },
  { table: "advancing_hotel", column: "advancing_id" },
  { table: "advancing_travel", column: "advancing_id" },
  { table: "advancing_logistics", column: "advancing_id" },
  { table: "advancing_hospitality", column: "advancing_id" },
  { table: "advancing_visa", column: "advancing_id" },
  { table: "advancing_visa_crew", column: "advancing_id" },
  { table: "advancing_contacts_artist", column: "advancing_id" },
  { table: "advancing_contacts_festival", column: "advancing_id" },
  { table: "advancing_distances", column: "advancing_id" },
  { table: "advancing_flights", column: "advancing_id" },
  { table: "advancing_ground_transfers", column: "advancing_id" },
  { table: "advancing_timeline", column: "advancing_id" },
  { table: "festival_documents", column: "advancing_id" },
  { table: "hotel_proposals", column: "advancing_id" },
];

// Tabellen geindexeerd op artist_id
const ARTIST_TABLES: TableSpec[] = [
  { table: "artist_tech_requirements", column: "artist_id" },
  { table: "artist_custom_tech_categories", column: "artist_id" },
  { table: "artist_rider_templates", column: "artist_id" },
  { table: "artists", column: "id" },
  { table: "booking_intakes", column: "artist_id" },
];

// Tabellen geindexeerd op booking_id
const BOOKING_TABLES: TableSpec[] = [
  { table: "bookings", column: "id" },
  { table: "booking_crew", column: "booking_id" },
  { table: "booking_contacts", column: "booking_id" },
];

// Tabellen op organization_id
const ORG_TABLES: TableSpec[] = [
  { table: "bookings", column: "organization_id" }, // bookings hebben geen org direct — best-effort
  { table: "artists", column: "organization_id" },
];

function makeFilter(column: string, ids: string[]): string {
  if (ids.length === 1) return `${column}=eq.${ids[0]}`;
  return `${column}=in.(${ids.join(",")})`;
}

export default function LiveSync({
  scope,
  debounce = 250,
}: {
  scope: LiveSyncScope;
  debounce?: number;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const sb = supabaseBrowser();

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        // Skip stapeling: als een refresh al loopt, wacht volgende tick.
        if (inFlight.current) return;
        inFlight.current = true;
        router.refresh();
        // Reset na 600ms zodat volgende burst weer geaccepteerd wordt
        setTimeout(() => { inFlight.current = false; }, 600);
      }, debounce);
    };

    let channelKey = "";
    const subs: { table: string; column: string; filter: string }[] = [];

    if (scope.mode === "advancing" && scope.ids.length > 0) {
      channelKey = `adv:${scope.ids.join("-").slice(0, 32)}`;
      const filter = makeFilter("advancing_id", scope.ids);
      for (const t of ADVANCING_TABLES) subs.push({ ...t, filter });
    } else if (scope.mode === "booking" && scope.ids.length > 0) {
      channelKey = `bk:${scope.ids.join("-").slice(0, 32)}`;
      const filter = makeFilter("booking_id", scope.ids);
      for (const t of BOOKING_TABLES) {
        const f = t.column === "id" ? makeFilter("id", scope.ids) : filter;
        subs.push({ ...t, filter: f });
      }
    } else if (scope.mode === "artist" && scope.ids.length > 0) {
      channelKey = `art:${scope.ids.join("-").slice(0, 32)}`;
      for (const t of ARTIST_TABLES) {
        const f = t.column === "id" ? makeFilter("id", scope.ids) : makeFilter(t.column, scope.ids);
        subs.push({ ...t, filter: f });
      }
    } else if (scope.mode === "org") {
      channelKey = `org:${scope.orgId}`;
      const f = makeFilter("organization_id", [scope.orgId]);
      for (const t of ORG_TABLES) subs.push({ ...t, filter: f });
    }

    if (subs.length === 0) return;

    const ch = sb.channel(channelKey);
    for (const s of subs) {
      ch.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: s.table, filter: s.filter },
        scheduleRefresh,
      );
    }
    ch.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      sb.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scope.mode,
    scope.mode === "org" ? scope.orgId : "",
    scope.mode !== "org" ? scope.ids.join(",") : "",
    debounce,
  ]);

  return null;
}
