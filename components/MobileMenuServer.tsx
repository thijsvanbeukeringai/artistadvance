import { readAccount } from "@/lib/account";
import { buildNavGroups } from "@/lib/sidebarNav";
import MobileMenu from "./MobileMenu";

export default async function MobileMenuServer() {
  const account = await readAccount();
  const groups = buildNavGroups(account);
  return (
    <MobileMenu
      groups={groups}
      userLabel={account.label}
      userEmail={account.userEmail}
      userRole={account.role}
      mode={account.mode}
    />
  );
}
