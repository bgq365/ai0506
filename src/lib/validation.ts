import { CANONICAL_FIELD_LABELS, REQUIRED_FIELDS, TEMPERATURE_OPTIONS } from "@/lib/constants";
import type { CanonicalFieldKey, OrderDraft, OrderValidationError } from "@/lib/types";
import { normalizePhone, parsePositiveInteger, parsePositiveNumber, phoneDigitsCount } from "@/lib/utils";

function pushError(
  errors: OrderValidationError[],
  row: OrderDraft,
  field: CanonicalFieldKey,
  message: string,
  code: OrderValidationError["code"],
) {
  errors.push({
    rowId: row.rowId,
    rowIndex: row.rowIndex,
    field,
    message,
    code,
  });
}

export function validateOrders(rows: OrderDraft[], existingCodes: string[] = []) {
  const errors: OrderValidationError[] = [];
  const batchDuplicateMap = new Map<string, number[]>();
  const existingCodeSet = new Set(existingCodes.filter(Boolean));

  rows.forEach((row) => {
    REQUIRED_FIELDS.forEach((field) => {
      if (!row[field].trim()) {
        pushError(errors, row, field, `${CANONICAL_FIELD_LABELS[field]}不能为空`, "required");
      }
    });

    if (row.senderPhone.trim()) {
      const normalized = normalizePhone(row.senderPhone);
      const digitsCount = phoneDigitsCount(normalized);
      if (digitsCount < 6 || digitsCount > 20) {
        pushError(errors, row, "senderPhone", "发件人电话格式错误", "invalid_phone");
      }
    }

    if (row.receiverPhone.trim()) {
      const normalized = normalizePhone(row.receiverPhone);
      const digitsCount = phoneDigitsCount(normalized);
      if (digitsCount < 6 || digitsCount > 20) {
        pushError(errors, row, "receiverPhone", "收件人电话格式错误", "invalid_phone");
      }
    }

    if (row.weightKg.trim() && parsePositiveNumber(row.weightKg) === null) {
      pushError(errors, row, "weightKg", "重量必须为正数", "invalid_weight");
    }

    if (row.packageCount.trim() && parsePositiveInteger(row.packageCount) === null) {
      pushError(errors, row, "packageCount", "件数必须为正整数", "invalid_package_count");
    }

    if (row.temperatureZone.trim() && !TEMPERATURE_OPTIONS.includes(row.temperatureZone as never)) {
      pushError(errors, row, "temperatureZone", "温层仅支持常温 / 冷藏 / 冷冻", "invalid_temperature");
    }

    if (row.externalCode.trim()) {
      const code = row.externalCode.trim();
      batchDuplicateMap.set(code, [...(batchDuplicateMap.get(code) ?? []), row.rowIndex]);

      if (existingCodeSet.has(code)) {
        pushError(errors, row, "externalCode", "与历史运单重复", "duplicate_in_database");
      }
    }
  });

  rows.forEach((row) => {
    if (!row.externalCode.trim()) {
      return;
    }

    const duplicates = batchDuplicateMap.get(row.externalCode.trim()) ?? [];
    if (duplicates.length > 1) {
      const otherRows = duplicates.filter((value) => value !== row.rowIndex).join("、");
      pushError(
        errors,
        row,
        "externalCode",
        `与第 ${otherRows} 行外部编码重复`,
        "duplicate_in_batch",
      );
    }
  });

  return errors;
}

export function groupErrorsByRow(errors: OrderValidationError[]) {
  const map = new Map<string, OrderValidationError[]>();

  errors.forEach((error) => {
    map.set(error.rowId, [...(map.get(error.rowId) ?? []), error]);
  });

  return map;
}
