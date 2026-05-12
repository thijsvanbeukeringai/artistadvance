"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

export default function AdvancingsFilters({
  artists,
  festivals,
  months,
  selected,
}: {
  artists: Option[];
  festivals: Option[];
  months: Option[];
  selected: { artist: string; festival: string; month: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(key: "artist" | "festival" | "month", value: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const hasActive = selected.artist || selected.festival || selected.month;

  return (
    <section className="bg-white border border-ink-200 rounded-2xl shadow-card p-4">
      <div className="flex items-end gap-3 flex-wrap">
        {artists.length > 0 && (
          <FilterSelect
            label="Artiest"
            value={selected.artist}
            options={artists}
            placeholder="Alle artiesten"
            onChange={(v) => setFilter("artist", v)}
          />
        )}
        <FilterSelect
          label="Festival"
          value={selected.festival}
          options={festivals}
          placeholder="Alle festivals"
          onChange={(v) => setFilter("festival", v)}
        />
        <FilterSelect
          label="Maand"
          value={selected.month}
          options={months}
          placeholder="Alle maanden"
          onChange={(v) => setFilter("month", v)}
        />
        {hasActive && (
          <button
            type="button"
            onClick={() => {
              router.replace("?", { scroll: false });
            }}
            className="text-xs font-semibold text-ink-500 hover:text-ink-900 hover:underline ml-auto"
          >
            Reset filters
          </button>
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 min-w-[160px]">
      <span className="text-[10px] font-semibold text-ink-700 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 rounded-md border border-ink-200 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );
}
