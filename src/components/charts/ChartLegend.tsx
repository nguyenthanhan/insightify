import React from "react";
import { cn } from "../../lib/utils/cn";

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  value?: string | number;
  visible?: boolean;
}

export interface ChartLegendProps {
  items: LegendItem[];
  onToggle?: (id: string) => void;
  orientation?: "horizontal" | "vertical";
  showValues?: boolean;
  className?: string;
}

/**
 * Interactive Chart Legend with toggle functionality
 * Requirements: 6.4
 */
export function ChartLegend({
  items,
  onToggle,
  orientation = "horizontal",
  showValues = false,
  className,
}: ChartLegendProps) {
  return (
    <div
      className={cn(
        "flex gap-4",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle?.(item.id)}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200",
            "hover:bg-white/10",
            item.visible === false && "opacity-40",
            onToggle && "cursor-pointer"
          )}
          disabled={!onToggle}
        >
          {/* Color indicator */}
          <span
            className={cn(
              "w-3 h-3 rounded-full flex-shrink-0 transition-transform",
              item.visible === false && "scale-75"
            )}
            style={{ backgroundColor: item.color }}
          />

          {/* Label */}
          <span
            className={cn(
              "text-sm text-gray-600 dark:text-gray-300",
              item.visible === false && "line-through"
            )}
          >
            {item.label}
          </span>

          {/* Value */}
          {showValues && item.value !== undefined && (
            <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Compact legend for small charts
 */
export function CompactLegend({
  items,
  className,
}: {
  items: Pick<LegendItem, "label" | "color">[];
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ChartLegend;
