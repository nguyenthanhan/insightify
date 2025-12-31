import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/config/dashboards/types";

export interface PieChartWidgetProps {
  data: Record<string, unknown>[];
  dataKey: string;
  labelKey: string;
  height?: number;
  outerRadius?: number;
  showLabel?: boolean;
  colors?: string[];
  className?: string;
}

/**
 * Reusable Pie Chart Widget
 */
export function PieChartWidget({
  data,
  dataKey,
  labelKey,
  height = 300,
  outerRadius = 100,
  showLabel = true,
  colors = CHART_COLORS,
  className,
}: PieChartWidgetProps) {
  const renderLabel = showLabel
    ? ({ name, percent }: { name: string; percent: number }) =>
        `${name}: ${(percent * 100).toFixed(0)}%`
    : undefined;

  return (
    <div style={{ width: "100%", height }} className={className}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={labelKey}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PieChartWidget;
