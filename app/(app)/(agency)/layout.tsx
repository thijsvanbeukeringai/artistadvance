import { redirect } from "next/navigation";
import { readAccount } from "@/lib/account";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const account = await readAccount();
  if (account.role === "guest") redirect("/login");
  // Verkeerd systeem → bounce naar eigen-systeem home (artist's home is /advancings).
  if (account.mode !== "agency") redirect("/advancings");
  return <>{children}</>;
}
