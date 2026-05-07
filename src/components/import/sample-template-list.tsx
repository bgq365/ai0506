import Link from "next/link";

const DOWNLOAD_TEMPLATES = [
  {
    fileName: "parcel-pivot-template-standard.xlsx",
    label: "标准导入模板",
    description: "单 Sheet，标准字段列，适合最常见批量下单导入。",
  },
  {
    fileName: "parcel-pivot-template-ecommerce.xlsx",
    label: "电商导入模板",
    description: "带说明行和更贴近电商叫法的列名，批次号在页面顶部填写。",
  },
  {
    fileName: "parcel-pivot-template-grouped.xlsx",
    label: "分组表头模板",
    description: "按发件方、收件方、货物信息分组展示，适合人工录单场景。",
  },
];

export function SampleTemplateList() {
  return (
    <div className="grid gap-2">
      {DOWNLOAD_TEMPLATES.map((template) => (
        <Link
          key={template.fileName}
          href={`/templates/${template.fileName}`}
          target="_blank"
          className="rounded-2xl border border-card-border bg-white/55 px-4 py-3 transition hover:bg-white"
        >
          <p className="text-sm font-semibold text-foreground">{template.label}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{template.description}</p>
        </Link>
      ))}
    </div>
  );
}
