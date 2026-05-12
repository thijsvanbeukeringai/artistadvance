"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/login/actions";

export default function SidebarUser({
  mode,
  label,
  userEmail,
  role,
}: {
  mode: "artist" | "agency";
  label: string;
  userEmail: string | null;
  role: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="rounded-xl bg-ink-100 p-3 text-xs text-ink-500">
      <div className="font-semibold text-ink-900 mb-1 flex items-center gap-2">
        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
          mode === "artist" ? "bg-brand-50 text-brand-700" : "bg-ink-900 text-white"
        }`}>
          {mode}
        </span>
        <span className="truncate">{label}</span>
      </div>
      {userEmail && (
        <div className="text-[10px] text-ink-500 truncate">{userEmail}</div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase tracking-wider font-bold text-ink-400">{role.replace(/_/g, " ")}</span>
        <button
          type="button"
          onClick={() => start(() => signOutAction())}
          disabled={pending}
          className="text-[10px] font-semibold text-brand-700 hover:underline disabled:opacity-50"
        >
          {pending ? "Bezig..." : "Sign out"}
        </button>
      </div>
    </div>
  );
}
