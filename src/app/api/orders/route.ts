import { fail, ok, orderListQuerySchema } from "@/lib/api";
import { listOrders } from "@/lib/server/orders";

function toObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = orderListQuerySchema.safeParse(toObject(searchParams));

    if (!parsed.success) {
      return fail(422, "validation_error", "查询参数不合法");
    }

    const { data, total } = await listOrders(parsed.data);
    const { page, pageSize } = parsed.data;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return ok(data, {
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch {
    return fail(500, "internal_error", "获取历史运单失败");
  }
}
