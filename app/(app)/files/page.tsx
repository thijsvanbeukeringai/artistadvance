import { redirect } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import { readAccount, canAccessAdvancing } from "@/lib/account";

export default async function FilesPage() {
  const account = await readAccount();
  if (!canAccessAdvancing(account.role)) redirect("/");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900">File Management</h2>
        <p className="text-sm text-ink-500 mt-1">Centrale opslag van advancing files, gesynct met Dropbox.</p>
      </div>
      <EmptyState
        title="Files binnenkort beschikbaar"
        description="Hier komt de centrale file browser per advancing met Dropbox-sync indicators. Demo data heeft op dit moment nog geen file objecten."
        cta="Connect Dropbox"
      />
    </div>
  );
}
