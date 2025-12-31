/**
 * Theme-aware chart gradient configurations
 * Requirements: 6.1
 */

export interface ChartGradient {
  id: string;
  colors: [string, string];
  direction?: "vertical" | "horizontal";
}

// Gradient definitions matching theme palette
export const CHART_GRADIENTS = {
  primary: {
    id: "gradient-primary",
    colors: ["#3b82f6", "#8b5cf6"] as [string, string],
    direction: "vertical" as const,
  },
  secondary: {
    id: "gradient-secondary",
    colors: ["#8b5cf6", "#ec4899"] as [string, string],
    direction: "vertical" as const,
  },
  accent: {
    id: "gradient-accent",
    colors: ["#06b6d4", "#3b82f6"] as [string, string],
    direction: "vertical" as const,
  },
  success: {
    id: "gradient-success",
    colors: ["#10b981", "#06b6d4"] as [string, string],
    direction: "vertical" as const,
  },
  warning: {
    id: "gradient-warning",
    colors: ["#f59e0b", "#ef4444"] as [string, string],
    direction: "vertical" as const,
  },
  error: {
    id: "gradient-error",
    colors: ["#ef4444", "#ec4899"] as [string, string],
    direction: "vertical" as const,
  },
};

export type GradientName = keyof typeof CHART_GRADIENTS;

/**
 * Get gradient colors for a given gradient name
 */
export function getGradientColors(name: GradientName): [string, string] {
  return CHART_GRADIENTS[name].colors;
}

/**
 * Get gradient ID for SVG defs
 */
export function getGradientId(name: GradientName): string {
  return CHART_GRADIENTS[name].id;
}

/**
 * Generate SVG gradient definition
 */
export function createSvgGradient(name: GradientName): string {
  const gradient = CHART_GRADIENTS[name];
  const isVertical = gradient.direction === "vertical";

  return `
    <linearGradient id="${gradient.id}" x1="0%" y1="${
    isVertical ? "0%" : "0%"
  }" x2="${isVertical ? "0%" : "100%"}" y2="${isVertical ? "100%" : "0%"}">
      <stop offset="0%" stop-color="${gradient.colors[0]}" />
      <stop offset="100%" stop-color="${gradient.colors[1]}" />
    </linearGradient>
  `;
}

/**
 * Generate all SVG gradient definitions
 */
export function createAllSvgGradients(): string {
  return Object.keys(CHART_GRADIENTS)
    .map((name) => createSvgGradient(name as GradientName))
    .join("\n");
}

/**
 * Get CSS gradient string
 */
export function getCssGradient(name: GradientName, angle = 180): string {
  const [color1, color2] = CHART_GRADIENTS[name].colors;
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Validate that gradient colors match theme palette
 */
export function validateGradientColors(
  gradientName: GradientName,
  themeColors: { primary: string; secondary: string; accent: string }
): boolean {
  const gradient = CHART_GRADIENTS[gradientName];

  // Check if at least one color matches theme
  const themeColorValues = Object.values(themeColors);
  return gradient.colors.some((color) =>
    themeColorValues.some(
      (themeColor) => color.toLowerCase() === themeColor.toLowerCase()
    )
  );
}

/**
 * Get chart color palette for multiple series
 */
export function getChartColorPalette(count: number): string[] {
  const baseColors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#ec4899", // pink
    "#6366f1", // indigo
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
}
