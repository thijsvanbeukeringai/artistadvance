"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function ArtistFilter({ artists }: { artists: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get("artist") ?? "";

  function setArtist(id: string) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("artist", id);
    else next.delete("artist");
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Artiest</label>
      <select
        value={selected}
        onChange={(e) => setArtist(e.target.value)}
        className="px-2.5 py-1.5 rounded-md border border-ink-200 text-sm bg-white focus:border-brand-500 focus:outline-none"
      >
        <option value="">Alle artiesten ({artists.length})</option>
        {artists.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </div>
  );
}
