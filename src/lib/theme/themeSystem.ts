import { ThemeConfig } from "./types";
import { THEME_PRESETS, getThemeById, defaultLightTheme } from "./presets";
import {
  getContrastRatio,
  meetsContrastAA,
  generatePaletteFromAccent,
  isValidHex,
} from "./colorUtils";

export interface ContrastResult {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  meetsAALarge: boolean;
  meetsAAALarge: boolean;
}

export class ThemeSystem {
  private currentTheme: ThemeConfig;
  private listeners: Set<(theme: ThemeConfig) => void> = new Set();

  constructor(initialThemeId?: string) {
    this.currentTheme = initialThemeId
      ? getThemeById(initialThemeId)
      : defaultLightTheme;
  }

  getCurrentTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  setTheme(themeOrId: ThemeConfig | string): void {
    if (typeof themeOrId === "string") {
      this.currentTheme = getThemeById(themeOrId);
    } else {
      this.currentTheme = themeOrId;
    }
    this.notifyListeners();
    this.applyThemeToDOM();
  }

  getPresetThemes(): ThemeConfig[] {
    return [...THEME_PRESETS];
  }

  validateContrast(foreground: string, background: string): ContrastResult {
    const ratio = getContrastRatio(foreground, background);
    return {
      ratio,
      meetsAA: ratio >= 4.5,
      meetsAAA: ratio >= 7,
      meetsAALarge: ratio >= 3,
      meetsAAALarge: ratio >= 4.5,
    };
  }

  validateThemeContrast(theme: ThemeConfig): {
    valid: boolean;
    issues: Array<{ pair: string; ratio: number; required: number }>;
  } {
    const issues: Array<{ pair: string; ratio: number; required: number }> = [];

    // Check text on background
    const textOnBg = this.validateContrast(
      theme.colors.text,
      theme.colors.background
    );
    if (!textOnBg.meetsAA) {
      issues.push({
        pair: "text/background",
        ratio: textOnBg.ratio,
        required: 4.5,
      });
    }

    // Check text on surface
    const textOnSurface = this.validateContrast(
      theme.colors.text,
      theme.colors.surface
    );
    if (!textOnSurface.meetsAA) {
      issues.push({
        pair: "text/surface",
        ratio: textOnSurface.ratio,
        required: 4.5,
      });
    }

    // Check muted text on background
    const mutedOnBg = this.validateContrast(
      theme.colors.textMuted,
      theme.colors.background
    );
    if (!mutedOnBg.meetsAA) {
      issues.push({
        pair: "textMuted/background",
        ratio: mutedOnBg.ratio,
        required: 4.5,
      });
    }

    // Check inverse text on primary
    const inverseOnPrimary = this.validateContrast(
      theme.colors.textInverse,
      theme.colors.primary
    );
    if (!inverseOnPrimary.meetsAA) {
      issues.push({
        pair: "textInverse/primary",
        ratio: inverseOnPrimary.ratio,
        required: 4.5,
      });
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  createCustomTheme(
    name: string,
    accentColor: string,
    mode: "light" | "dark"
  ): ThemeConfig {
    if (!isValidHex(accentColor)) {
      throw new Error("Invalid accent color hex value");
    }

    const baseTheme =
      mode === "dark"
        ? getThemeById("default-dark")
        : getThemeById("default-light");

    const palette = generatePaletteFromAccent(accentColor);

    return {
      ...baseTheme,
      id: `custom-${Date.now()}`,
      name,
      colors: {
        ...baseTheme.colors,
        primary: palette.primary,
        primaryLight: palette.primaryLight,
        primaryDark: palette.primaryDark,
        secondary: palette.secondary,
        secondaryLight: palette.secondaryLight,
        secondaryDark: palette.secondaryDark,
        accent: palette.accent,
        accentLight: palette.accentLight,
        accentDark: palette.accentDark,
      },
    };
  }

  subscribe(listener: (theme: ThemeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const theme = this.getCurrentTheme();
    this.listeners.forEach((listener) => listener(theme));
  }

  private applyThemeToDOM(): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const theme = this.currentTheme;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply mode class
    if (theme.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  // Serialization
  serialize(): string {
    return JSON.stringify({
      themeId: this.currentTheme.id,
      customTheme: this.currentTheme.id.startsWith("custom-")
        ? this.currentTheme
        : null,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    if (parsed.customTheme) {
      this.setTheme(parsed.customTheme);
    } else {
      this.setTheme(parsed.themeId);
    }
  }
}

// Singleton instance
let themeSystemInstance: ThemeSystem | null = null;

export function getThemeSystem(): ThemeSystem {
  if (!themeSystemInstance) {
    themeSystemInstance = new ThemeSystem();
  }
  return themeSystemInstance;
}
