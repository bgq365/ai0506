import { nanoid } from "nanoid";

import type { OrderDraft, OrderRecord, OrderSubmissionFailure, TemplateMapping } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase";
import { validateOrders } from "@/lib/validation";
import { parsePositiveInteger, parsePositiveNumber } from "@/lib/utils";

export async function findExistingExternalCodes(externalCodes: string[]) {
  const supabase = getSupabaseServerClient();
  const codes = Array.from(new Set(externalCodes.filter(Boolean)));

  if (!supabase || codes.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("external_code")
    .in("external_code", codes);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => item.external_code).filter(Boolean) as string[];
}

export async function saveTemplateMapping(mapping: TemplateMapping) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const payload = {
    template_signature: mapping.templateSignature,
    sheet_name: mapping.sheetName,
    header_fingerprint: mapping.headerFingerprint,
    mapping_json: mapping.mapping,
    last_used_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("template_mappings")
    .upsert(payload, {
      onConflict: "template_signature",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchTemplateMappings() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return [] as TemplateMapping[];
  }

  const { data, error } = await supabase
    .from("template_mappings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    templateSignature: item.template_signature,
    sheetName: item.sheet_name,
    headerFingerprint: item.header_fingerprint,
    mapping: item.mapping_json ?? {},
    hitCount: item.hit_count ?? 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    lastUsedAt: item.last_used_at,
  })) satisfies TemplateMapping[];
}

export async function submitOrders(
  batchCode: string,
  fileName: string,
  templateSignature: string,
  rows: OrderDraft[],
) {
  const supabase = getSupabaseServerClient();
  const batchId = nanoid();

  const existingCodes = await findExistingExternalCodes(rows.map((row) => row.externalCode));
  const validationErrors = validateOrders(rows, existingCodes);

  if (validationErrors.length > 0) {
    return {
      batchId,
      successCount: 0,
      failedCount: rows.length,
      failures: validationErrors.map<OrderSubmissionFailure>((error) => ({
        rowIndex: error.rowIndex,
        field: error.field,
        message: error.message,
      })),
    };
  }

  if (!supabase) {
    return {
      batchId,
      successCount: rows.length,
      failedCount: 0,
      failures: [] as OrderSubmissionFailure[],
    };
  }

  const submittedAt = new Date().toISOString();
  const { error: insertBatchError } = await supabase.from("import_batches").insert({
    id: batchId,
    batch_code: batchCode,
    file_name: fileName,
    template_signature: templateSignature,
    success_count: rows.length,
    failed_count: 0,
    submitted_at: submittedAt,
  });

  if (insertBatchError) {
    throw insertBatchError;
  }

  const orderPayload = rows.map((row) => ({
    batch_id: batchId,
    batch_code: batchCode,
    template_signature: templateSignature,
    file_name: fileName,
    submitted_at: submittedAt,
    external_code: row.externalCode.trim() || null,
    sender_name: row.senderName.trim(),
    sender_phone: row.senderPhone.trim(),
    sender_address: row.senderAddress.trim(),
    receiver_name: row.receiverName.trim(),
    receiver_phone: row.receiverPhone.trim(),
    receiver_address: row.receiverAddress.trim(),
    weight_kg: parsePositiveNumber(row.weightKg) ?? 0,
    package_count: parsePositiveInteger(row.packageCount) ?? 0,
    temperature_zone: row.temperatureZone.trim(),
    remark: row.remark.trim() || null,
  }));

  const { error: insertOrdersError } = await supabase.from("orders").insert(orderPayload);
  if (insertOrdersError) {
    throw insertOrdersError;
  }

  return {
    batchId,
    successCount: rows.length,
    failedCount: 0,
    failures: [] as OrderSubmissionFailure[],
  };
}

export async function listOrders(query: {
  batchCode?: string;
  externalCode?: string;
  receiverName?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page: number;
  pageSize: number;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      data: [] as OrderRecord[],
      total: 0,
    };
  }

  let builder = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false });

  if (query.batchCode) {
    builder = builder.ilike("batch_code", `%${query.batchCode}%`);
  }

  if (query.externalCode) {
    builder = builder.ilike("external_code", `%${query.externalCode}%`);
  }

  if (query.receiverName) {
    builder = builder.ilike("receiver_name", `%${query.receiverName}%`);
  }

  if (query.submittedFrom) {
    builder = builder.gte("submitted_at", query.submittedFrom);
  }

  if (query.submittedTo) {
    builder = builder.lte("submitted_at", query.submittedTo);
  }

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const { data, error, count } = await builder.range(from, to);

  if (error) {
    throw error;
  }

  return {
    data:
      (data ?? []).map((item) => ({
        id: item.id,
        batchId: item.batch_id,
        batchCode: item.batch_code,
        templateSignature: item.template_signature,
        fileName: item.file_name,
        submittedAt: item.submitted_at,
        externalCode: item.external_code,
        senderName: item.sender_name,
        senderPhone: item.sender_phone,
        senderAddress: item.sender_address,
        receiverName: item.receiver_name,
        receiverPhone: item.receiver_phone,
        receiverAddress: item.receiver_address,
        weightKg: item.weight_kg,
        packageCount: item.package_count,
        temperatureZone: item.temperature_zone,
        remark: item.remark,
      })) satisfies OrderRecord[],
    total: count ?? 0,
  };
}
