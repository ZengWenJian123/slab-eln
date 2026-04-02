import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { testRecordSchema } from "@/lib/validators/test-record";
import { nextTestRecordNo } from "@/lib/services/sequence";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);

  const [items, total] = await Promise.all([
    prisma.testRecord.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { sample: true, rawFileAttachment: true }
    }),
    prisma.testRecord.count()
  ]);
  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const parsed = await parseBody(request, testRecordSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const created = await prisma.testRecord.create({
    data: {
      recordNo: await nextTestRecordNo(),
      sampleId: parsed.data.sampleId,
      testDate: new Date(parsed.data.testDate),
      operatorName: parsed.data.operatorName,
      instrumentName: parsed.data.instrumentName,
      testCondition: parsed.data.testCondition,
      keyResults: parsed.data.keyResults,
      rawFileAttachmentId: parsed.data.rawFileAttachmentId ?? null,
      status: parsed.data.status,
      failureReasonId: parsed.data.failureReasonId ?? null,
      remark: parsed.data.remark ?? null
    }
  });

  await writeAuditLog({
    module: "TEST",
    operationType: "CREATE",
    relatedType: "TEST_RECORD",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建测试记录 ${created.recordNo}`
  });

  return ok(created, "创建成功", 201);
}

