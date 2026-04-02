import type { Role } from "@/types/domain";

export function hasAnyRole(userRole: Role, roles: Role[]) {
  return roles.includes(userRole);
}

export function assertRole(userRole: Role, roles: Role[]) {
  if (!roles.includes(userRole)) {
    throw new Error("FORBIDDEN");
  }
}

