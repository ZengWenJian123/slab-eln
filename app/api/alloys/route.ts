import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { alloySchema } from "@/lib/validators/alloy";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { nextAlloyCode } from "@/lib/services/sequence";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);
  const code = searchParams.get("code") ?? undefined;

  const where = code ? { code: { contains: code } } : undefined;
  const [items, total] = await Promise.all([
    prisma.alloyDesign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creator: { select: { realName: true } }
      }
    }),
    prisma.alloyDesign.count({ where })
  ]);

  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN", "OPERATOR"]);
  if (auth.error) return auth.error;

  const parsed = await parseBody(request, alloySchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const totalPercent = parsed.data.composition.reduce(
    (acc, item) => acc + item.percent,
    0
  );
  const code = parsed.data.code?.trim() || (await nextAlloyCode());

  const created = await prisma.alloyDesign.create({
    data: {
      code,
      compositionJson: parsed.data.composition,
      totalPercent,
      remark: parsed.data.remark ?? null,
      createdBy: auth.user.id
    }
  });

  await writeAuditLog({
    module: "ALLOY",
    operationType: "CREATE",
    relatedType: "ALLOY_DESIGN",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建成分设计 ${created.code}`
  });

  return ok(created, "创建成功", 201);
}

