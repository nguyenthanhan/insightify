import { lazy } from "react";

// Eager exports for lightweight components
export {
  ChartTooltip,
  SimpleTooltip,
  type ChartTooltipProps,
  type TooltipData,
} from "./ChartTooltip";
export {
  ChartLegend,
  CompactLegend,
  type ChartLegendProps,
  type LegendItem,
} from "./ChartLegend";

// Chart Widget Components - Eager export for main wrapper
export { ChartWidget, type ChartWidgetProps } from "./ChartWidget";

// Lazy-loaded chart components (heavy recharts dependencies)
export const LineChartWidget = lazy(() =>
  import("./LineChartWidget").then((m) => ({ default: m.LineChartWidget })),
);
export const BarChartWidget = lazy(() =>
  import("./BarChartWidget").then((m) => ({ default: m.BarChartWidget })),
);
export const AreaChartWidget = lazy(() =>
  import("./AreaChartWidget").then((m) => ({ default: m.AreaChartWidget })),
);
export const PieChartWidget = lazy(() =>
  import("./PieChartWidget").then((m) => ({ default: m.PieChartWidget })),
);
export const RadarChartWidget = lazy(() =>
  import("./RadarChartWidget").then((m) => ({ default: m.RadarChartWidget })),
);

// Type exports
export type { LineChartWidgetProps } from "./LineChartWidget";
export type { BarChartWidgetProps } from "./BarChartWidget";
export type { AreaChartWidgetProps } from "./AreaChartWidget";
export type { PieChartWidgetProps } from "./PieChartWidget";
export type { RadarChartWidgetProps } from "./RadarChartWidget";
