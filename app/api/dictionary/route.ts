import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { dictionarySchema } from "@/lib/validators/dictionary";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);
  const dictType = searchParams.get("dictType") ?? undefined;

  const where = dictType ? { dictType } : undefined;
  const [items, total] = await Promise.all([
    prisma.dictionaryItem.findMany({
      where,
      orderBy: [{ dictType: "asc" }, { sortOrder: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.dictionaryItem.count({ where })
  ]);

  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const parsed = await parseBody(request, dictionarySchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const created = await prisma.dictionaryItem.create({
    data: parsed.data
  });
  await writeAuditLog({
    module: "DICTIONARY",
    operationType: "CREATE",
    relatedType: "DICTIONARY_ITEM",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建字典 ${created.dictType}/${created.dictValue}`
  });
  return ok(created, "创建成功", 201);
}

