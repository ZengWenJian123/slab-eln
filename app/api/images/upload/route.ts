import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth-guard";
import { assertFileSize, saveFormFile } from "@/lib/storage/files";
import { writeAuditLog } from "@/lib/services/audit-log";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
]);

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return fail("缺少文件", 400);
  if (!allowedImageTypes.has(file.type)) {
    return fail("仅支持 jpg/jpeg/png/webp", 400);
  }

  assertFileSize(file.size);

  const relatedType = String(formData.get("relatedType") ?? "SAMPLE");
  const relatedId = Number(formData.get("relatedId") ?? "0");
  const category = String(formData.get("category") ?? "DEFAULT");
  const stage = String(formData.get("stage") ?? "UNKNOWN");
  const remark = String(formData.get("remark") ?? "");
  const tags = String(formData.get("tags") ?? "");
  const capturedAtRaw = formData.get("capturedAt");

  if (!relatedId || Number.isNaN(relatedId)) {
    return fail("relatedId 无效", 400);
  }

  const stored = await saveFormFile(file, "images");

  const created = await prisma.imageAsset.create({
    data: {
      fileName: stored.fileName,
      originalName: file.name,
      storagePath: stored.relativePath,
      thumbnailPath: null,
      fileSize: file.size,
      mimeType: file.type,
      category,
      stage,
      relatedType: relatedType as
        | "SAMPLE"
        | "ARC_BATCH"
        | "SPINNING_BATCH"
        | "TEST_RECORD",
      relatedId,
      sampleId: relatedType === "SAMPLE" ? relatedId : null,
      testRecordId: relatedType === "TEST_RECORD" ? relatedId : null,
      tagsJson: tags ? tags.split(",").map((x) => x.trim()) : Prisma.JsonNull,
      remark: remark || null,
      capturedAt:
        typeof capturedAtRaw === "string" && capturedAtRaw
          ? new Date(capturedAtRaw)
          : null,
      uploadedBy: auth.user.id
    }
  });

  await writeAuditLog({
    module: "IMAGE",
    operationType: "UPLOAD",
    relatedType: "IMAGE_ASSET",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `上传图片 ${created.originalName}`
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
