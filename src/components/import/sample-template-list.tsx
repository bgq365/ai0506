import Link from "next/link";

import { SAMPLE_TEMPLATE_FILES } from "@/lib/constants";

export function SampleTemplateList() {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {SAMPLE_TEMPLATE_FILES.map((file) => (
        <Link
          key={file}
          href={`/samples/${file}`}
          target="_blank"
          className="rounded-2xl border border-card-border bg-white/55 px-4 py-3 text-sm transition hover:bg-white"
        >
          {file}
        </Link>
      ))}
    </div>
  );
}
