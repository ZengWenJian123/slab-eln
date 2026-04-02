import { describe, expect, it } from "vitest";
import { buildDisplayName } from "@/lib/services/naming";

describe("display name", () => {
  it("builds expected format", () => {
    const displayName = buildDisplayName({
      alloyCode: "H8",
      arcBatchNo: "M0325",
      spinBatchNo: "L0330",
      state: "GR",
      bareWireDiameterUm: 32,
      treatmentCode: "DC20",
      sampleIndex: 1
    });
    expect(displayName).toBe("H8-M0325-L0330-GR32-DC20-1");
  });
});

