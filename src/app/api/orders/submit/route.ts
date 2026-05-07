import { fail, ok, submitOrdersSchema } from "@/lib/api";
import { submitOrders } from "@/lib/server/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitOrdersSchema.safeParse(body);

    if (!parsed.success) {
      return fail(422, "validation_error", "提交数据不合法");
    }

    const result = await submitOrders(
      parsed.data.fileName,
      parsed.data.templateSignature,
      parsed.data.rows,
    );

    if (result.failedCount > 0) {
      return fail(
        409,
        "submit_conflict",
        "当前数据仍存在错误，无法提交",
        result.failures.map((failure) => ({
          field: failure.field,
          message: `第 ${failure.rowIndex} 行：${failure.message}`,
        })),
      );
    }

    return ok(result);
  } catch {
    return fail(500, "internal_error", "提交下单失败");
  }
}
