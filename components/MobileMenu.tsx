"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { SidebarGroup } from "./SidebarNav";

export default function MobileMenu({
  groups,
  userLabel,
  userEmail,
  userRole,
  mode,
}: {
  groups: SidebarGroup[];
  userLabel: string;
  userEmail: string | null;
  userRole: string;
  mode: "artist" | "agency";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes drawer
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="lg:hidden w-10 h-10 grid place-items-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <aside id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Navigatiemenu" className="absolute top-0 left-0 h-full w-[80%] max-w-xs bg-white shadow-2xl flex flex-col animate-slide-in motion-reduce:animate-none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ink-900 text-white grid place-items-center text-sm font-bold">A</div>
                <span className="font-extrabold tracking-tight text-ink-900">ArtistAdvance</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluit menu"
                className="w-8 h-8 grid place-items-center rounded-md text-ink-500 hover:bg-ink-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18 M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {groups.map((group) => (
                <div
                  key={group.section}
                  className={[
                    "mt-3",
                    group.accent ? "rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 p-2" : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "px-3 text-[11px] font-bold tracking-wider mb-2 flex items-center gap-1.5",
                      group.accent ? "text-violet-700" : "text-ink-400",
                    ].join(" ")}
                  >
                    {group.accent && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2L12 16.4 5.7 20.8 8 13.6 2 9.2h7.6z" />
                      </svg>
                    )}
                    {group.section}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={[
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition",
                              active
                                ? group.accent
                                  ? "bg-violet-700 text-white"
                                  : "bg-ink-900 text-white"
                                : group.accent
                                  ? "text-violet-900 hover:bg-violet-100"
                                  : "text-ink-700 hover:bg-ink-100",
                            ].join(" ")}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d={item.iconPath} />
                            </svg>
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="px-4 py-3 border-t border-ink-200 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                  mode === "artist" ? "bg-brand-50 text-brand-700" : "bg-ink-900 text-white"
                }`}>{mode}</span>
                <span className="font-semibold text-ink-900 truncate">{userLabel}</span>
              </div>
              {userEmail && <div className="text-[10px] text-ink-500 truncate">{userEmail}</div>}
              <div className="text-[10px] uppercase tracking-wider font-bold text-ink-400 mt-1">{userRole.replace(/_/g, " ")}</div>
            </div>
          </aside>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 220ms ease-out; }
      `}</style>
    </>
  );
}
