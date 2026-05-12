import { redirect } from "next/navigation";
import { readAccount } from "@/lib/account";

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const account = await readAccount();
  if (account.role === "guest") redirect("/login/artist");
  if (account.mode !== "artist") redirect("/");
  return <>{children}</>;
}
