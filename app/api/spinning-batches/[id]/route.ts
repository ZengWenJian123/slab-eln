import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { spinningBatchSchema } from "@/lib/validators/spinning-batch";
import { calculateGlassThickness } from "@/lib/services/calculations";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.spinningBatch.findUnique({
    where: { id },
    include: { alloyDesign: true, arcBatch: true }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, spinningBatchSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const updated = await prisma.spinningBatch.update({
    where: { id },
    data: {
      alloyDesignId: parsed.data.alloyDesignId,
      arcBatchId: parsed.data.arcBatchId,
      spinningDate: new Date(parsed.data.spinningDate),
      glassTubeDiameter: parsed.data.glassTubeDiameter,
      feedWeight: parsed.data.feedWeight,
      spinningTemperature: parsed.data.spinningTemperature,
      windingSpeedRpm: parsed.data.windingSpeedRpm,
      coolingWaterTemp: parsed.data.coolingWaterTemp,
      negativePressureKpa: parsed.data.negativePressureKpa,
      coatedWireDiameterUm: parsed.data.coatedWireDiameterUm,
      bareWireDiameterUm: parsed.data.bareWireDiameterUm,
      glassEtchTime: parsed.data.glassEtchTime,
      glassThicknessUm: calculateGlassThickness(
        parsed.data.coatedWireDiameterUm,
        parsed.data.bareWireDiameterUm
      ),
      needMagneticTest: parsed.data.needMagneticTest,
      status: parsed.data.status,
      failureReasonId: parsed.data.failureReasonId ?? null,
      remark: parsed.data.remark ?? null
    }
  });

  await writeAuditLog({
    module: "SPIN_BATCH",
    operationType: "UPDATE",
    relatedType: "SPINNING_BATCH",
    relatedId: updated.id,
    operatorId: auth.user.id,
    content: `更新拉丝批次 ${updated.batchNo}`
  });
  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.spinningBatch.delete({ where: { id } });
  await writeAuditLog({
    module: "SPIN_BATCH",
    operationType: "DELETE",
    relatedType: "SPINNING_BATCH",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除拉丝批次"
  });
  return ok(true, "删除成功");
}

