import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody, parseId } from "@/lib/api/handler";
import { requireUser } from "@/lib/api/auth-guard";
import { userSchema } from "@/lib/validators/user";
import { writeAuditLog } from "@/lib/services/audit-log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const item = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      uuid: true,
      username: true,
      realName: true,
      role: true,
      status: true
    }
  });
  if (!item) return fail("记录不存在", 404);
  return ok(item);
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  const parsed = await parseBody(request, userSchema);
  if (parsed.error) return parsed.error;
  if (!parsed.data) return fail("请求失败", 400);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      username: parsed.data.username,
      realName: parsed.data.realName,
      role: parsed.data.role,
      status: parsed.data.status,
      ...(parsed.data.password
        ? {
            passwordHash: await bcrypt.hash(parsed.data.password, 10)
          }
        : {})
    },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      status: true
    }
  });

  await writeAuditLog({
    module: "USER",
    operationType: "UPDATE",
    relatedType: "USER",
    relatedId: id,
    operatorId: auth.user.id,
    content: `更新用户 ${updated.username}`
  });

  return ok(updated, "更新成功");
}

export async function DELETE(_: Request, context: Context) {
  const auth = await requireUser(["ADMIN"]);
  if (auth.error) return auth.error;
  const id = parseId((await context.params).id);
  await prisma.user.delete({ where: { id } });
  await writeAuditLog({
    module: "USER",
    operationType: "DELETE",
    relatedType: "USER",
    relatedId: id,
    operatorId: auth.user.id,
    content: "删除用户"
  });
  return ok(true, "删除成功");
}

