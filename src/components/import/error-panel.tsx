"use client";

import { AlertTriangle } from "lucide-react";

import type { OrderValidationError } from "@/lib/types";

export function ErrorPanel({ errors }: { errors: OrderValidationError[] }) {
  if (errors.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
        当前批次已通过所有前置校验，可以提交下单。
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-orange-800">
        <AlertTriangle className="h-4 w-4" />
        共发现 {errors.length} 个错误，需先修正后再提交
      </div>
      <ul className="mt-3 grid gap-2 text-sm text-orange-900 md:grid-cols-2">
        {errors.map((error, index) => (
          <li key={`${error.rowId}-${error.field}-${index}`} className="rounded-2xl bg-white/70 px-3 py-2">
            第 {error.rowIndex} 行，{error.field}：{error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
