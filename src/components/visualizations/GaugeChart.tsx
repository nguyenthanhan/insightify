import { useState, useEffect } from "react";

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  thresholds?: {
    warning?: number;
    danger?: number;
  };
  showGoal?: boolean;
  goal?: number;
  animate?: boolean;
  size?: number;
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  unit = "",
  thresholds = { warning: 70, danger: 90 },
  showGoal = false,
  goal,
  animate = true,
  size = 200,
}: GaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(animate ? min : value);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [value, animate]);

  const range = max - min;
  const percentage = ((animatedValue - min) / range) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // SVG arc calculations
  const radius = (size - 20) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const startAngle = -135;
  const endAngle = 135;
  const angleRange = endAngle - startAngle;

  const polarToCartesian = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    };
  };

  const createArc = (startPercent: number, endPercent: number) => {
    const start = polarToCartesian(
      startAngle + (angleRange * startPercent) / 100
    );
    const end = polarToCartesian(startAngle + (angleRange * endPercent) / 100);
    const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const getColor = () => {
    if (thresholds.danger && percentage >= thresholds.danger) {
      return "#ef4444"; // red
    }
    if (thresholds.warning && percentage >= thresholds.warning) {
      return "#f59e0b"; // amber
    }
    return "#22c55e"; // green
  };

  const goalPercentage = goal ? ((goal - min) / range) * 100 : null;

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </h3>
      )}

      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.7}`}
      >
        {/* Background arc */}
        <path
          d={createArc(0, 100)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
          className="dark:stroke-gray-700"
        />

        {/* Value arc */}
        <path
          d={createArc(0, clampedPercentage)}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Goal marker */}
        {showGoal && goalPercentage !== null && (
          <>
            {(() => {
              const goalPos = polarToCartesian(
                startAngle + (angleRange * goalPercentage) / 100
              );
              return (
                <g>
                  <circle
                    cx={goalPos.x}
                    cy={goalPos.y}
                    r="6"
                    fill="#6366f1"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={goalPos.x}
                    y={goalPos.y - 15}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    Goal
                  </text>
                </g>
              );
            })()}
          </>
        )}

        {/* Center value display */}
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className="text-2xl font-bold fill-gray-900 dark:fill-white"
        >
          {animatedValue.toFixed(0)}
          {unit && <tspan className="text-sm">{unit}</tspan>}
        </text>

        {/* Min/Max labels */}
        <text
          x={polarToCartesian(startAngle).x + 10}
          y={polarToCartesian(startAngle).y + 20}
          textAnchor="start"
          className="text-xs fill-gray-400"
        >
          {min}
        </text>
        <text
          x={polarToCartesian(endAngle).x - 10}
          y={polarToCartesian(endAngle).y + 20}
          textAnchor="end"
          className="text-xs fill-gray-400"
        >
          {max}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-500">Good</span>
        </div>
        {thresholds.warning && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-500">Warning</span>
          </div>
        )}
        {thresholds.danger && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-500">Critical</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GaugeChart;
