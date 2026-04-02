import { z } from "zod";
import { withFailureReason } from "@/lib/validators/common";

export const spinningBatchSchema = withFailureReason({
  alloyDesignId: z.number().int().positive(),
  arcBatchId: z.number().int().positive(),
  spinningDate: z.string().datetime(),
  glassTubeDiameter: z.number().positive(),
  feedWeight: z.number().positive(),
  spinningTemperature: z.number(),
  windingSpeedRpm: z.number().positive(),
  coolingWaterTemp: z.number(),
  negativePressureKpa: z.number(),
  coatedWireDiameterUm: z.number().positive(),
  bareWireDiameterUm: z.number().positive(),
  glassEtchTime: z.number().nonnegative(),
  needMagneticTest: z.boolean().default(false),
  remark: z.string().max(1000).nullable().optional()
});

