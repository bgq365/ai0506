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
        current: 1,
        total: 4,
        percent: clampPercent(1, 4),
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
        current: 2,
        total: 4,
        percent: clampPercent(2, 4),
        label: "识别模板结构中",
      },
    });

    const result = analyzeWorkbook(workbook, fileName, savedMappings);

    postMessageSafe({
      type: "progress",
      payload: {
        phase: "normalizing",
        current: 3,
        total: 4,
        percent: clampPercent(3, 4),
        label: `已生成 ${result.rows.length} 条预览数据`,
      },
    });

    postMessageSafe({
      type: "success",
      payload: result,
    });

    postMessageSafe({
      type: "progress",
      payload: {
        phase: "done",
        current: 4,
        total: 4,
        percent: clampPercent(4, 4),
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
