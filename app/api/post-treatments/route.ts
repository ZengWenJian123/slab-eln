import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { postTreatmentSchema } from "@/lib/validators/post-treatment";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);

  const [items, total] = await Promise.all([
    prisma.postTreatmentRecord.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sample: true
      }
    }),
    prisma.postTreatmentRecord.count()
  ]);
  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const parsed = await parseBody(request, postTreatmentSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const created = await prisma.postTreatmentRecord.create({
    data: {
      sampleId: parsed.data.sampleId,
      treatmentType: parsed.data.treatmentType,
      treatmentParamsJson: parsed.data.treatmentParams as Prisma.InputJsonValue,
      status: parsed.data.status,
      failureReasonId: parsed.data.failureReasonId ?? null,
      remark: parsed.data.remark ?? null,
      createdBy: auth.user.id,
      treatedAt: new Date(parsed.data.treatedAt)
    }
  });

  await writeAuditLog({
    module: "POST_TREATMENT",
    operationType: "CREATE",
    relatedType: "POST_TREATMENT",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: "创建后处理记录"
  });

  return ok(created, "创建成功", 201);
}
