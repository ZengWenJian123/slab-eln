import { z } from "zod";

export const compositionItemSchema = z.object({
  element: z.string().min(1),
  percent: z.number().min(0).max(100)
});

export const alloySchema = z
  .object({
    code: z.string().min(1).optional(),
    composition: z.array(compositionItemSchema).min(1),
    remark: z.string().max(1000).optional().nullable()
  })
  .superRefine((value, ctx) => {
    const sum = value.composition.reduce((acc, item) => acc + item.percent, 0);
    if (Math.abs(sum - 100) > 1e-4) {
      ctx.addIssue({
        code: "custom",
        message: `原子分数总和必须为100%，当前为${sum.toFixed(4)}%`,
        path: ["composition"]
      });
    }
  });

