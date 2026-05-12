import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div>
        <div className="text-6xl font-extrabold text-ink-900">404</div>
        <p className="text-ink-500 mt-2">Deze pagina bestaat niet.</p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-semibold">Terug naar dashboard</Link>
      </div>
    </div>
  );
}
