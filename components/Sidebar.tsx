import { readAccount } from "@/lib/account";
import { buildNavGroups } from "@/lib/sidebarNav";
import SidebarNav from "./SidebarNav";
import SidebarUser from "./SidebarUser";

export default async function Sidebar() {
  const account = await readAccount();
  const groups = buildNavGroups(account);

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-white border-r border-ink-200 flex-col z-20">
      <div className="px-6 py-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-ink-900 text-white grid place-items-center text-sm font-bold">A</div>
        <span className="font-extrabold tracking-tight text-ink-900 text-lg">ArtistAdvance</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <SidebarNav groups={groups} />
      </nav>

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
