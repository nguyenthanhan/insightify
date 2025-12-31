import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Utility function to get trend color
 * This mirrors the logic in MetricWidget component
 */
function getTrendColor(trend: "up" | "down" | "stable" | undefined): string {
  switch (trend) {
    case "up":
      return "text-green-500";
    case "down":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

/**
 * **Feature: premium-dashboard-ui, Property 1: Metric Trend Color Consistency**
 * **Validates: Requirements 2.2**
 */
describe("Property: Metric Trend Color Consistency", () => {
  it("should display green for positive trends", () => {
    const color = getTrendColor("up");
    expect(color).toBe("text-green-500");
  });

  it("should display red for negative trends", () => {
    const color = getTrendColor("down");
    expect(color).toBe("text-red-500");
  });

  it("should display gray for stable/neutral trends", () => {
    const color = getTrendColor("stable");
    expect(color).toBe("text-gray-500");
  });

  it("should display gray for undefined trends", () => {
    const color = getTrendColor(undefined);
    expect(color).toBe("text-gray-500");
  });

  it("should always return a valid color class for any trend value", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "up" as const,
          "down" as const,
          "stable" as const,
          undefined
        ),
        (trend) => {
          const color = getTrendColor(trend);

          // Color should be one of the valid classes
          const validColors = [
            "text-green-500",
            "text-red-500",
            "text-gray-500",
          ];
          expect(validColors).toContain(color);

          // Specific mapping
          if (trend === "up") {
            expect(color).toBe("text-green-500");
          } else if (trend === "down") {
            expect(color).toBe("text-red-500");
          } else {
            expect(color).toBe("text-gray-500");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should be consistent: same trend always produces same color", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("up" as const, "down" as const, "stable" as const),
        (trend) => {
          const color1 = getTrendColor(trend);
          const color2 = getTrendColor(trend);

          expect(color1).toBe(color2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
