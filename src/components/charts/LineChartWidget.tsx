import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/config/dashboards/types";

export interface LineChartWidgetProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xAxisKey: string;
  secondaryDataKey?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  strokeWidth?: number;
  colors?: string[];
  className?: string;
}

/**
 * Reusable Line Chart Widget
 */
export function LineChartWidget({
  data,
  dataKey,
  xAxisKey,
  secondaryDataKey,
  height = 300,
  showLegend = true,
  showGrid = true,
  strokeWidth = 2,
  colors = CHART_COLORS,
  className,
}: LineChartWidgetProps) {
  return (
    <div style={{ width: "100%", height }} className={className}>
      <ResponsiveContainer>
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={strokeWidth}
          />
          {secondaryDataKey && (
            <Line
              type="monotone"
              dataKey={secondaryDataKey}
              stroke={colors[1] || "#94a3b8"}
              strokeWidth={strokeWidth}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChartWidget;
