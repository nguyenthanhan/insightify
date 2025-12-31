import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  CHART_GRADIENTS,
  getGradientColors,
  getGradientId,
  getCssGradient,
  getChartColorPalette,
  GradientName,
} from "./gradients";

/**
 * **Feature: premium-dashboard-ui, Property 3: Chart Gradient Theme Matching**
 * **Validates: Requirements 6.1**
 */
describe("Property: Chart Gradient Theme Matching", () => {
  const gradientNames: GradientName[] = [
    "primary",
    "secondary",
    "accent",
    "success",
    "warning",
    "error",
  ];

  it("should return valid hex colors for any gradient", () => {
    fc.assert(
      fc.property(fc.constantFrom(...gradientNames), (gradientName) => {
        const colors = getGradientColors(gradientName);

        // Should return exactly 2 colors
        expect(colors).toHaveLength(2);

        // Both should be valid hex colors
        const hexRegex = /^#[0-9a-fA-F]{6}$/;
        expect(colors[0]).toMatch(hexRegex);
        expect(colors[1]).toMatch(hexRegex);
      }),
      { numRuns: 100 }
    );
  });

  it("should return unique gradient IDs", () => {
    const ids = gradientNames.map((name) => getGradientId(name));
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should generate valid CSS gradient strings", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...gradientNames),
        fc.integer({ min: 0, max: 360 }),
        (gradientName, angle) => {
          const cssGradient = getCssGradient(gradientName, angle);

          // Should contain linear-gradient
          expect(cssGradient).toContain("linear-gradient");

          // Should contain the angle
          expect(cssGradient).toContain(`${angle}deg`);

          // Should contain both colors
          const colors = getGradientColors(gradientName);
          expect(cssGradient).toContain(colors[0]);
          expect(cssGradient).toContain(colors[1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return correct number of colors in palette", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        const palette = getChartColorPalette(count);
        expect(palette).toHaveLength(count);
      }),
      { numRuns: 100 }
    );
  });

  it("should return valid hex colors in palette", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        const palette = getChartColorPalette(count);
        const hexRegex = /^#[0-9a-fA-F]{6}$/;

        palette.forEach((color) => {
          expect(color).toMatch(hexRegex);
        });
      }),
      { numRuns: 100 }
    );
  });

  it("should have all gradients defined with required properties", () => {
    for (const name of gradientNames) {
      const gradient = CHART_GRADIENTS[name];

      expect(gradient).toBeDefined();
      expect(gradient.id).toBeDefined();
      expect(typeof gradient.id).toBe("string");
      expect(gradient.colors).toBeDefined();
      expect(gradient.colors).toHaveLength(2);
      expect(gradient.direction).toBeDefined();
    }
  });
});
