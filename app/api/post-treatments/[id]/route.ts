import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { postTreatmentSchema } from "@/lib/validators/post-treatment";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.postTreatmentRecord.findUnique({
    where: { id },
    include: { sample: true }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, postTreatmentSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const updated = await prisma.postTreatmentRecord.update({
    where: { id },
    data: {
      sampleId: parsed.data.sampleId,
      treatmentType: parsed.data.treatmentType,
      treatmentParamsJson: parsed.data.treatmentParams as Prisma.InputJsonValue,
      status: parsed.data.status,
      failureReasonId: parsed.data.failureReasonId ?? null,
      remark: parsed.data.remark ?? null,
      treatedAt: new Date(parsed.data.treatedAt)
    }
  });
  await writeAuditLog({
    module: "POST_TREATMENT",
    operationType: "UPDATE",
    relatedType: "POST_TREATMENT",
    relatedId: updated.id,
    operatorId: auth.user.id,
    content: "更新后处理记录"
  });
  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.postTreatmentRecord.delete({ where: { id } });
  await writeAuditLog({
    module: "POST_TREATMENT",
    operationType: "DELETE",
    relatedType: "POST_TREATMENT",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除后处理记录"
  });
  return ok(true, "删除成功");
}
