import {
  AreaChart,
  Area,
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
  downsampleLTTB,
  shouldDownsample,
  getOptimalPointCount,
} from "@/lib/utils/chartOptimization";

export interface AreaChartWidgetProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  secondaryDataKey?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  fillOpacity?: number;
  colors?: string[];
  className?: string;
}

/**
 * Reusable Area Chart Widget
 */
export function AreaChartWidget({
  data,
  dataKey,
  xAxisKey,
  secondaryDataKey,
  height = 300,
  showLegend = true,
  showGrid = true,
  fillOpacity = 0.6,
  colors = CHART_COLORS,
  className,
}: AreaChartWidgetProps) {
  // Optimize data for performance using LTTB algorithm
  const optimizedData = useMemo(() => {
    const threshold = getOptimalPointCount("area");
    if (!shouldDownsample(data.length, threshold)) {
      return data;
    }
    // Use LTTB for better visual preservation
    return downsampleLTTB(data, xAxisKey, dataKey, threshold);
  }, [data, xAxisKey, dataKey]);

  return (
    <div style={{ width: "100%", height }} className={className}>
      <ResponsiveContainer>
        <AreaChart data={optimizedData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={fillOpacity}
          />
          {secondaryDataKey && (
            <Area
              type="monotone"
              dataKey={secondaryDataKey}
              stroke={colors[1]}
              fill={colors[1]}
              fillOpacity={fillOpacity * 0.7}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AreaChartWidget;
