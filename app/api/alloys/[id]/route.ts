import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { alloySchema } from "@/lib/validators/alloy";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const id = parseId((await context.params).id);
  const item = await prisma.alloyDesign.findUnique({
    where: { id }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);

  const parsed = await parseBody(request, alloySchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const totalPercent = parsed.data.composition.reduce(
    (acc, item) => acc + item.percent,
    0
  );

  const updated = await prisma.alloyDesign.update({
    where: { id },
    data: {
      code: parsed.data.code?.trim(),
      compositionJson: parsed.data.composition,
      totalPercent,
      remark: parsed.data.remark ?? null
    }
  });

  await writeAuditLog({
    module: "ALLOY",
    operationType: "UPDATE",
    relatedType: "ALLOY_DESIGN",
    relatedId: id,
    operatorId: auth.user.id,
    content: `更新成分设计 ${updated.code}`
  });

  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);

  await prisma.alloyDesign.delete({ where: { id } });
  await writeAuditLog({
    module: "ALLOY",
    operationType: "DELETE",
    relatedType: "ALLOY_DESIGN",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除成分设计"
  });
  return ok(true, "删除成功");
}

