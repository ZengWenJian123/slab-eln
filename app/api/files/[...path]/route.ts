import { readFile } from "node:fs/promises";
import path from "node:path";
import { fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth-guard";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const filePath = (await context.params).path.join("/");
  const absPath = path.join(process.cwd(), filePath);

  try {
    const content = await readFile(absPath);
    return new Response(content);
  } catch {
    return fail("文件不存在", 404);
  }
}

