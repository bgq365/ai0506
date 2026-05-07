import { z } from "zod";

export const duplicateCheckSchema = z.object({
  externalCodes: z.array(z.string()).default([]),
});

export const orderDraftSchema = z.object({
  rowId: z.string(),
  rowIndex: z.number().int().positive(),
  sourceSheet: z.string(),
  batchCode: z.string(),
  externalCode: z.string(),
  senderName: z.string(),
  senderPhone: z.string(),
  senderAddress: z.string(),
  receiverName: z.string(),
  receiverPhone: z.string(),
  receiverAddress: z.string(),
  weightKg: z.string(),
  packageCount: z.string(),
  temperatureZone: z.string(),
  remark: z.string(),
});

export const submitOrdersSchema = z.object({
  batchCode: z.string().min(1),
  fileName: z.string().min(1),
  templateSignature: z.string().min(1),
  rows: z.array(orderDraftSchema),
});

export const templateMappingSchema = z.object({
  templateSignature: z.string().min(1),
  sheetName: z.string().min(1),
  headerFingerprint: z.string().min(1),
  mapping: z.record(z.string(), z.string()),
});

export const orderListQuerySchema = z.object({
  batchCode: z.string().optional(),
  externalCode: z.string().optional(),
  receiverName: z.string().optional(),
  submittedFrom: z.string().optional(),
  submittedTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json(meta ? { data, meta } : { data });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: Array<{ field?: string; message: string }>,
) {
  return Response.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}
