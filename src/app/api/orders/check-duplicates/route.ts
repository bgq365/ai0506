import { duplicateCheckSchema, fail, ok } from "@/lib/api";
import { findExistingExternalCodes } from "@/lib/server/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = duplicateCheckSchema.safeParse(body);

    if (!parsed.success) {
      return fail(422, "validation_error", "请求参数不合法");
    }

    const existingCodes = await findExistingExternalCodes(parsed.data.externalCodes);
    return ok({ existingCodes });
  } catch {
    return fail(500, "internal_error", "重复编码检查失败");
  }
}
