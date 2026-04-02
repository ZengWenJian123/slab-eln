import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { testRecordSchema } from "@/lib/validators/test-record";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.testRecord.findUnique({
    where: { id },
    include: { sample: true, rawFileAttachment: true }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, testRecordSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const updated = await prisma.testRecord.update({
    where: { id },
    data: {
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
    operationType: "UPDATE",
    relatedType: "TEST_RECORD",
    relatedId: updated.id,
    operatorId: auth.user.id,
    content: `更新测试记录 ${updated.recordNo}`
  });
  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.testRecord.delete({ where: { id } });
  await writeAuditLog({
    module: "TEST",
    operationType: "DELETE",
    relatedType: "TEST_RECORD",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除测试记录"
  });
  return ok(true, "删除成功");
}

