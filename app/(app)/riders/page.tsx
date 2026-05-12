import Link from "next/link";
import StatusPill, { humanStatus, statusTone } from "@/components/StatusPill";
import { readAccount, scopedArtistIds } from "@/lib/account";
import { loadSnapshot } from "@/lib/snapshot";

export default async function RidersPage() {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const visibleIds = scopedArtistIds(account, snap.artists);
  const rows = snap.signedRiders
    .map((r) => {
      const adv = snap.advancings.find((a) => a.id === r.advancing_id);
      if (!adv) return null;
      const booking = snap.bookings.find((b) => b.id === adv.booking_id);
      if (!booking || !visibleIds.has(booking.artist_id)) return null;
      const artist = snap.artists.find((a) => a.id === booking.artist_id)!;
      const festival = snap.festivals.find((f) => f.id === booking.festival_id)!;
      return { rider: r, advancing: adv, booking, artist, festival };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900">Signed Riders</h2>
        <p className="text-sm text-ink-500 mt-1">Riders die getekend, gestuurd of disputed zijn.</p>
      </div>
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wider bg-ink-50">
              <th className="px-5 py-3 font-semibold">Artiest · Festival</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Notities</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {rows.map(({ rider, advancing, artist, festival }) => (
              <tr key={rider.id} className="hover:bg-ink-50">
                <td className="px-5 py-4">
                  <div className="font-semibold text-ink-900">{artist.name}</div>
                  <div className="text-xs text-ink-400">{festival.name}</div>
                </td>
                <td className="px-5 py-4 capitalize text-ink-700">{rider.rider_type}</td>
                <td className="px-5 py-4"><StatusPill tone={statusTone(rider.status)}>{humanStatus(rider.status)}</StatusPill></td>
                <td className="px-5 py-4 text-xs text-ink-500 max-w-xs">{rider.dispute_notes ?? rider.festival_notes ?? "-"}</td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/advancings/${advancing.id}`} className="text-brand-600 font-semibold text-sm hover:underline">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
