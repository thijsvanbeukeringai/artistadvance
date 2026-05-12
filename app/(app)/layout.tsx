import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import SystemBanner from "@/components/SystemBanner";
import { readAccount } from "@/lib/account";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await readAccount();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen bg-ink-100">
        <div className="lg:m-4 bg-white lg:rounded-xl2 lg:shadow-card overflow-hidden">
          <Topbar />
          {account.role !== "guest" && <SystemBanner system={account.mode} />}
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
