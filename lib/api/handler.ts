import { ZodType } from "zod";
import { fail } from "@/lib/api/response";

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data?: T; error?: Response }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { error: fail("请求体不是有效 JSON", 400) };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { error: fail("参数校验失败", 400, parsed.error.flatten().fieldErrors) };
  }
  return { data: parsed.data };
}

export function parseId(param: string) {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }
  return id;
}

