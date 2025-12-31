import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/config/dashboards/types";

export interface RadarChartWidgetProps {
  data: Record<string, unknown>[];
  dataKey: string;
  labelKey: string;
  height?: number;
  domain?: [number, number];
  fillOpacity?: number;
  colors?: string[];
  className?: string;
}

/**
 * Reusable Radar Chart Widget
 */
export function RadarChartWidget({
  data,
  dataKey,
  labelKey,
  height = 280,
  domain = [0, 5],
  fillOpacity = 0.6,
  colors = CHART_COLORS,
  className,
}: RadarChartWidgetProps) {
  return (
    <div style={{ width: "100%", height }} className={className}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey={labelKey} />
          <PolarRadiusAxis angle={90} domain={domain} />
          <Radar
            name="Score"
            dataKey={dataKey}
            stroke={colors[4] || "#6366f1"}
            fill={colors[4] || "#6366f1"}
            fillOpacity={fillOpacity}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RadarChartWidget;
