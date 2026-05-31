import { memo, useMemo, Suspense, lazy } from "react";
import { ChartConfig, CHART_COLORS } from "@/lib/config/dashboards/types";

// Lazy load chart components
const LineChartWidget = lazy(() =>
  import("./LineChartWidget").then((m) => ({ default: m.LineChartWidget })),
);
const BarChartWidget = lazy(() =>
  import("./BarChartWidget").then((m) => ({ default: m.BarChartWidget })),
);
const AreaChartWidget = lazy(() =>
  import("./AreaChartWidget").then((m) => ({ default: m.AreaChartWidget })),
);
const PieChartWidget = lazy(() =>
  import("./PieChartWidget").then((m) => ({ default: m.PieChartWidget })),
);
const RadarChartWidget = lazy(() =>
  import("./RadarChartWidget").then((m) => ({ default: m.RadarChartWidget })),
);

export interface ChartWidgetProps {
  config: ChartConfig;
  height?: number;
  className?: string;
}

/**
 * Loading fallback for chart components
 */
function ChartLoadingFallback({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg"
      style={{ height }}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading chart...
      </div>
    </div>
  );
}

/**
 * Generic chart wrapper that renders the appropriate chart type
 * based on the configuration with lazy loading support
 */
export const ChartWidget = memo(function ChartWidget({
  config,
  height = 300,
  className,
}: ChartWidgetProps) {
  const colors = useMemo(
    () => config.config?.colors || CHART_COLORS,
    [config.config?.colors],
  );

  const renderChart = () => {
    switch (config.type) {
      case "line":
        return (
          <LineChartWidget
            data={config.data}
            dataKey={config.dataKey}
            xAxisKey={config.config?.xAxisKey || "name"}
            secondaryDataKey={config.config?.secondaryYAxisKey}
            height={height}
            showLegend={config.config?.showLegend}
            showGrid={config.config?.showGrid}
            colors={colors}
            className={className}
          />
        );
      case "bar":
        return (
          <BarChartWidget
            data={config.data}
            dataKey={config.dataKey}
            xAxisKey={config.config?.xAxisKey || "name"}
            secondaryDataKey={config.config?.secondaryYAxisKey}
            layout={config.config?.layout}
            height={height}
            showLegend={config.config?.showLegend}
            showGrid={config.config?.showGrid}
            colors={colors}
            className={className}
          />
        );
      case "area":
        return (
          <AreaChartWidget
            data={config.data}
            dataKey={config.dataKey}
            xAxisKey={config.config?.xAxisKey || "name"}
            secondaryDataKey={config.config?.secondaryYAxisKey}
            height={height}
            showLegend={config.config?.showLegend}
            showGrid={config.config?.showGrid}
            fillOpacity={config.config?.fillOpacity}
            colors={colors}
            className={className}
          />
        );
      case "pie":
        return (
          <PieChartWidget
            data={config.data}
            dataKey={config.dataKey}
            labelKey={config.config?.labelKey || "name"}
            height={height}
            colors={colors}
            className={className}
          />
        );
      case "radar":
        return (
          <RadarChartWidget
            data={config.data}
            dataKey={config.dataKey}
            labelKey={config.config?.labelKey || "category"}
            height={height}
            colors={colors}
            className={className}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Unsupported chart type
          </div>
        );
    }
  };

  return (
    <Suspense fallback={<ChartLoadingFallback height={height} />}>
      {renderChart()}
    </Suspense>
  );
});

export default ChartWidget;
