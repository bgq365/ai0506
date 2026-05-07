import { fail, ok, orderListQuerySchema } from "@/lib/api";
import { listOrders } from "@/lib/server/orders";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = orderListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return fail(422, "validation_error", "查询参数不合法");
    }

    const { data, total } = await listOrders(parsed.data);

    return ok(data, {
      total,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      totalPages: Math.max(1, Math.ceil(total / parsed.data.pageSize)),
    });
  } catch {
    return fail(500, "internal_error", "获取运单列表失败");
  }
}
