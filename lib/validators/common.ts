import { z } from "zod";

export const statusSchema = z.enum(["SUCCESS", "FAILED"]);

export function withFailureReason<T extends z.ZodRawShape>(shape: T) {
  return z
    .object({
      ...shape,
      status: statusSchema,
      failureReasonId: z.number().int().positive().nullable().optional()
    })
    .superRefine((value: any, ctx) => {
      if (value.status === "FAILED" && !value.failureReasonId) {
        ctx.addIssue({
          code: "custom",
          message: "失败状态必须填写失败原因",
          path: ["failureReasonId"]
        });
      }
    });
}

export const listQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10)
});
