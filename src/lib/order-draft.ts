import { nanoid } from "nanoid";

import { CANONICAL_FIELDS } from "@/lib/constants";
import type { CanonicalFieldKey, OrderDraft } from "@/lib/types";

export function createEmptyOrderDraft(rowIndex: number, sourceSheet = "手动新增"): OrderDraft {
  return {
    rowId: nanoid(),
    rowIndex,
    sourceSheet,
    externalCode: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    weightKg: "",
    packageCount: "",
    temperatureZone: "",
    remark: "",
  };
}

export function updateDraftField(
  row: OrderDraft,
  field: CanonicalFieldKey,
  value: string,
): OrderDraft {
  return {
    ...row,
    [field]: value,
  };
}

export function reindexRows(rows: OrderDraft[]) {
  return rows.map((row, index) => ({
    ...row,
    rowIndex: index + 1,
  }));
}

export function serializeRowsForExport(rows: OrderDraft[]) {
  return rows.map((row) => {
    const record: Record<string, string> = {};

    CANONICAL_FIELDS.forEach((field) => {
      record[field] = row[field];
    });

    return record;
  });
}
