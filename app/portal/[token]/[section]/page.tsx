import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyPortalSection({ params }: { params: { token: string; section: string } }) {
  redirect(`/festival/${params.token}`);
}
