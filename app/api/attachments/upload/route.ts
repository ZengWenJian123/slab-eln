import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth-guard";
import { assertFileSize, saveFormFile } from "@/lib/storage/files";
import { writeAuditLog } from "@/lib/services/audit-log";

const allowedTypes = new Set(["text/csv", "text/plain"]);

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("缺少文件", 400);
  if (!allowedTypes.has(file.type)) {
    return fail("仅支持 csv/txt", 400);
  }

  assertFileSize(file.size);

  const relatedType = String(formData.get("relatedType") ?? "TEST_RECORD");
  const relatedId = Number(formData.get("relatedId") ?? "0");
  if (Number.isNaN(relatedId) || relatedId < 0) {
    return fail("relatedId 无效", 400);
  }

  const stored = await saveFormFile(file, "attachments");
  const created = await prisma.attachment.create({
    data: {
      fileName: stored.fileName,
      originalName: file.name,
      storagePath: stored.relativePath,
      fileSize: file.size,
      mimeType: file.type,
      relatedType: relatedType as
        | "SAMPLE"
        | "ARC_BATCH"
        | "SPINNING_BATCH"
        | "TEST_RECORD",
      relatedId,
      uploadedBy: auth.user.id
    }
  });

  await writeAuditLog({
    module: "ATTACHMENT",
    operationType: "UPLOAD",
    relatedType: "ATTACHMENT",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `上传附件 ${created.originalName}`
  });

  return ok(
    {
      id: created.id,
      path: created.storagePath,
      mime: created.mimeType,
      size: created.fileSize,
      originalName: created.originalName,
      relatedType: created.relatedType,
      relatedId: created.relatedId
    },
    "上传成功",
    201
  );
}
