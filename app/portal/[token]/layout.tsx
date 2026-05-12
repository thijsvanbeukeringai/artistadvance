import Link from "next/link";
import { notFound } from "next/navigation";
import { findPortalDetail, loadSnapshot } from "@/lib/snapshot";
import { readAccount } from "@/lib/account";

export default async function PortalLayout({
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
  // Banner alleen tonen aan ingelogde backoffice-gebruikers
  const isBackofficeUser = account.role !== "guest";

  return (
    <div className="min-h-screen bg-ink-100">
      {isBackofficeUser && (
        <div className="bg-ink-900 text-white text-xs">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
            <span className="text-ink-200">
              Je bekijkt de <span className="font-semibold text-white">externe portal</span> (wat een festival ziet).
            </span>
            <Link
              href={`/advancings/${advancing.id}`}
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-brand-400 transition"
            >
              ← Terug naar backoffice
            </Link>
          </div>
        </div>
      )}
      <header className="bg-white border-b border-ink-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href={`/portal/${params.token}`} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink-900 text-white grid place-items-center font-extrabold">A</div>
            <div>
              <div className="font-extrabold text-ink-900 leading-tight">{artist.name}</div>
              <div className="text-xs text-ink-500">Advancing portal · {festival.name}</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-xs text-ink-500">
            <div>
              Show: <span className="font-semibold text-ink-900">{booking.show_date} {booking.show_time}</span>
            </div>
            <span className="text-ink-200">|</span>
            <div>
              Stage: <span className="font-semibold text-ink-900">{detail.stage.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs px-3 py-2 rounded-lg border border-ink-200 text-ink-700 font-semibold hover:bg-ink-100">Help</button>
            <button className="text-xs px-3 py-2 rounded-lg bg-ink-900 text-white font-semibold hover:bg-black">
              Connect Dropbox
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-xs text-ink-400">
        Demo portal - wijzigingen worden in-memory bewaard tot de dev-server herstart.
      </footer>
    </div>
  );
}
