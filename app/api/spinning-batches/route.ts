import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { spinningBatchSchema } from "@/lib/validators/spinning-batch";
import { calculateGlassThickness } from "@/lib/services/calculations";
import { buildSpinningBatchNo } from "@/lib/services/naming";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);
  const batchNo = searchParams.get("batchNo") ?? undefined;

  const where = batchNo ? { batchNo: { contains: batchNo } } : undefined;

  const [items, total] = await Promise.all([
    prisma.spinningBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        alloyDesign: true,
        arcBatch: true
      }
    }),
    prisma.spinningBatch.count({ where })
  ]);
  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const parsed = await parseBody(request, spinningBatchSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const created = await prisma.spinningBatch.create({
    data: {
      batchNo: buildSpinningBatchNo(new Date(parsed.data.spinningDate)),
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
      remark: parsed.data.remark ?? null,
      createdBy: auth.user.id
    }
  });

  await writeAuditLog({
    module: "SPIN_BATCH",
    operationType: "CREATE",
    relatedType: "SPINNING_BATCH",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建拉丝批次 ${created.batchNo}`
  });

  return ok(created, "创建成功", 201);
}

