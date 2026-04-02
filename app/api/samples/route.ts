import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { sampleSchema } from "@/lib/validators/sample";
import { buildDisplayName, buildSampleNo } from "@/lib/services/naming";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);
  const keyword = searchParams.get("keyword") ?? undefined;

  const where = keyword
    ? {
        OR: [
          { sampleNo: { contains: keyword } },
          { displayName: { contains: keyword } }
        ]
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.sample.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        alloyDesign: true,
        arcBatch: true,
        spinningBatch: true
      }
    }),
    prisma.sample.count({ where })
  ]);

  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
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

  const sampleNo = buildSampleNo(parsed.data.sampleIndex);
  const displayName = buildDisplayName({
    alloyCode: alloy.code,
    arcBatchNo: arcBatch.batchNo,
    spinBatchNo: spinBatch.batchNo,
    state: parsed.data.state,
    bareWireDiameterUm: parsed.data.bareWireDiameterUm,
    treatmentCode: parsed.data.treatmentCode,
    sampleIndex: parsed.data.sampleIndex
  });

  const created = await prisma.sample.create({
    data: {
      sampleNo,
      displayName,
      alloyDesignId: parsed.data.alloyDesignId,
      arcBatchId: parsed.data.arcBatchId,
      spinningBatchId: parsed.data.spinningBatchId,
      state: parsed.data.state,
      bareWireDiameterUm: parsed.data.bareWireDiameterUm,
      coatedWireDiameterUm: parsed.data.coatedWireDiameterUm,
      isWelded2cm: parsed.data.isWelded2cm,
      sampleIndex: parsed.data.sampleIndex,
      remark: parsed.data.remark ?? null,
      createdBy: auth.user.id
    }
  });

  await writeAuditLog({
    module: "SAMPLE",
    operationType: "CREATE",
    relatedType: "SAMPLE",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建样品 ${created.displayName}`
  });

  return ok(created, "创建成功", 201);
}

