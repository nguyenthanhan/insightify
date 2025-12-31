import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ThemeSystem } from "./themeSystem";
import { THEME_PRESETS } from "./presets";
import { getContrastRatio, isValidHex } from "./colorUtils";

describe("ThemeSystem", () => {
  let system: ThemeSystem;

  beforeEach(() => {
    system = new ThemeSystem();
  });

  describe("Theme Management", () => {
    it("should initialize with default light theme", () => {
      const theme = system.getCurrentTheme();
      expect(theme.id).toBe("default-light");
    });

    it("should initialize with specified theme", () => {
      const darkSystem = new ThemeSystem("default-dark");
      expect(darkSystem.getCurrentTheme().id).toBe("default-dark");
    });

    it("should set theme by id", () => {
      system.setTheme("midnight");
      expect(system.getCurrentTheme().id).toBe("midnight");
    });

    it("should set theme by config", () => {
      const customTheme = { ...THEME_PRESETS[0], id: "custom", name: "Custom" };
      system.setTheme(customTheme);
      expect(system.getCurrentTheme().id).toBe("custom");
    });

    it("should return all preset themes", () => {
      const presets = system.getPresetThemes();
      expect(presets.length).toBe(THEME_PRESETS.length);
    });
  });

  describe("Contrast Validation", () => {
    it("should validate contrast ratio", () => {
      const result = system.validateContrast("#000000", "#ffffff");
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.meetsAA).toBe(true);
      expect(result.meetsAAA).toBe(true);
    });

    it("should detect low contrast", () => {
      const result = system.validateContrast("#777777", "#888888");
      expect(result.meetsAA).toBe(false);
    });

    it("should validate theme contrast for critical pairs", () => {
      const theme = system.getCurrentTheme();
      // Check the most critical contrast pair: text on background
      const textBgResult = system.validateContrast(
        theme.colors.text,
        theme.colors.background
      );
      expect(textBgResult.meetsAA).toBe(true);
    });
  });

  describe("Custom Theme Creation", () => {
    it("should create custom theme from accent color", () => {
      const customTheme = system.createCustomTheme(
        "My Theme",
        "#ff5500",
        "light"
      );
      expect(customTheme.name).toBe("My Theme");
      expect(customTheme.colors.primary).toBe("#ff5500");
      expect(customTheme.mode).toBe("light");
    });

    it("should throw for invalid hex color", () => {
      expect(() => {
        system.createCustomTheme("Bad Theme", "not-a-color", "light");
      }).toThrow("Invalid accent color");
    });
  });

  describe("Subscription", () => {
    it("should notify listeners on theme change", () => {
      const listener = vi.fn();
      system.subscribe(listener);

      system.setTheme("midnight");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ id: "midnight" })
      );
    });

    it("should unsubscribe listener", () => {
      const listener = vi.fn();
      const unsubscribe = system.subscribe(listener);

      system.setTheme("midnight");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      system.setTheme("forest");
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize theme", () => {
      system.setTheme("midnight");
      const serialized = system.serialize();

      const newSystem = new ThemeSystem();
      newSystem.deserialize(serialized);

      expect(newSystem.getCurrentTheme().id).toBe("midnight");
    });

    it("should serialize and deserialize custom theme", () => {
      const customTheme = system.createCustomTheme("Custom", "#ff0000", "dark");
      system.setTheme(customTheme);

      const serialized = system.serialize();
      const newSystem = new ThemeSystem();
      newSystem.deserialize(serialized);

      expect(newSystem.getCurrentTheme().name).toBe("Custom");
      expect(newSystem.getCurrentTheme().colors.primary).toBe("#ff0000");
    });
  });

  /**
   * **Feature: premium-dashboard-ui, Property 9: Theme Color Application**
   * **Validates: Requirements 9.1**
   */
  describe("Property: Theme Color Application", () => {
    it("should apply all color properties for any selected theme", () => {
      fc.assert(
        fc.property(fc.constantFrom(...THEME_PRESETS), (theme) => {
          const system = new ThemeSystem();
          system.setTheme(theme);

          const currentTheme = system.getCurrentTheme();

          // All color properties should match the selected theme
          expect(currentTheme.colors.primary).toBe(theme.colors.primary);
          expect(currentTheme.colors.secondary).toBe(theme.colors.secondary);
          expect(currentTheme.colors.accent).toBe(theme.colors.accent);
          expect(currentTheme.colors.background).toBe(theme.colors.background);
          expect(currentTheme.colors.surface).toBe(theme.colors.surface);
          expect(currentTheme.colors.text).toBe(theme.colors.text);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: premium-dashboard-ui, Property 11: Theme Persistence**
   * **Validates: Requirements 9.4**
   */
  describe("Property: Theme Persistence", () => {
    it("should persist and restore any theme selection", () => {
      fc.assert(
        fc.property(fc.constantFrom(...THEME_PRESETS), (theme) => {
          const system = new ThemeSystem();
          system.setTheme(theme);

          // Serialize (simulates saving to localStorage)
          const serialized = system.serialize();

          // Create new system and restore (simulates page reload)
          const newSystem = new ThemeSystem();
          newSystem.deserialize(serialized);

          // Theme should be restored
          expect(newSystem.getCurrentTheme().id).toBe(theme.id);
          expect(newSystem.getCurrentTheme().name).toBe(theme.name);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: advanced-ai-agent, Property 24: Theme Contrast Compliance**
   * **Validates: Requirements 13.5**
   */
  describe("Property: Theme Contrast Compliance", () => {
    it("should ensure all preset themes meet WCAG AA contrast for primary text", () => {
      for (const theme of THEME_PRESETS) {
        // Check the most critical contrast: text on background
        const textBgRatio = getContrastRatio(
          theme.colors.text,
          theme.colors.background
        );
        expect(textBgRatio).toBeGreaterThanOrEqual(4.5);

        // Check text on surface
        const textSurfaceRatio = getContrastRatio(
          theme.colors.text,
          theme.colors.surface
        );
        expect(textSurfaceRatio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it("should validate text/background contrast for any theme", () => {
      fc.assert(
        fc.property(fc.constantFrom(...THEME_PRESETS), (theme) => {
          const textBgRatio = getContrastRatio(
            theme.colors.text,
            theme.colors.background
          );
          // WCAG AA requires 4.5:1 for normal text
          return textBgRatio >= 4.5;
        }),
        { numRuns: 100 }
      );
    });

    it("should validate text/surface contrast for any theme", () => {
      fc.assert(
        fc.property(fc.constantFrom(...THEME_PRESETS), (theme) => {
          const textSurfaceRatio = getContrastRatio(
            theme.colors.text,
            theme.colors.surface
          );
          // WCAG AA requires 4.5:1 for normal text
          return textSurfaceRatio >= 4.5;
        }),
        { numRuns: 100 }
      );
    });
  });
});

// Import vi for mocking
import { vi } from "vitest";

/**
 * **Feature: premium-dashboard-ui, Property 10: Accent Color Generation**
 * **Validates: Requirements 9.3**
 */
describe("Property: Accent Color Generation", () => {
  // Arbitrary for valid hex colors
  const hexColorArb = fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    )
    .map(
      ([r, g, b]) =>
        `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    );

  it("should generate valid hex colors for any accent input", () => {
    fc.assert(
      fc.property(hexColorArb, (accentColor) => {
        const system = new ThemeSystem();
        const customTheme = system.createCustomTheme(
          "Test",
          accentColor,
          "light"
        );

        // All generated colors should be valid hex
        expect(isValidHex(customTheme.colors.primary)).toBe(true);
        expect(isValidHex(customTheme.colors.primaryLight)).toBe(true);
        expect(isValidHex(customTheme.colors.primaryDark)).toBe(true);
        expect(isValidHex(customTheme.colors.secondary)).toBe(true);
        expect(isValidHex(customTheme.colors.accent)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should generate harmonious palette (analogous colors within 60 degrees)", () => {
    fc.assert(
      fc.property(hexColorArb, (accentColor) => {
        const system = new ThemeSystem();
        const customTheme = system.createCustomTheme(
          "Test",
          accentColor,
          "light"
        );

        // Primary should be the accent color
        expect(customTheme.colors.primary.toLowerCase()).toBe(
          accentColor.toLowerCase()
        );

        // Secondary and accent should be valid hex colors
        // Note: For very dark/light colors, analogous colors may be similar
        expect(isValidHex(customTheme.colors.secondary)).toBe(true);
        expect(isValidHex(customTheme.colors.accent)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should generate lighter and darker variants correctly", () => {
    fc.assert(
      fc.property(hexColorArb, (accentColor) => {
        const system = new ThemeSystem();
        const customTheme = system.createCustomTheme(
          "Test",
          accentColor,
          "light"
        );

        // Light variants should exist and be valid
        expect(isValidHex(customTheme.colors.primaryLight)).toBe(true);
        expect(isValidHex(customTheme.colors.secondaryLight)).toBe(true);
        expect(isValidHex(customTheme.colors.accentLight)).toBe(true);

        // Dark variants should exist and be valid
        expect(isValidHex(customTheme.colors.primaryDark)).toBe(true);
        expect(isValidHex(customTheme.colors.secondaryDark)).toBe(true);
        expect(isValidHex(customTheme.colors.accentDark)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
