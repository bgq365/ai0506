import type { CANONICAL_FIELDS, TEMPERATURE_OPTIONS } from "@/lib/constants";

export type CanonicalFieldKey = (typeof CANONICAL_FIELDS)[number];

export type TemperatureZone = (typeof TEMPERATURE_OPTIONS)[number];

export type FieldMapping = Partial<Record<CanonicalFieldKey, string>>;

export interface OrderDraft {
  rowId: string;
  rowIndex: number;
  sourceSheet: string;
  batchCode: string;
  externalCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weightKg: string;
  packageCount: string;
  temperatureZone: string;
  remark: string;
}

export interface OrderValidationError {
  rowId: string;
  rowIndex: number;
  field: CanonicalFieldKey;
  message: string;
  code:
    | "required"
    | "invalid_phone"
    | "invalid_weight"
    | "invalid_package_count"
    | "invalid_temperature"
    | "duplicate_in_batch"
    | "duplicate_in_database";
}

export interface ImportProgressState {
  phase: "idle" | "reading" | "detecting" | "mapping" | "normalizing" | "validating" | "done" | "error";
  current: number;
  total: number;
  percent: number;
  label: string;
}

export interface TemplateMapping {
  id?: string;
  templateSignature: string;
  sheetName: string;
  headerFingerprint: string;
  mapping: FieldMapping;
  hitCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
}

export interface HeaderCandidate {
  rowIndex: number;
  values: string[];
  normalizedValues: string[];
  score: number;
}

export interface SheetAnalysis {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  headerCandidate: HeaderCandidate | null;
  sampleRows: string[][];
  rawRows: string[][];
  mapping: FieldMapping;
  matchedFields: CanonicalFieldKey[];
  templateSignature: string;
}

export interface ImportDetectionResult {
  fileName: string;
  selectedSheetName: string;
  templateSignature: string;
  availableSheets: SheetAnalysis[];
  headerFingerprint: string;
  mapping: FieldMapping;
  rows: OrderDraft[];
}

export interface ImportWorkerSuccessMessage {
  type: "success";
  payload: ImportDetectionResult;
}

export interface ImportWorkerProgressMessage {
  type: "progress";
  payload: ImportProgressState;
}

export interface ImportWorkerErrorMessage {
  type: "error";
  payload: {
    message: string;
  };
}

export type ImportWorkerMessage =
  | ImportWorkerSuccessMessage
  | ImportWorkerProgressMessage
  | ImportWorkerErrorMessage;

export interface OrderSubmissionFailure {
  rowIndex: number;
  field?: CanonicalFieldKey;
  message: string;
}

export interface SubmitOrdersRequest {
  batchCode: string;
  fileName: string;
  templateSignature: string;
  rows: OrderDraft[];
}

export interface OrderRecord {
  id: string;
  batchId: string;
  batchCode: string;
  templateSignature: string;
  fileName: string;
  submittedAt: string;
  externalCode: string | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weightKg: number;
  packageCount: number;
  temperatureZone: string;
  remark: string | null;
}

export interface OrderListQuery {
  batchCode?: string;
  externalCode?: string;
  receiverName?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      message: string;
    }>;
  };
}
