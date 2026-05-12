import LoginForm from "../LoginForm";

export const metadata = { title: "Sign in · Artist Team" };
export const dynamic = "force-dynamic";

export default function ArtistLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; mode?: string };
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-violet-50 via-ink-100 to-fuchsia-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-700 to-fuchsia-700 text-white grid place-items-center font-extrabold">A</div>
          <span className="font-extrabold tracking-tight text-ink-900 text-lg">ArtistAdvance</span>
        </div>
        <div className="mb-3 text-center">
          <span className="inline-block text-[10px] uppercase tracking-[0.18em] font-bold bg-gradient-to-r from-violet-700 to-fuchsia-700 text-white px-2 py-1 rounded">
            Artist Team
          </span>
        </div>
        <LoginForm
          next={searchParams.next ?? "/"}
          initialMode={searchParams.mode === "signup" ? "signup" : "signin"}
          system="artist"
        />
      </div>
    </div>
  );
}
