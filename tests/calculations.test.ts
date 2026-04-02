import { describe, expect, it } from "vitest";
import {
  calculateCurrentMa,
  calculateGlassThickness,
  calculateLossRate,
  calculateTensileForceMpa
} from "@/lib/services/calculations";

describe("calculations", () => {
  it("calculates loss rate", () => {
    expect(calculateLossRate(10, 9.5)).toBeCloseTo(5);
  });

  it("calculates glass thickness", () => {
    expect(calculateGlassThickness(40, 32)).toBeCloseTo(4);
  });

  it("calculates current mA", () => {
    const result = calculateCurrentMa(12.5, 0.032);
    expect(result).toBeGreaterThan(0);
  });

  it("calculates tensile force", () => {
    const result = calculateTensileForceMpa(10, 0.032);
    expect(result).toBeGreaterThan(0);
  });
});

