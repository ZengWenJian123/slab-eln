import { getCurrentUser } from "@/lib/auth/session";
import { fail } from "@/lib/api/response";
import type { Role } from "@/types/domain";

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: fail("Unauthorized", 401) };
  }
  if (roles && !roles.includes(user.role)) {
    return { error: fail("Forbidden", 403) };
  }
  return { user };
}

