"use client";

import { CANONICAL_FIELDS, CANONICAL_FIELD_LABELS, FIELD_DESCRIPTION } from "@/lib/constants";
import type { CanonicalFieldKey, FieldMapping } from "@/lib/types";

export function MappingEditor({
  headers,
  mapping,
  onChange,
}: {
  headers: string[];
  mapping: FieldMapping;
  onChange: (field: CanonicalFieldKey, header: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {CANONICAL_FIELDS.map((field) => (
        <label
          key={field}
          className="rounded-2xl border border-card-border bg-white/60 p-3 text-sm text-foreground"
        >
          <div className="mb-2">
            <p className="font-semibold">{CANONICAL_FIELD_LABELS[field]}</p>
            <p className="mt-1 text-xs text-muted-foreground">{FIELD_DESCRIPTION[field]}</p>
          </div>
          <select
            className="w-full rounded-xl border border-card-border bg-white px-3 py-2 outline-none"
            value={mapping[field] ?? ""}
            onChange={(event) => onChange(field, event.target.value)}
          >
            <option value="">未映射</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
