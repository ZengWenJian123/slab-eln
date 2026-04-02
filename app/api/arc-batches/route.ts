import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { arcBatchSchema } from "@/lib/validators/arc-batch";
import { calculateLossRate } from "@/lib/services/calculations";
import { buildArcBatchNo } from "@/lib/services/naming";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);
  const batchNo = searchParams.get("batchNo") ?? undefined;
  const alloyCode = searchParams.get("alloyCode") ?? undefined;

  const where = {
    ...(batchNo ? { batchNo: { contains: batchNo } } : {}),
    ...(alloyCode ? { alloyDesign: { code: { contains: alloyCode } } } : {})
  };

  const [items, total] = await Promise.all([
    prisma.arcMeltingBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        alloyDesign: true
      }
    }),
    prisma.arcMeltingBatch.count({ where })
  ]);
  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;

  const parsed = await parseBody(request, arcBatchSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const lossRate = calculateLossRate(parsed.data.targetWeight, parsed.data.ingotWeight);
  const created = await prisma.arcMeltingBatch.create({
    data: {
      batchNo: buildArcBatchNo(new Date(parsed.data.meltingDate)),
      alloyDesignId: parsed.data.alloyDesignId,
      meltingDate: new Date(parsed.data.meltingDate),
      targetWeight: parsed.data.targetWeight,
      ingotWeight: parsed.data.ingotWeight,
      meltingPoint: parsed.data.meltingPoint ?? null,
      lossRate,
      status: parsed.data.status,
      failureReasonId: parsed.data.failureReasonId ?? null,
      remark: parsed.data.remark ?? null,
      createdBy: auth.user.id
    }
  });

  await writeAuditLog({
    module: "ARC_BATCH",
    operationType: "CREATE",
    relatedType: "ARC_BATCH",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建熔炼批次 ${created.batchNo}`
  });

  return ok(created, "创建成功", 201);
}

