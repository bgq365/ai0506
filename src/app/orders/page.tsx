import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { listOrders } from "@/lib/server/orders";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const page = Number(resolvedSearchParams.page ?? 1);
  const pageSize = Number(resolvedSearchParams.pageSize ?? 10);
  const externalCode =
    typeof resolvedSearchParams.externalCode === "string"
      ? resolvedSearchParams.externalCode
      : undefined;
  const receiverName =
    typeof resolvedSearchParams.receiverName === "string"
      ? resolvedSearchParams.receiverName
      : undefined;
  const submittedFrom =
    typeof resolvedSearchParams.submittedFrom === "string"
      ? resolvedSearchParams.submittedFrom
      : undefined;
  const submittedTo =
    typeof resolvedSearchParams.submittedTo === "string"
      ? resolvedSearchParams.submittedTo
      : undefined;

  const { data, total } = await listOrders({
    externalCode,
    receiverName,
    submittedFrom,
    submittedTo,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
  });

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="glass-panel rounded-[34px] p-6 md:p-8">
          <Badge className="bg-[#dcefe9] text-accent-2">Orders Archive</Badge>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">已导入运单列表</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                从数据库读取历史运单，按外部编码、收件人和提交时间筛选，保证交付时能清楚展示持久化结果。
              </p>
            </div>
            <div className="rounded-3xl border border-card-border bg-white/55 px-5 py-4">
              <p className="section-title">总记录数</p>
              <p className="mt-2 text-4xl font-semibold">{total}</p>
            </div>
          </div>
        </section>

        <Panel className="p-5 md:p-6">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              name="externalCode"
              defaultValue={externalCode}
              placeholder="按外部编码搜索"
              className="rounded-2xl border border-card-border bg-white px-4 py-3 outline-none"
            />
            <input
              name="receiverName"
              defaultValue={receiverName}
              placeholder="按收件人搜索"
              className="rounded-2xl border border-card-border bg-white px-4 py-3 outline-none"
            />
            <input
              type="date"
              name="submittedFrom"
              defaultValue={submittedFrom}
              className="rounded-2xl border border-card-border bg-white px-4 py-3 outline-none"
            />
            <input
              type="date"
              name="submittedTo"
              defaultValue={submittedTo}
              className="rounded-2xl border border-card-border bg-white px-4 py-3 outline-none"
            />
            <button className="rounded-2xl bg-surface-ink px-4 py-3 text-white">筛选记录</button>
          </form>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#f7eee1]">
                <tr>
                  {["提交时间", "外部编码", "收件人", "收件电话", "重量", "件数", "温层", "文件"].map((header) => (
                    <th
                      key={header}
                      className="border-b border-card-border px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((order) => (
                    <tr key={order.id} className="border-b border-card-border/70 bg-white/45">
                      <td className="px-4 py-4 text-sm">{formatDateTime(order.submittedAt)}</td>
                      <td className="px-4 py-4 text-sm">{order.externalCode ?? "-"}</td>
                      <td className="px-4 py-4 text-sm">{order.receiverName}</td>
                      <td className="px-4 py-4 text-sm">{order.receiverPhone}</td>
                      <td className="px-4 py-4 text-sm">{order.weightKg}</td>
                      <td className="px-4 py-4 text-sm">{order.packageCount}</td>
                      <td className="px-4 py-4 text-sm">{order.temperatureZone}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{order.fileName}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      暂无历史运单。接入 Supabase 并完成首次提交后，这里会展示数据库记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
