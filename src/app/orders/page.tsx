import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { listOrders } from "@/lib/server/orders";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface OrdersPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = Number(getStringParam(resolvedSearchParams.page) ?? 1);
  const requestedPageSize = Number(getStringParam(resolvedSearchParams.pageSize) ?? 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSize as never) ? requestedPageSize : 10;

  const batchCode = getStringParam(resolvedSearchParams.batchCode);
  const externalCode = getStringParam(resolvedSearchParams.externalCode);
  const receiverName = getStringParam(resolvedSearchParams.receiverName);
  const submittedFrom = getStringParam(resolvedSearchParams.submittedFrom);
  const submittedTo = getStringParam(resolvedSearchParams.submittedTo);

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const { data, total } = await listOrders({
    batchCode,
    externalCode,
    receiverName,
    submittedFrom,
    submittedTo,
    page: safePage,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const resetHref = "/orders";

  function buildPageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (batchCode) params.set("batchCode", batchCode);
    if (externalCode) params.set("externalCode", externalCode);
    if (receiverName) params.set("receiverName", receiverName);
    if (submittedFrom) params.set("submittedFrom", submittedFrom);
    if (submittedTo) params.set("submittedTo", submittedTo);
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    return `/orders?${params.toString()}`;
  }

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
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <input
              name="batchCode"
              defaultValue={batchCode}
              placeholder="按批次号搜索"
              className="rounded-2xl border border-card-border bg-white px-4 py-3 outline-none"
            />
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
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="rounded-2xl border border-card-border bg-white px-4 py-3 outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} 行/页
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            <Button type="submit" className="w-full">
              筛选记录
            </Button>
            <Link href={resetHref} className="w-full">
              <Button type="button" variant="secondary" className="w-full">
                重置
              </Button>
            </Link>
          </form>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#f7eee1]">
                <tr>
                  {["提交时间", "批次号", "外部编码", "收件人", "收件电话", "重量", "件数", "温层", "文件"].map((header) => (
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
                      <td className="px-4 py-4 text-sm">{order.batchCode}</td>
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
                    <td colSpan={9} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      暂无历史运单。完成首次提交后，这里会展示数据库记录。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-card-border bg-white/55 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 页，共 {total} 条，每页 {pageSize} 条
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={buildPageHref(Math.max(1, currentPage - 1))} aria-disabled={currentPage <= 1}>
                <Button type="button" variant="secondary" disabled={currentPage <= 1}>
                  上一页
                </Button>
              </Link>
              <div className="rounded-2xl border border-card-border bg-white px-4 py-2 text-sm text-foreground">
                {currentPage}
              </div>
              <Link href={buildPageHref(Math.min(totalPages, currentPage + 1))} aria-disabled={currentPage >= totalPages}>
                <Button type="button" variant="secondary" disabled={currentPage >= totalPages}>
                  下一页
                </Button>
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
