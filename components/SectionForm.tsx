"use client";

import { saveSectionAction } from "@/lib/actions";
import AutosaveField from "./AutosaveField";
import type { SectionType } from "@/lib/types";

type FieldConfig =
  | { kind: "text"; name: string; label: string; placeholder?: string; cols?: 1 | 2 | 3; hint?: string }
  | { kind: "number"; name: string; label: string; placeholder?: string; cols?: 1 | 2 | 3 }
  | { kind: "time"; name: string; label: string; cols?: 1 | 2 | 3 }
  | { kind: "date"; name: string; label: string; cols?: 1 | 2 | 3 }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; cols?: 1 | 2 | 3 }
  | { kind: "select"; name: string; label: string; options: { value: string; label: string }[]; cols?: 1 | 2 | 3 }
  | { kind: "checkbox"; name: string; label: string; cols?: 1 | 2 | 3 };

type Group = { title: string; fields: FieldConfig[] };

type Props = {
  token: string;
  type: SectionType;
  groups: Group[];
  data: Record<string, unknown>;
};

export default function SectionForm({ token, type, groups, data }: Props) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <fieldset key={g.title} className="bg-white border border-ink-200 rounded-2xl shadow-card p-6">
          <legend className="font-bold text-ink-900 mb-4">{g.title}</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {g.fields.map((f) => (
              <AutosaveField
                key={f.name}
                name={f.name}
                label={f.label}
                type={f.kind}
                cols={f.cols}
                placeholder={"placeholder" in f ? f.placeholder : undefined}
                options={f.kind === "select" ? f.options : undefined}
                defaultValue={data[f.name] as any}
                onSave={(value) => saveSectionAction(token, type, { [f.name]: value })}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
