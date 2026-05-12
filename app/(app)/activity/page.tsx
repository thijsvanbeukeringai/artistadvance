import Link from "next/link";
import StatusPill, { humanStatus } from "@/components/StatusPill";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

export default async function ActivityPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const visibleIds = scopedArtistIds(account, snap.artists);

  const rows = [...snap.activity]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((a) => {
      const adv = snap.advancings.find((x) => x.id === a.advancing_id);
      if (!adv) return null;
      const booking = snap.bookings.find((b) => b.id === adv.booking_id);
      if (!booking || !visibleIds.has(booking.artist_id)) return null;
      const artist = snap.artists.find((ar) => ar.id === booking.artist_id)!;
      return { entry: a, advancing: adv, artist };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900">
          {account.mode === "artist" ? `Activity · ${account.label}` : `Activity · ${account.label}`}
        </h2>
        <p className="text-sm text-ink-500 mt-1">
          {account.mode === "artist"
            ? `Wie heeft wat gedaan op de advancings van ${account.label}.`
            : "Wie heeft wat gedaan, gefilterd op artiesten in deze agency."}
        </p>
      </div>
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink-500">Nog geen activiteit binnen scope.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {rows.map(({ entry, advancing, artist }) => (
              <li key={entry.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink-900">
                    <span className="font-semibold">{entry.user_name}</span> - {entry.details ?? humanStatus(entry.action)}
                  </div>
                  <div className="text-xs text-ink-400 mt-1">
                    {artist.name} · {new Date(entry.created_at).toLocaleString("nl-NL")}
                    {entry.user_type && <span className="ml-2 text-[10px] uppercase tracking-wider bg-ink-100 px-1.5 py-0.5 rounded">{entry.user_type}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {entry.section_type && <StatusPill tone="soft">{entry.section_type}</StatusPill>}
                  <Link href={`/advancings/${advancing.id}`} className="text-brand-600 text-sm font-semibold hover:underline">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
