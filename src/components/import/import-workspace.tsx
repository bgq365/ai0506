"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpToLine,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";

import { ErrorPanel } from "@/components/import/error-panel";
import { MappingEditor } from "@/components/import/mapping-editor";
import { OrdersGrid } from "@/components/import/orders-grid";
import { SampleTemplateList } from "@/components/import/sample-template-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  createEmptyOrderDraft,
  reindexRows,
  serializeRowsForExport,
  updateBatchCode,
  updateDraftField,
} from "@/lib/order-draft";
import type {
  CanonicalFieldKey,
  FieldMapping,
  ImportDetectionResult,
  ImportProgressState,
  ImportWorkerMessage,
  OrderDraft,
  OrderSubmissionSummary,
  TemplateMapping,
} from "@/lib/types";
import { validateOrders } from "@/lib/validation";

const defaultProgress: ImportProgressState = {
  phase: "idle",
  current: 0,
  total: 0,
  percent: 0,
  label: "等待导入 Excel 文件",
};

function getProgressDisplay(progress: ImportProgressState, rowCount: number) {
  if (progress.phase === "idle") {
    return {
      value: 0,
      label: "等待导入 Excel 文件",
    };
  }

  if (progress.phase === "done") {
    return {
      value: 100,
      label:
        rowCount > 0
          ? `100% · ${rowCount}/${rowCount} · 已生成 ${rowCount} 条预览数据，请检查后提交`
          : "导入完成，请检查预览数据",
    };
  }

  if (progress.phase === "error") {
    return {
      value: progress.percent,
      label: progress.label,
    };
  }

  return {
    value: progress.percent,
    label:
      progress.total > 0
        ? `${progress.percent}% · ${progress.current}/${progress.total} · ${progress.label}`
        : `${progress.percent}% · ${progress.label}`,
  };
}

function createDefaultBatchCode() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `B${year}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function ImportWorkspace() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [savedMappings, setSavedMappings] = useState<TemplateMapping[]>([]);
  const [progress, setProgress] = useState<ImportProgressState>(defaultProgress);
  const [detection, setDetection] = useState<ImportDetectionResult | null>(null);
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [rows, setRows] = useState<OrderDraft[]>([]);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [batchCode, setBatchCode] = useState(createDefaultBatchCode());
  const [isCheckingCodes, setIsCheckingCodes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [fatalError, setFatalError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitSummary, setSubmitSummary] = useState<OrderSubmissionSummary | null>(null);

  const errors = useMemo(() => validateOrders(rows, existingCodes), [existingCodes, rows]);
  const progressDisplay = useMemo(() => getProgressDisplay(progress, rows.length), [progress, rows.length]);

  useEffect(() => {
    void fetch("/api/template-mappings")
      .then((response) => response.json())
      .then((json) => setSavedMappings(json.data ?? []))
      .catch(() => setSavedMappings([]));
  }, []);

  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

  function resetWorkspaceAfterSubmit() {
    setDetection(null);
    setMapping({});
    setRows([]);
    setExistingCodes([]);
    setProgress(defaultProgress);
    setFatalError("");
    setBatchCode(createDefaultBatchCode());

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function refreshExistingCodes(nextRows: OrderDraft[]) {
    setIsCheckingCodes(true);

    try {
      const response = await fetch("/api/orders/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalCodes: nextRows.map((row) => row.externalCode.trim()).filter(Boolean),
        }),
      });

      const json = await response.json();
      setExistingCodes(json.data?.existingCodes ?? []);
    } catch {
      setExistingCodes([]);
    } finally {
      setIsCheckingCodes(false);
    }
  }

  function remapRows(nextDetection: ImportDetectionResult, nextMapping: FieldMapping, sheetName: string) {
    const sheet = nextDetection.availableSheets.find((item) => item.sheetName === sheetName);
    const headerCandidate = sheet?.headerCandidate;
    if (!sheet || !headerCandidate) {
      return [];
    }

    const indexMap = new Map<string, number>();
    headerCandidate.values.forEach((header, index) => {
      indexMap.set(header, index);
    });

    return sheet.rawRows.slice(headerCandidate.rowIndex + 1).map((row, index) => {
      const draft = createEmptyOrderDraft(index + 1, sheet.sheetName, batchCode);

      (Object.keys(nextMapping) as CanonicalFieldKey[]).forEach((field) => {
        const header = nextMapping[field];
        if (!header) {
          return;
        }

        const cellIndex = indexMap.get(header);
        draft[field] = cellIndex === undefined ? "" : String(row[cellIndex] ?? "").trim();
      });

      return draft;
    });
  }

  async function handleFile(file: File) {
    setFatalError("");
    setToast("");

    if (!/\.xlsx?$/.test(file.name.toLowerCase())) {
      setFatalError("仅支持 .xls / .xlsx 文件。");
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    workerRef.current?.terminate();
    const worker = new Worker(new URL("@/workers/excel-import.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onmessage = async (event: MessageEvent<ImportWorkerMessage>) => {
      const message = event.data;

      if (message.type === "progress") {
        setProgress(message.payload);
        return;
      }

      if (message.type === "error") {
        setFatalError(message.payload.message);
        setProgress({
          phase: "error",
          current: 0,
          total: 0,
          percent: 0,
          label: message.payload.message,
        });
        return;
      }

      const payload = message.payload;
      const nextRows = updateBatchCode(payload.rows, batchCode);
      setDetection(payload);
      setMapping(payload.mapping);
      setRows(nextRows);
      await refreshExistingCodes(nextRows);
    };

    worker.postMessage({
      fileName: file.name,
      arrayBuffer,
      savedMappings,
    });
  }

  function handleMappingChange(field: CanonicalFieldKey, header: string) {
    if (!detection) {
      return;
    }

    const nextMapping = {
      ...mapping,
      [field]: header,
    };
    const nextRows = remapRows(detection, nextMapping, detection.selectedSheetName);

    setMapping(nextMapping);
    setRows(nextRows);
    void refreshExistingCodes(nextRows);
  }

  function handleSheetChange(sheetName: string) {
    if (!detection) {
      return;
    }

    const nextDetection = {
      ...detection,
      selectedSheetName: sheetName,
    };
    const nextRows = remapRows(nextDetection, mapping, sheetName);

    setDetection(nextDetection);
    setRows(nextRows);
    void refreshExistingCodes(nextRows);
  }

  function handleCellChange(rowId: string, field: CanonicalFieldKey, value: string) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.rowId === rowId ? updateDraftField(row, field, value) : row)),
    );
  }

  function handleDeleteRow(rowId: string) {
    setRows((currentRows) => reindexRows(currentRows.filter((row) => row.rowId !== rowId)));
  }

  function handleAddRow() {
    setRows((currentRows) => [...currentRows, createEmptyOrderDraft(currentRows.length + 1, "手动新增", batchCode)]);
  }

  function handleExport() {
    const worksheet = XLSX.utils.json_to_sheet(serializeRowsForExport(rows));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "预览数据");
    XLSX.writeFile(workbook, `${batchCode || "orders"}-preview.xlsx`);
  }

  async function handleSubmit() {
    if (!batchCode.trim()) {
      setToast("请先填写批次号。");
      return;
    }

    if (!detection || rows.length === 0 || errors.length > 0) {
      setToast("请先修正错误后再提交。");
      return;
    }

    setIsSubmitting(true);
    setToast("");
    setSubmitSummary(null);
    const totalCount = rows.length;

    try {
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchCode,
          fileName: detection.fileName,
          templateSignature: detection.templateSignature,
          sheetName: detection.selectedSheetName,
          headerFingerprint: detection.headerFingerprint,
          mapping,
          rows,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        const failures =
          json.error?.details?.map((detail: { field?: CanonicalFieldKey; message: string }) => {
            const match = detail.message.match(/^第\s+(\d+)\s+行[:：](.*)$/);
            return {
              rowIndex: match ? Number(match[1]) : 0,
              field: detail.field,
              message: match ? match[2].trim() : detail.message,
            };
          }) ?? [];

        setSubmitSummary({
          batchCode,
          totalCount,
          successCount: 0,
          failedCount: failures.length > 0 ? failures.length : totalCount,
          failures,
        });
        setToast(json.error?.message ?? "提交失败");
        return;
      }

      setSubmitSummary({
        batchId: json.data.batchId,
        batchCode,
        totalCount,
        successCount: json.data.successCount,
        failedCount: json.data.failedCount,
        failures: json.data.failures ?? [],
      });
      setToast(`提交成功：批次号 ${batchCode}，${json.data.successCount} 条已写入数据库。`);
      resetWorkspaceAfterSubmit();
    } catch {
      setSubmitSummary({
        batchCode,
        totalCount,
        successCount: 0,
        failedCount: totalCount,
        failures: [],
      });
      setToast("提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeSheet = detection?.availableSheets.find((sheet) => sheet.sheetName === detection.selectedSheetName);
  const headers = activeSheet?.headerCandidate?.values ?? [];

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-[34px] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge className="bg-accent-soft text-accent">Excel Intake Engine</Badge>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
                万能导入，不靠固定模板吃饭。
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                自动识别多种 Excel 表头结构，给出可编辑预览、一次性错误校验、模板学习和批量入库。
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="metric-chip rounded-3xl px-4 py-3">
              <p className="section-title">模板下载</p>
              <p className="mt-2 text-3xl font-semibold">5</p>
            </div>
            <div className="metric-chip rounded-3xl px-4 py-3">
              <p className="section-title">实时状态</p>
              <p className="mt-2 text-lg font-semibold">{progress.label}</p>
            </div>
            <div className="metric-chip rounded-3xl px-4 py-3">
              <p className="section-title">当前行数</p>
              <p className="mt-2 text-3xl font-semibold">{rows.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel className="p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-title">导入入口</p>
                <h2 className="mt-2 text-2xl font-semibold">上传 Excel 文件并自动分析</h2>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFile(file);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                  <ArrowUpToLine className="h-4 w-4" />
                  选择文件
                </Button>
                <Button variant="ghost" onClick={() => void refreshExistingCodes(rows)} disabled={rows.length === 0}>
                  <RefreshCw className="h-4 w-4" />
                  刷新重复校验
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-card-border bg-white/55 p-4">
              <p className="section-title">批次号</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{batchCode}</p>
              <p className="mt-2 text-sm text-muted-foreground">系统自动生成本次导入批次号，提交时自动写入数据库。</p>
            </div>

            <label
              className={`rounded-[28px] border border-dashed p-8 text-center transition ${
                isDragging
                  ? "border-accent bg-accent-soft"
                  : "border-card-border-strong bg-white/45 hover:bg-white/60"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            >
              <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-ink text-white">
                  <FileSpreadsheet className="h-7 w-7" />
                </div>
                <p className="text-lg font-semibold">拖拽 Excel 到这里，或点击上方按钮上传</p>
                <p className="text-sm text-muted-foreground">
                  支持 `.xls` / `.xlsx`，自动识别多 Sheet、表头行、列名别名和已学习模板。
                </p>
              </div>
            </label>

            <ProgressBar
              value={progressDisplay.value}
              label={progressDisplay.label}
            />

            {fatalError ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                {fatalError}
              </div>
            ) : null}
            {toast ? (
              <div className="rounded-2xl border border-card-border bg-white/70 px-4 py-3 text-sm text-foreground">
                {toast}
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel className="p-5 md:p-6">
          <p className="section-title">模板下载</p>
          <h2 className="mt-2 text-2xl font-semibold">下载标准导入模板</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            不再展示考试样例文件，改为提供系统自定义下载模板。批次号由系统自动生成并随本次提交一起入库。
          </p>
          <div className="mt-5">
            <SampleTemplateList />
          </div>
        </Panel>
      </div>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-title">模板映射</p>
            <h2 className="mt-2 text-2xl font-semibold">自动识别结果可手动调整并学习</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {detection ? `当前模板签名：${detection.templateSignature}` : "尚未读取文件"}
          </div>
        </div>

        {detection && activeSheet ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-card-border bg-white/55 p-4">
                <p className="section-title">批次号</p>
                <p className="mt-2 text-lg font-semibold">{batchCode}</p>
              </div>
              <div className="rounded-2xl border border-card-border bg-white/55 p-4">
                <p className="section-title">选中 Sheet</p>
                <p className="mt-2 text-lg font-semibold">{detection.selectedSheetName}</p>
                {detection.availableSheets.length > 1 ? (
                  <select
                    className="mt-3 w-full rounded-xl border border-card-border bg-white px-3 py-2 text-sm outline-none"
                    value={detection.selectedSheetName}
                    onChange={(event) => handleSheetChange(event.target.value)}
                  >
                    {detection.availableSheets.map((sheet) => (
                      <option key={sheet.sheetName} value={sheet.sheetName}>
                        {sheet.sheetName}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <div className="rounded-2xl border border-card-border bg-white/55 p-4">
                <p className="section-title">命中字段数</p>
                <p className="mt-2 text-lg font-semibold">{activeSheet.matchedFields.length} / 11</p>
              </div>
              <div className="rounded-2xl border border-card-border bg-white/55 p-4">
                <p className="section-title">库内重复检查</p>
                <p className="mt-2 text-lg font-semibold">
                  {isCheckingCodes ? "检查中" : `${existingCodes.length} 个历史重复编码`}
                </p>
              </div>
            </div>

            <MappingEditor headers={headers} mapping={mapping} onChange={handleMappingChange} />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-card-border bg-white/50 px-4 py-5 text-sm text-muted-foreground">
            上传文件后，这里会展示自动识别出的列映射关系，并允许你手动修正。
          </div>
        )}
      </Panel>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-title">错误面板</p>
            <h2 className="mt-2 text-2xl font-semibold">所有问题一次性列出，不逐条折返</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleAddRow}>
              <Plus className="h-4 w-4" />
              新增空行
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
              <Save className="h-4 w-4" />
              导出当前预览
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={rows.length === 0 || isSubmitting}>
              <Send className="h-4 w-4" />
              {isSubmitting ? "提交中..." : "提交下单"}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <ErrorPanel errors={errors} />
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-title">提交结果</p>
            <h2 className="mt-2 text-2xl font-semibold">显示本次提交的成功、失败和总条数</h2>
          </div>
          {submitSummary ? (
            <div className="text-sm text-muted-foreground">批次号：{submitSummary.batchCode}</div>
          ) : null}
        </div>

        {submitSummary ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-card-border bg-white/55 p-4">
                <p className="section-title">总条数</p>
                <p className="mt-2 text-3xl font-semibold">{submitSummary.totalCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="section-title">成功条数</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">{submitSummary.successCount}</p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
                <p className="section-title">失败条数</p>
                <p className="mt-2 text-3xl font-semibold text-orange-700">{submitSummary.failedCount}</p>
              </div>
            </div>

            {submitSummary.failures.length > 0 ? (
              <div className="rounded-3xl border border-orange-200 bg-orange-50/60 p-4">
                <p className="text-sm font-semibold text-orange-800">失败明细</p>
                <ul className="mt-3 grid gap-2 text-sm text-orange-900 md:grid-cols-2">
                  {submitSummary.failures.map((failure, index) => (
                    <li
                      key={`${failure.rowIndex}-${failure.field ?? "unknown"}-${index}`}
                      className="rounded-2xl bg-white/70 px-3 py-2"
                    >
                      第 {failure.rowIndex} 行{failure.field ? `，${failure.field}` : ""}：{failure.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700">
                本次提交已完成，没有失败记录。
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-card-border bg-white/50 px-4 py-10 text-center text-sm text-muted-foreground">
            点击“提交下单”后，这里会显示成功几条、失败几条、总共几条。
          </div>
        )}
      </Panel>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-title">预览与编辑</p>
            <h2 className="mt-2 text-2xl font-semibold">类 Excel 工作区</h2>
          </div>
          <div className="text-sm text-muted-foreground">支持直接编辑单元格，修改后实时重新校验。</div>
        </div>

        <div className="mt-5">
          {rows.length > 0 ? (
            <OrdersGrid rows={rows} errors={errors} onCellChange={handleCellChange} onDeleteRow={handleDeleteRow} />
          ) : (
            <div className="rounded-2xl border border-card-border bg-white/50 px-4 py-10 text-center text-sm text-muted-foreground">
              暂无预览数据。请先上传 Excel 文件。
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
