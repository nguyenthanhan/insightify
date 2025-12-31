import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  useMemo,
} from "react";

interface MetricWidgetProps {
  title: string;
  value: number | string;
  previousValue?: number | string; // Used for tooltip display
  change?: number;
  trend?: "up" | "down" | "stable";
  format?: "number" | "currency" | "percent";
  sparklineData?: number[];
  subtitle?: string;
  icon?: React.ReactNode;
}

export const MetricWidget = memo(function MetricWidget({
  title,
  value,
  previousValue: _previousValue,
  change,
  trend,
  format = "number",
  sparklineData,
  subtitle,
  icon,
}: MetricWidgetProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  // Animate value changes
  useEffect(() => {
    if (typeof value === "number" && typeof prevValueRef.current === "number") {
      const startValue = prevValueRef.current as number;
      const endValue = value;
      const duration = 500;
      const startTime = Date.now();

      setIsAnimating(true);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue =
          startValue + (endValue - startValue) * easeOutQuart;

        setDisplayValue(Math.round(currentValue));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }

    prevValueRef.current = value;
  }, [value]);

  const formatValue = useCallback(
    (val: number | string): string => {
      if (typeof val !== "number") return String(val);

      switch (format) {
        case "currency":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(val);
        case "percent":
          return `${val.toFixed(1)}%`;
        default:
          return new Intl.NumberFormat("en-US").format(val);
      }
    },
    [format],
  );

  const getTrendColor = useMemo(() => {
    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }, [trend]);

  const getTrendIcon = useMemo(() => {
    switch (trend) {
      case "up":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        );
      case "down":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14"
            />
          </svg>
        );
    }
  }, [trend]);

  return (
    <div className="h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>

      {/* Value */}
      <div className="my-2">
        <span
          className={`text-2xl font-bold text-gray-900 dark:text-white ${
            isAnimating ? "transition-all" : ""
          }`}
        >
          {formatValue(displayValue)}
        </span>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend & Change */}
      <div className="flex items-center justify-between">
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${getTrendColor}`}>
            {getTrendIcon}
            <span className="text-sm font-medium">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} trend={trend} />
        )}
      </div>
    </div>
  );
});

// Sparkline mini-chart component
interface SparklineProps {
  data: number[];
  trend?: "up" | "down" | "stable";
  width?: number;
  height?: number;
}

const Sparkline = memo(function Sparkline({
  data,
  trend,
  width = 60,
  height = 24,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  const getStrokeColor = () => {
    switch (trend) {
      case "up":
        return "#22c55e";
      case "down":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={getStrokeColor()}
      />
    </svg>
  );
});

// Tooltip component for detailed info on hover
interface MetricTooltipProps {
  title: string;
  value: string;
  change?: number;
  previousValue?: string;
  period?: string;
}

export function MetricTooltip({
  title,
  value,
  change,
  previousValue,
  period = "vs last period",
}: MetricTooltipProps) {
  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm">
      <div className="font-medium mb-2">{title}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Current:</span>
          <span className="font-medium">{value}</span>
        </div>
        {previousValue && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Previous:</span>
            <span>{previousValue}</span>
          </div>
        )}
        {change !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Change:</span>
            <span className={change >= 0 ? "text-green-400" : "text-red-400"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">{period}</div>
      </div>
    </div>
  );
}

export default MetricWidget;
