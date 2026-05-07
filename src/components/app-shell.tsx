"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Database, PackageCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "导入工作台", icon: Boxes },
  { href: "/orders", label: "已导入运单", icon: Database },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grain min-h-screen px-4 py-5 md:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1600px] gap-4">
        <aside className="glass-panel hidden w-[300px] shrink-0 rounded-[32px] border border-card-border p-5 lg:flex lg:flex-col">
          <div className="space-y-4">
            <Badge className="bg-accent-soft text-accent">Parcel Pivot</Badge>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-ink text-white">
                  <PackageCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">万能导入下单系统</p>
                  <p className="text-sm text-muted-foreground">多模板识别 / 批量校验 / 运单入库</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                    active
                      ? "border-[#d1b08c] bg-[#f2dfca] text-[#3e2f21] shadow-sm"
                      : "border-card-border bg-white/45 text-foreground hover:bg-white/70",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-foreground")} />
                  <span className={cn("font-medium", active ? "text-[#3e2f21]" : "text-foreground")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[26px] border border-card-border bg-white/55 p-4">
            <p className="section-title">评分要点提醒</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>5 个模板兼容</li>
              <li>全量错误一次性展示</li>
              <li>模板学习 + 历史运单查询</li>
              <li>Vercel 在线可访问</li>
            </ul>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
