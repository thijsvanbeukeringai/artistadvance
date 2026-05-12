import AccountSwitcher from "./AccountSwitcher";
import TopbarTitle from "./TopbarTitle";
import MobileMenuServer from "./MobileMenuServer";
import { listAccountChoices, readAccount } from "@/lib/account";

export default async function Topbar() {
  const [account, { agencies, artists }] = await Promise.all([
    readAccount(),
    listAccountChoices(),
  ]);

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-5 border-b border-ink-200 bg-white gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuServer />
        <TopbarTitle />
      </div>

      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2 bg-ink-100 rounded-lg px-3 py-2 w-60 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Zoek artiest, booking, festival…"
            className="bg-transparent w-full outline-none placeholder:text-ink-400 text-ink-700"
          />
        </div>

        {account.canImpersonate ? (
          <AccountSwitcher
            mode={account.mode}
            currentId={account.mode === "agency" ? account.organizationId : account.artistId}
            agencies={agencies}
            artists={artists}
            label={account.label}
            sublabel={account.sublabel}
          />
        ) : (
          <div className="hidden md:flex items-center gap-2 bg-ink-100 rounded-lg px-3 py-2 text-sm">
            <span className="font-semibold text-ink-900">{account.label}</span>
            <span className="text-ink-400 text-xs">·</span>
            <span className="text-ink-500 text-xs">{account.sublabel}</span>
          </div>
        )}

        <button
          className="hidden sm:grid relative w-10 h-10 rounded-full bg-ink-100 place-items-center text-ink-700 hover:bg-ink-200 transition"
          aria-label="Notificaties"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500" />
        </button>
      </div>
    </header>
  );
}
