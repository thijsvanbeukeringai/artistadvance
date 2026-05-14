"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Onzichtbare component: luistert via Supabase Realtime naar wijzigingen op
 * advancing_tech_items / advancing_sections / signed_riders voor de gegeven
 * advancing(s) en triggert router.refresh() bij elke event. Daardoor zien
 * artist-backoffice + festival portal direct elkaars wijzigingen zonder F5.
 */
export default function AdvancingLiveSync({ advancingIds }: { advancingIds: string[] }) {
  const router = useRouter();
  // Debounce: meerdere events kunnen tegelijk binnenkomen — slechts één refresh.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (advancingIds.length === 0) return;
    const sb = supabaseBrowser();

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };

    const filter = advancingIds.length === 1
      ? `advancing_id=eq.${advancingIds[0]}`
      : `advancing_id=in.(${advancingIds.join(",")})`;

    const ch = sb
      .channel(`advancing-live-${advancingIds.join("-").slice(0, 40)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advancing_tech_items", filter }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "advancing_sections", filter }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "signed_riders", filter }, scheduleRefresh)
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      sb.removeChannel(ch);
    };
  }, [advancingIds.join(","), router]);

  return null;
}
