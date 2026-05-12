import { readAccount } from "@/lib/account";
import { buildNavGroups } from "@/lib/sidebarNav";
import SidebarNav from "./SidebarNav";
import SidebarUser from "./SidebarUser";
import SwitchSystemLink from "./SwitchSystemLink";

export default async function Sidebar() {
  const account = await readAccount();
  const groups = buildNavGroups(account);
  const isArtist = account.mode === "artist";

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-white border-r border-ink-200 flex-col z-20">
      <div className="px-6 py-6 flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg text-white grid place-items-center text-sm font-bold ${
            isArtist
              ? "bg-gradient-to-br from-violet-700 to-fuchsia-700"
              : "bg-ink-900"
          }`}
        >
          A
        </div>
        <div className="leading-tight">
          <div className="font-extrabold tracking-tight text-ink-900 text-base">ArtistAdvance</div>
          <div className={`text-[9px] uppercase tracking-[0.18em] font-bold ${isArtist ? "text-violet-700" : "text-ink-500"}`}>
            {isArtist ? "Artist Team" : "Bookings Agency"}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        <SidebarNav groups={groups} />
      </nav>

      {account.canImpersonate && (
        <div className="px-3 pb-3">
          <SwitchSystemLink mode={account.mode} />
        </div>
      )}

      <div className="px-4 py-4 border-t border-ink-200">
        <SidebarUser
          mode={account.mode}
          label={account.label}
          userEmail={account.userEmail}
          role={account.role}
        />
      </div>
    </aside>
  );
}
