import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api/response";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);

  const sampleId = searchParams.get("sampleId");
  const category = searchParams.get("category");
  const stage = searchParams.get("stage");

  const where = {
    ...(sampleId ? { sampleId: Number(sampleId) } : {}),
    ...(category ? { category } : {}),
    ...(stage ? { stage } : {})
  };

  const [items, total] = await Promise.all([
    prisma.imageAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sample: true,
        testRecord: true
      }
    }),
    prisma.imageAsset.count({ where })
  ]);
  return ok({ items, total, page, pageSize });
}

