import { z } from "zod";
import { withFailureReason } from "@/lib/validators/common";

export const postTreatmentSchema = withFailureReason({
  sampleId: z.number().int().positive(),
  treatmentType: z.string().min(1),
  treatmentParams: z.record(z.string(), z.any()),
  treatedAt: z.string().datetime(),
  remark: z.string().max(1000).nullable().optional()
});
