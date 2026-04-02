import { prisma } from "@/lib/prisma";

type AuditPayload = {
  module: string;
  operationType: "CREATE" | "UPDATE" | "DELETE" | "UPLOAD";
  relatedType: string;
  relatedId: number;
  operatorId: number;
  content: string;
};

export async function writeAuditLog(payload: AuditPayload) {
  await prisma.operationLog.create({
    data: payload
  });
}

