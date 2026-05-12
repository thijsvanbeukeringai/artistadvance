"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = {
  href: string;
  label: string;
  iconPath: string;
};

export type SidebarGroup = {
  section: string;
  items: SidebarItem[];
  accent?: boolean;
};

export default function SidebarNav({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname();
  return (
    <>
      {groups.map((group) => (
        <div
          key={group.section}
          className={[
            "mt-4",
            group.accent ? "rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 p-2 shadow-sm" : "",
          ].join(" ")}
        >
          <div
            className={[
              "px-3 text-[11px] font-bold tracking-wider mb-2 flex items-center gap-1.5",
              group.accent ? "text-violet-700" : "text-ink-400",
            ].join(" ")}
          >
            {group.accent && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                          ? "bg-violet-700 text-white shadow-sm"
                          : "bg-ink-900 text-white shadow-sm"
                        : group.accent
                          ? "text-violet-900 hover:bg-violet-100"
                          : "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
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
    </>
  );
}
