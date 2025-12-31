import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils/cn";

export type GradientType =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning";

export interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
  format?: "number" | "currency" | "percent";
  sparklineData?: number[];
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: GradientType;
  loading?: boolean;
  glassmorphism?: boolean;
  className?: string;
}

/**
 * Premium Metric Card with glassmorphism and gradients
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1
 */
export function MetricCard({
  title,
  value,
  previousValue: _previousValue,
  change,
  trend,
  format = "number",
  sparklineData,
  subtitle,
  icon,
  gradient,
  loading = false,
  glassmorphism = true,
  className,
}: MetricCardProps) {
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

  const formatValue = (val: number | string): string => {
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
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getGradientClasses = () => {
    if (!gradient) return "";

    const gradients: Record<GradientType, string> = {
      primary: "glass-gradient-primary",
      secondary: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
      accent: "glass-gradient-accent",
      success: "glass-gradient-success",
      warning: "glass-gradient-warning",
    };

    return gradients[gradient];
  };

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl p-6",
          glassmorphism
            ? "glass-card"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
          className
        )}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl p-6 transition-all duration-300",
        glassmorphism
          ? "glass-card"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm",
        getGradientClasses(),
        "hover:scale-[1.02] hover:shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        {icon && (
          <span className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-500">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span
          className={cn(
            "text-3xl font-bold text-gray-900 dark:text-white",
            isAnimating && "transition-all"
          )}
        >
          {formatValue(displayValue)}
        </span>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend & Sparkline */}
      <div className="flex items-center justify-between">
        {change !== undefined && (
          <div className={cn("flex items-center gap-1", getTrendColor())}>
            <TrendIcon trend={trend} />
            <span className="text-sm font-medium">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <Sparkline data={sparklineData} trend={trend} />
        )}
      </div>
    </div>
  );
}

// Trend Icon component
function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
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
}

// Sparkline mini-chart component
interface SparklineProps {
  data: number[];
  trend?: "up" | "down" | "stable";
  width?: number;
  height?: number;
}

function Sparkline({ data, trend, width = 60, height = 24 }: SparklineProps) {
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
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={getStrokeColor()}
      />
    </svg>
  );
}

export default MetricCard;
