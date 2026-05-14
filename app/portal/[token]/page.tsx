import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyPortalPage({ params }: { params: { token: string } }) {
  redirect(`/festival/${params.token}`);
}
