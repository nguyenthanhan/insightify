import { useState, useEffect } from "react";

interface FunnelStage {
  name: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  data: FunnelStage[];
  title?: string;
  showPercentages?: boolean;
  showValues?: boolean;
  animate?: boolean;
  height?: number;
}

export function FunnelChart({
  data,
  title,
  showPercentages = true,
  showValues = true,
  animate = true,
  height = 300,
}: FunnelChartProps) {
  const [animatedData, setAnimatedData] = useState<FunnelStage[]>(
    animate ? data.map((d) => ({ ...d, value: 0 })) : data
  );

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedData(data);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data, animate]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const defaultColors = [
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
  ];

  const getConversionRate = (index: number): number => {
    if (index === 0) return 100;
    return (data[index].value / data[0].value) * 100;
  };

  const getStageDropoff = (index: number): number => {
    if (index === 0) return 0;
    return (
      ((data[index - 1].value - data[index].value) / data[index - 1].value) *
      100
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {title}
        </h3>
      )}

      <div className="relative h-full flex flex-col justify-between">
        {animatedData.map((stage, index) => {
          const widthPercent =
            maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const color =
            stage.color || defaultColors[index % defaultColors.length];
          const conversionRate = getConversionRate(index);
          const dropoff = getStageDropoff(index);

          return (
            <div key={stage.name} className="relative group">
              {/* Stage bar */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-right">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {stage.name}
                  </span>
                </div>

                <div className="flex-1 relative">
                  <div
                    className="h-8 rounded transition-all duration-700 ease-out flex items-center justify-center"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: color,
                      minWidth: "40px",
                    }}
                  >
                    {showValues && (
                      <span className="text-white text-sm font-medium">
                        {stage.value.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Percentage badge */}
                  {showPercentages && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {conversionRate.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Dropoff indicator */}
              {index > 0 && dropoff > 0 && (
                <div className="absolute -top-3 left-28 text-xs text-red-500">
                  ↓ {dropoff.toFixed(1)}% drop
                </div>
              )}

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {stage.name}: {stage.value.toLocaleString()}
                  {index > 0 && ` (${conversionRate.toFixed(1)}% of total)`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FunnelChart;
