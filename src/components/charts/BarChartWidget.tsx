import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { CHART_COLORS } from "@/lib/config/dashboards/types";
import {
  downsampleData,
  shouldDownsample,
  getOptimalPointCount,
} from "@/lib/utils/chartOptimization";

export interface BarChartWidgetProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  secondaryDataKey?: string;
  layout?: "horizontal" | "vertical";
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  className?: string;
}

/**
 * Reusable Bar Chart Widget
 */
export function BarChartWidget({
  data,
  dataKey,
  xAxisKey,
  secondaryDataKey,
  layout = "horizontal",
  height = 300,
  showLegend = false,
  showGrid = true,
  colors = CHART_COLORS,
  className,
}: BarChartWidgetProps) {
  // Optimize data for performance
  const optimizedData = useMemo(() => {
    const threshold = getOptimalPointCount("bar");
    return shouldDownsample(data.length, threshold)
      ? downsampleData(data, threshold)
      : data;
  }, [data]);

  return (
    <div style={{ width: "100%", height }} className={className}>
      <ResponsiveContainer>
        <BarChart data={optimizedData} layout={layout}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {layout === "vertical" ? (
            <>
              <XAxis type="number" />
              <YAxis dataKey={xAxisKey} type="category" width={100} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} />
              <YAxis />
            </>
          )}
          <Tooltip />
          {showLegend && <Legend />}
          <Bar dataKey={dataKey} fill={colors[0]} />
          {secondaryDataKey && (
            <Bar dataKey={secondaryDataKey} fill={colors[1] || "#10b981"} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChartWidget;
