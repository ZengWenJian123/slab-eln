import { z } from "zod";

export const sampleSchema = z.object({
  alloyDesignId: z.number().int().positive(),
  arcBatchId: z.number().int().positive(),
  spinningBatchId: z.number().int().positive(),
  state: z.enum(["GC", "GR"]),
  bareWireDiameterUm: z.number().positive(),
  coatedWireDiameterUm: z.number().positive(),
  isWelded2cm: z.boolean().default(false),
  sampleIndex: z.number().int().positive(),
  treatmentCode: z.string().min(1).default("AS"),
  remark: z.string().max(1000).nullable().optional()
});

