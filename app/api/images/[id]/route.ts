import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.imageAsset.findUnique({ where: { id } });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.imageAsset.delete({ where: { id } });
  await writeAuditLog({
    module: "IMAGE",
    operationType: "DELETE",
    relatedType: "IMAGE_ASSET",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除图片"
  });
  return ok(true, "删除成功");
}

