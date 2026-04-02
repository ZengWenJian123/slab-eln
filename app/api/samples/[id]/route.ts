import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { sampleSchema } from "@/lib/validators/sample";
import { buildDisplayName, buildSampleNo } from "@/lib/services/naming";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);

  const item = await prisma.sample.findUnique({
    where: { id },
    include: {
      alloyDesign: true,
      arcBatch: true,
      spinningBatch: true,
      postTreatments: { orderBy: { createdAt: "desc" } },
      testRecords: { orderBy: { createdAt: "desc" } },
      imageAssets: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, sampleSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const [alloy, arcBatch, spinBatch] = await Promise.all([
    prisma.alloyDesign.findUnique({ where: { id: parsed.data.alloyDesignId } }),
    prisma.arcMeltingBatch.findUnique({ where: { id: parsed.data.arcBatchId } }),
    prisma.spinningBatch.findUnique({ where: { id: parsed.data.spinningBatchId } })
  ]);
  if (!alloy || !arcBatch || !spinBatch) {
    return fail("样品关联数据不存在", 400);
  }

  const updated = await prisma.sample.update({
    where: { id },
    data: {
      sampleNo: buildSampleNo(parsed.data.sampleIndex),
      displayName: buildDisplayName({
        alloyCode: alloy.code,
        arcBatchNo: arcBatch.batchNo,
        spinBatchNo: spinBatch.batchNo,
        state: parsed.data.state,
        bareWireDiameterUm: parsed.data.bareWireDiameterUm,
        treatmentCode: parsed.data.treatmentCode,
        sampleIndex: parsed.data.sampleIndex
      }),
      alloyDesignId: parsed.data.alloyDesignId,
      arcBatchId: parsed.data.arcBatchId,
      spinningBatchId: parsed.data.spinningBatchId,
      state: parsed.data.state,
      bareWireDiameterUm: parsed.data.bareWireDiameterUm,
      coatedWireDiameterUm: parsed.data.coatedWireDiameterUm,
      isWelded2cm: parsed.data.isWelded2cm,
      sampleIndex: parsed.data.sampleIndex,
      remark: parsed.data.remark ?? null
    }
  });

  await writeAuditLog({
    module: "SAMPLE",
    operationType: "UPDATE",
    relatedType: "SAMPLE",
    relatedId: id,
    operatorId: auth.user.id,
    content: `更新样品 ${updated.displayName}`
  });
  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.sample.delete({ where: { id } });
  await writeAuditLog({
    module: "SAMPLE",
    operationType: "DELETE",
    relatedType: "SAMPLE",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除样品"
  });
  return ok(true, "删除成功");
}

