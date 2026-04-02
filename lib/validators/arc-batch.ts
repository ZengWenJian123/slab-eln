import { z } from "zod";
import { withFailureReason } from "@/lib/validators/common";

export const arcBatchSchema = withFailureReason({
  alloyDesignId: z.number().int().positive(),
  meltingDate: z.string().datetime(),
  targetWeight: z.number().positive(),
  ingotWeight: z.number().nonnegative(),
  meltingPoint: z.number().positive().nullable().optional(),
  remark: z.string().max(1000).nullable().optional()
});

