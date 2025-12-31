import React from "react";
import { cn } from "../../lib/utils/cn";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  glassmorphism?: boolean;
  className?: string;
}

/**
 * Chart Card wrapper with glassmorphism styling
 * Requirements: 6.1, 6.2
 */
export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  glassmorphism = true,
  className,
}: ChartCardProps) {
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
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
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
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Chart content */}
      <div className="chart-animate-in">{children}</div>
    </div>
  );
}

export default ChartCard;
