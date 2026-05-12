"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type Type = "text" | "number" | "time" | "date" | "textarea" | "select" | "checkbox";

type Option = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  type?: Type;
  defaultValue?: string | number | boolean | null;
  options?: Option[];
  placeholder?: string;
  hint?: string;
  cols?: 1 | 2 | 3;
  onSave: (value: unknown) => Promise<unknown>;
};

export default function AutosaveField({
  name,
  label,
  type = "text",
  defaultValue,
  options,
  placeholder,
  hint,
  cols = 1,
  onSave,
}: Props) {
  const [value, setValue] = useState<any>(defaultValue ?? (type === "checkbox" ? false : ""));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounce
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      doSave(value);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // skip first save (matches default)
  const firstRender = useRef(true);
  async function doSave(v: any) {
    if (firstRender.current) { firstRender.current = false; return; }
    setStatus("saving");
    try {
      let parsed: any = v;
      if (type === "number") parsed = v === "" ? null : Number(v);
      if (type === "checkbox") parsed = !!v;
      startTransition(async () => {
        await onSave(parsed);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1200);
      });
    } catch {
      setStatus("error");
    }
  }

  const colSpan = cols === 1 ? "md:col-span-1" : cols === 2 ? "md:col-span-2" : "md:col-span-3";

  const baseInput =
    "w-full bg-white border border-ink-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400";

  return (
    <div className={colSpan}>
      <label className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-ink-700">{label}</span>
        <SaveIndicator status={status} />
      </label>

      {type === "textarea" && (
        <textarea
          name={name}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className={baseInput + " resize-y"}
        />
      )}

      {type === "select" && (
        <select
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={baseInput}
        >
          <option value="">- kies -</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {type === "checkbox" && (
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => setValue(!value)}
            className={[
              "w-11 h-6 rounded-full transition relative flex-shrink-0",
              value ? "bg-brand-500" : "bg-ink-200",
            ].join(" ")}
            aria-pressed={!!value}
          >
            <span
              className={[
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                value ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
          <span className="text-sm text-ink-700">{value ? "Ja" : "Nee"}</span>
        </div>
      )}

      {(type === "text" || type === "number" || type === "time" || type === "date") && (
        <input
          name={name}
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className={baseInput}
        />
      )}

      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return <span className="text-[10px] text-ink-300">auto-save</span>;
  if (status === "saving") return <span className="text-[10px] text-ink-500 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse" />opslaan…</span>;
  if (status === "saved") return <span className="text-[10px] text-emerald-600 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />opgeslagen</span>;
  return <span className="text-[10px] text-red-600">fout</span>;
}
