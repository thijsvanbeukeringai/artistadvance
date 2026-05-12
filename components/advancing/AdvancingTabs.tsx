"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface AdvancingTab {
  id: string;
  label: string;
  iconPath: string;
  badge?: string;
  content: React.ReactNode;
}

export default function AdvancingTabs({ tabs, defaultTab }: { tabs: AdvancingTab[]; defaultTab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get("tab");
  const valid = useMemo(() => new Set(tabs.map((t) => t.id)), [tabs]);
  const active = queryTab && valid.has(queryTab) ? queryTab : (defaultTab && valid.has(defaultTab) ? defaultTab : tabs[0]?.id);

  function pick(id: string) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden">
        <div role="tablist" aria-label="Advancing secties" className="flex items-stretch overflow-x-auto scrollbar-none divide-x divide-ink-200">
          {tabs.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${t.id}`}
                id={`tab-${t.id}`}
                onClick={() => pick(t.id)}
                className={[
                  "flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition relative",
                  isActive
                    ? "bg-ink-900 text-white"
                    : "bg-white text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                ].join(" ")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.iconPath} />
                </svg>
                <span className="whitespace-nowrap">{t.label}</span>
                {t.badge && (
                  <span
                    className={[
                      "text-[10px] font-bold tabular-nums rounded-full px-1.5 py-0.5 leading-none",
                      isActive ? "bg-white/20 text-white" : "bg-ink-100 text-ink-600",
                    ].join(" ")}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab panels */}
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`tabpanel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          className="space-y-4"
        >
          {t.id === active && t.content}
        </div>
      ))}
    </div>
  );
}
