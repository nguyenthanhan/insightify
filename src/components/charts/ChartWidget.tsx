import { memo, useMemo } from "react";
import { ChartConfig, CHART_COLORS } from "@/lib/config/dashboards/types";
import { LineChartWidget } from "./LineChartWidget";
import { BarChartWidget } from "./BarChartWidget";
import { AreaChartWidget } from "./AreaChartWidget";
import { PieChartWidget } from "./PieChartWidget";
import { RadarChartWidget } from "./RadarChartWidget";

export interface ChartWidgetProps {
  config: ChartConfig;
  height?: number;
  className?: string;
}

/**
 * Generic chart wrapper that renders the appropriate chart type
 * based on the configuration
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
});

export default ChartWidget;
