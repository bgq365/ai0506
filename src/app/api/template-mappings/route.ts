import { fail, ok, templateMappingSchema } from "@/lib/api";
import { fetchTemplateMappings, saveTemplateMapping } from "@/lib/server/orders";

export async function GET() {
  try {
    const mappings = await fetchTemplateMappings();
    return ok(mappings);
  } catch {
    return fail(500, "internal_error", "获取模板学习记录失败");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = templateMappingSchema.safeParse(body);

    if (!parsed.success) {
      return fail(422, "validation_error", "模板映射数据不合法");
    }

    await saveTemplateMapping(parsed.data);
    return ok({ saved: true });
  } catch {
    return fail(500, "internal_error", "保存模板映射失败");
  }
}
