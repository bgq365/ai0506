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
  {
    fileName: "parcel-pivot-template-english.xlsx",
    label: "英文列名模板",
    description: "使用英文别名字段，适合英文业务表或国际化客户资料。",
  },
  {
    fileName: "parcel-pivot-template-multisheet.xlsx",
    label: "多 Sheet 模板",
    description: "含说明页与数据页，便于验证系统自动选择正确数据 Sheet。",
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
