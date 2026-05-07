/// <reference lib="webworker" />

import * as XLSX from "xlsx";

import { analyzeWorkbook } from "@/lib/template-detection";
import type { ImportWorkerMessage, TemplateMapping } from "@/lib/types";
import { clampPercent } from "@/lib/utils";

declare const self: DedicatedWorkerGlobalScope;

interface WorkerPayload {
  fileName: string;
  arrayBuffer: ArrayBuffer;
  savedMappings?: TemplateMapping[];
}

function postMessageSafe(message: ImportWorkerMessage) {
  self.postMessage(message);
}

self.onmessage = async (event: MessageEvent<WorkerPayload>) => {
  const { fileName, arrayBuffer, savedMappings = [] } = event.data;

  try {
    postMessageSafe({
      type: "progress",
      payload: {
        phase: "reading",
        current: 0,
        total: 0,
        percent: 8,
        label: "读取 Excel 文件中",
      },
    });

    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: false,
      dense: true,
    });

    postMessageSafe({
      type: "progress",
      payload: {
        phase: "detecting",
        current: 0,
        total: 0,
        percent: 15,
        label: "准备分析工作表",
      },
    });

    const result = analyzeWorkbook(workbook, fileName, savedMappings, (progress) => {
      postMessageSafe({
        type: "progress",
        payload: {
          phase: progress.phase,
          current: progress.current,
          total: progress.total,
          percent: clampPercent(progress.current, progress.total),
          label: progress.label,
        },
      });
    });

    postMessageSafe({
      type: "success",
      payload: result,
    });

    postMessageSafe({
      type: "progress",
      payload: {
        phase: "done",
        current: result.rows.length,
        total: result.rows.length,
        percent: 100,
        label: "导入完成",
      },
    });
  } catch (error) {
    postMessageSafe({
      type: "error",
      payload: {
        message: error instanceof Error ? error.message : "Excel 导入失败",
      },
    });
  }
};
