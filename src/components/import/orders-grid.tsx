"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useMemo } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { CANONICAL_FIELDS, CANONICAL_FIELD_LABELS } from "@/lib/constants";
import type { CanonicalFieldKey, OrderDraft, OrderValidationError } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrdersGridProps {
  rows: OrderDraft[];
  errors: OrderValidationError[];
  onCellChange: (rowId: string, field: CanonicalFieldKey, value: string) => void;
  onDeleteRow: (rowId: string) => void;
}

export function OrdersGrid({ rows, errors, onCellChange, onDeleteRow }: OrdersGridProps) {
  const errorMap = useMemo(() => {
    const map = new Map<string, string>();
    errors.forEach((error) => {
      map.set(`${error.rowId}:${error.field}`, error.message);
    });
    return map;
  }, [errors]);

  const columns = useMemo(
    () => [
      {
        header: "#",
        accessorKey: "rowIndex",
        cell: ({ row }: { row: { original: OrderDraft } }) => (
          <div className="w-14 text-sm text-muted-foreground">{row.original.rowIndex}</div>
        ),
      },
      ...CANONICAL_FIELDS.map((field) => ({
        header: CANONICAL_FIELD_LABELS[field],
        accessorKey: field,
        cell: ({ row }: { row: { original: OrderDraft } }) => {
          const rowItem = row.original;
          const key = `${rowItem.rowId}:${field}`;
          const hasError = errorMap.has(key);

          return (
            <div className="min-w-[180px] space-y-1">
              <input
                value={rowItem[field]}
                onChange={(event) => onCellChange(rowItem.rowId, field, event.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition",
                  hasError
                    ? "border-danger bg-danger-soft text-danger"
                    : "border-card-border focus:border-accent",
                )}
              />
              {hasError ? (
                <p className="text-xs text-danger">{errorMap.get(key)}</p>
              ) : null}
            </div>
          );
        },
      })),
      {
        header: "操作",
        id: "actions",
        cell: ({ row }: { row: { original: OrderDraft } }) => (
          <button
            className="rounded-xl border border-card-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-white"
            onClick={() => onDeleteRow(row.original.rowId)}
          >
            删除
          </button>
        ),
      },
    ],
    [errorMap, onCellChange, onDeleteRow],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-[28px] border border-card-border bg-white/40">
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[#f7eee1]/95 backdrop-blur">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b border-card-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="align-top">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-b border-card-border/70 px-3 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
