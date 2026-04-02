import { describe, expect, it } from "vitest";
import { alloySchema } from "@/lib/validators/alloy";
import { arcBatchSchema } from "@/lib/validators/arc-batch";

describe("validators", () => {
  it("rejects alloy composition sum not 100", () => {
    const parsed = alloySchema.safeParse({
      composition: [
        { element: "Co", percent: 40 },
        { element: "Fe", percent: 30 }
      ]
    });
    expect(parsed.success).toBe(false);
  });

  it("requires failure reason when status failed", () => {
    const parsed = arcBatchSchema.safeParse({
      alloyDesignId: 1,
      meltingDate: new Date().toISOString(),
      targetWeight: 10,
      ingotWeight: 9,
      status: "FAILED"
    });
    expect(parsed.success).toBe(false);
  });
});

