import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { arcBatchSchema } from "@/lib/validators/arc-batch";
import { calculateLossRate } from "@/lib/services/calculations";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.arcMeltingBatch.findUnique({
    where: { id },
    include: { alloyDesign: true }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, arcBatchSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const updated = await prisma.arcMeltingBatch.update({
    where: { id },
    data: {
      alloyDesignId: parsed.data.alloyDesignId,
      meltingDate: new Date(parsed.data.meltingDate),
      targetWeight: parsed.data.targetWeight,
      ingotWeight: parsed.data.ingotWeight,
      meltingPoint: parsed.data.meltingPoint ?? null,
      lossRate: calculateLossRate(parsed.data.targetWeight, parsed.data.ingotWeight),
      status: parsed.data.status,
      failureReasonId: parsed.data.failureReasonId ?? null,
      remark: parsed.data.remark ?? null
    }
  });

  await writeAuditLog({
    module: "ARC_BATCH",
    operationType: "UPDATE",
    relatedType: "ARC_BATCH",
    relatedId: updated.id,
    operatorId: auth.user.id,
    content: `更新熔炼批次 ${updated.batchNo}`
  });
  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.arcMeltingBatch.delete({ where: { id } });
  await writeAuditLog({
    module: "ARC_BATCH",
    operationType: "DELETE",
    relatedType: "ARC_BATCH",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除熔炼批次"
  });
  return ok(true, "删除成功");
}

