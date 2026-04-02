import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { dictionarySchema } from "@/lib/validators/dictionary";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.dictionaryItem.findUnique({ where: { id } });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, dictionarySchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const updated = await prisma.dictionaryItem.update({
    where: { id },
    data: parsed.data
  });
  await writeAuditLog({
    module: "DICTIONARY",
    operationType: "UPDATE",
    relatedType: "DICTIONARY_ITEM",
    relatedId: updated.id,
    operatorId: auth.user.id,
    content: `更新字典 ${updated.dictType}/${updated.dictValue}`
  });
  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.dictionaryItem.delete({ where: { id } });
  await writeAuditLog({
    module: "DICTIONARY",
    operationType: "DELETE",
    relatedType: "DICTIONARY_ITEM",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除字典项"
  });
  return ok(true, "删除成功");
}

