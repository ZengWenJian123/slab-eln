import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/handler";
import { getPage } from "@/lib/api/query";
import { requireUser } from "@/lib/api/auth-guard";
import { userSchema } from "@/lib/validators/user";
import { writeAuditLog } from "@/lib/services/audit-log";

export async function GET(request: Request) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = getPage(searchParams);

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        uuid: true,
        username: true,
        realName: true,
        role: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.user.count()
  ]);
  return ok({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;

  const parsed = await parseBody(request, userSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  if (!parsed.data.password) {
    return fail("新增用户必须提供密码", 400);
  }

  const created = await prisma.user.create({
    data: {
      username: parsed.data.username,
      realName: parsed.data.realName,
      role: parsed.data.role,
      status: parsed.data.status,
      passwordHash: await bcrypt.hash(parsed.data.password, 10)
    },
    select: {
      id: true,
      uuid: true,
      username: true,
      realName: true,
      role: true,
      status: true
    }
  });
  await writeAuditLog({
    module: "USER",
    operationType: "CREATE",
    relatedType: "USER",
    relatedId: created.id,
    operatorId: auth.user.id,
    content: `创建用户 ${created.username}`
  });
  return ok(created, "创建成功", 201);
}

