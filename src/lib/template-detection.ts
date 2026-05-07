import { nanoid } from "nanoid";
import * as XLSX from "xlsx";

import { CANONICAL_FIELDS, FIELD_SYNONYMS } from "@/lib/constants";
import type {
  CanonicalFieldKey,
  FieldMapping,
  HeaderCandidate,
  ImportDetectionResult,
  OrderDraft,
  SheetAnalysis,
  TemplateMapping,
} from "@/lib/types";
import { cleanCellValue, normalizeHeaderValue } from "@/lib/utils";

function scoreHeader(values: string[]) {
  let score = 0;

  values.forEach((value) => {
    const normalized = normalizeHeaderValue(value);
    if (!normalized) {
      return;
    }

    for (const [field, aliases] of Object.entries(FIELD_SYNONYMS) as Array<
      [CanonicalFieldKey, readonly string[]]
    >) {
      const normalizedAliases = aliases.map(normalizeHeaderValue);
      if (normalizedAliases.includes(normalized)) {
        score += 3;
      } else if (normalized.includes(normalizeHeaderValue(field))) {
        score += 1;
      }
    }
  });

  return score;
}

function buildHeaderCandidate(rows: string[][]) {
  const candidates: HeaderCandidate[] = rows.slice(0, 8).map((values, index) => {
    const normalizedValues = values.map(normalizeHeaderValue);
    return {
      rowIndex: index,
      values,
      normalizedValues,
      score: scoreHeader(values),
    };
  });

  return candidates.sort((left, right) => right.score - left.score)[0] ?? null;
}

function autoMapHeaders(headerValues: string[]) {
  const mapping: FieldMapping = {};

  headerValues.forEach((value) => {
    const normalized = normalizeHeaderValue(value);
    if (!normalized) {
      return;
    }

    for (const field of CANONICAL_FIELDS) {
      const aliases = FIELD_SYNONYMS[field].map(normalizeHeaderValue);
      if (aliases.includes(normalized)) {
        mapping[field] = value;
      }
    }
  });

  return mapping;
}

function buildTemplateSignature(sheetName: string, headerRowIndex: number, headerValues: string[]) {
  const normalizedHeaders = headerValues.map(normalizeHeaderValue);
  return `${sheetName}::${headerRowIndex}::${normalizedHeaders.join("|")}::${headerValues.length}`;
}

function getHeaderFingerprint(headerValues: string[]) {
  return headerValues.map(normalizeHeaderValue).join("|");
}

function selectBestSheet(sheetAnalyses: SheetAnalysis[]) {
  return [...sheetAnalyses].sort((left, right) => {
    const leftScore = left.headerCandidate?.score ?? -1;
    const rightScore = right.headerCandidate?.score ?? -1;
    const leftMatchCount = left.matchedFields.length;
    const rightMatchCount = right.matchedFields.length;

    if (leftMatchCount === rightMatchCount) {
      return rightScore - leftScore;
    }

    return rightMatchCount - leftMatchCount;
  })[0];
}

function toDraftRows(sheet: SheetAnalysis, templateMapping?: TemplateMapping) {
  const activeMapping = templateMapping?.mapping ?? sheet.mapping;
  const headerCandidate = sheet.headerCandidate;
  if (!headerCandidate) {
    return [];
  }

  const headerIndexMap = new Map<string, number>();
  headerCandidate.values.forEach((header, index) => {
    headerIndexMap.set(header, index);
  });

  return sheet.rawRows.slice(headerCandidate.rowIndex + 1).map((row, index) => {
    const draft: OrderDraft = {
      rowId: nanoid(),
      rowIndex: index + 1,
      sourceSheet: sheet.sheetName,
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

    CANONICAL_FIELDS.forEach((field) => {
      const mappedHeader = activeMapping[field];
      if (!mappedHeader) {
        draft[field] = "";
        return;
      }

      const cellIndex = headerIndexMap.get(mappedHeader);
      draft[field] = cellIndex === undefined ? "" : cleanCellValue(row[cellIndex]);
    });

    return draft;
  });
}

export function analyzeWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
  savedMappings: TemplateMapping[] = [],
): ImportDetectionResult {
  const analyses = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    }) as Array<Array<string | number | null | undefined>>;

    const rawRows = rows.map((row) => row.map(cleanCellValue));
    const headerCandidate = buildHeaderCandidate(rawRows);
    const mapping = headerCandidate ? autoMapHeaders(headerCandidate.values) : {};
    const matchedFields = CANONICAL_FIELDS.filter((field) => Boolean(mapping[field]));
    const templateSignature = buildTemplateSignature(
      sheetName,
      headerCandidate?.rowIndex ?? -1,
      headerCandidate?.values ?? [],
    );

    return {
      sheetName,
      rowCount: rawRows.length,
      columnCount: rawRows.reduce((max, row) => Math.max(max, row.length), 0),
      headerCandidate,
      sampleRows: rawRows.slice(0, 6),
      rawRows,
      mapping,
      matchedFields,
      templateSignature,
    } satisfies SheetAnalysis;
  });

  const selectedSheet = selectBestSheet(analyses);
  const savedTemplate = savedMappings.find(
    (mapping) => mapping.templateSignature === selectedSheet.templateSignature,
  );
  const rows = toDraftRows(selectedSheet, savedTemplate);

  return {
    fileName,
    selectedSheetName: selectedSheet.sheetName,
    templateSignature: selectedSheet.templateSignature,
    availableSheets: analyses,
    headerFingerprint: getHeaderFingerprint(selectedSheet.headerCandidate?.values ?? []),
    mapping: savedTemplate?.mapping ?? selectedSheet.mapping,
    rows,
  };
}
