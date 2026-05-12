import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; mode?: string };
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-xl bg-ink-900 text-white grid place-items-center font-extrabold">A</div>
          <span className="font-extrabold tracking-tight text-ink-900 text-lg">ArtistAdvance</span>
        </div>
        <LoginForm
          next={searchParams.next ?? "/"}
          initialMode={searchParams.mode === "signup" ? "signup" : "signin"}
        />
      </div>
    </div>
  );
}
