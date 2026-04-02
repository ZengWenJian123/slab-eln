import { z } from "zod";

export const dictionarySchema = z.object({
  dictType: z.string().min(1),
  dictLabel: z.string().min(1),
  dictValue: z.string().min(1),
  sortOrder: z.number().int().default(0),
  status: z.boolean().default(true)
});

