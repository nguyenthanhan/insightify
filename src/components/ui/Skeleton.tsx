import React from "react";
import { cn } from "../../lib/utils/cn";

export type SkeletonVariant =
  | "text"
  | "circular"
  | "rectangular"
  | "card"
  | "chart";
export type SkeletonAnimation = "pulse" | "wave" | "none";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  animation?: SkeletonAnimation;
  className?: string;
  lines?: number; // For text variant
}

/**
 * Skeleton - Loading placeholder component
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width={200} />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="card" />
 * ```
 */
export function Skeleton({
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  className,
  lines = 1,
}: SkeletonProps): JSX.Element {
  const baseClasses = "bg-gray-200 dark:bg-gray-700";

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]",
    none: "",
  };

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
    card: "rounded-lg",
    chart: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  // Text variant with multiple lines
  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              animationClasses[animation],
              variantClasses.text,
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
            style={{ height: height || 16 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
}

/**
 * SkeletonCard - Pre-built skeleton for metric cards
 */
export function SkeletonCard({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
      role="status"
      aria-label="Loading card..."
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="30%" height={14} />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
    </div>
  );
}

/**
 * SkeletonChart - Pre-built skeleton for chart widgets
 */
export function SkeletonChart({
  className,
  height = 300,
}: {
  className?: string;
  height?: number;
}): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
      role="status"
      aria-label="Loading chart..."
    >
      {/* Title */}
      <Skeleton variant="text" width="40%" height={20} className="mb-4" />

      {/* Chart area */}
      <div className="flex items-end gap-2" style={{ height }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width="100%"
            height={`${30 + Math.random() * 70}%`}
            className="flex-1"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4">
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={80} height={14} />
      </div>
    </div>
  );
}

/**
 * SkeletonTable - Pre-built skeleton for data tables
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden",
        className
      )}
      role="status"
      aria-label="Loading table..."
    >
      {/* Header */}
      <div className="flex gap-4 border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width="100%"
            height={16}
            className="flex-1"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-gray-100 p-4 last:border-0 dark:border-gray-800"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width="100%"
              height={14}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
