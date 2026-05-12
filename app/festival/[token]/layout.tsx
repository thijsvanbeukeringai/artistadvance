import Link from "next/link";
import { notFound } from "next/navigation";
import { SHOW_TYPE_LABELS } from "@/lib/data";
import { findPortalDetail, loadSnapshot } from "@/lib/snapshot";
import { readAccount } from "@/lib/account";

export default async function FestivalPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { token: string };
}) {
  const [snap, account] = await Promise.all([loadSnapshot(), readAccount()]);
  const detail = findPortalDetail(snap, params.token);
  if (!detail) return notFound();
  const { artist, festival, booking, advancing } = detail;
  // Banner alleen tonen aan ingelogde backoffice-gebruikers, niet aan
  // anonieme festival-bezoekers die de link hebben gekregen
  const isBackofficeUser = account.role !== "guest";

  return (
    <div className="min-h-screen bg-ink-100">
      {isBackofficeUser && (
        <div className="bg-emerald-900 text-white text-xs">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
            <span className="text-emerald-100">
              Je bekijkt het <span className="font-semibold text-white">festival-portal</span> (wat het festival invult).
            </span>
            <Link
              href={`/advancings/${advancing.id}`}
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-emerald-300 transition"
            >
              ← Terug naar backoffice
            </Link>
          </div>
        </div>
      )}
      <header className="bg-white border-b border-ink-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href={`/festival/${params.token}`} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white grid place-items-center font-extrabold">F</div>
            <div>
              <div className="font-extrabold text-ink-900 leading-tight">Festival portal · {festival.name}</div>
              <div className="text-xs text-ink-500">{artist.name} · {SHOW_TYPE_LABELS[booking.show_type]} · {booking.show_date}</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-xs text-ink-500">
            <div>Stage: <span className="font-semibold text-ink-900">{detail.stage.name}</span></div>
            <span className="text-ink-200">|</span>
            <div>Showtime: <span className="font-semibold text-ink-900">{booking.show_time}</span></div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-xs text-ink-400">
        Festival portal - vertelt management welk item bevestigd of geweigerd is.
      </footer>
    </div>
  );
}
