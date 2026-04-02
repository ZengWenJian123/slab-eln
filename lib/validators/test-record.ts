import { z } from "zod";
import { withFailureReason } from "@/lib/validators/common";

export const testRecordSchema = withFailureReason({
  sampleId: z.number().int().positive(),
  testDate: z.string().datetime(),
  operatorName: z.string().min(1),
  instrumentName: z.string().min(1),
  testCondition: z.string().min(1),
  keyResults: z.string().min(1),
  rawFileAttachmentId: z.number().int().positive().nullable().optional(),
  remark: z.string().max(1000).nullable().optional()
});

