import React from "react";
import { cn } from "../../lib/utils/cn";

export interface TooltipData {
  label: string;
  value: string | number;
  color?: string;
}

export interface ChartTooltipProps {
  title?: string;
  data: TooltipData[];
  visible?: boolean;
  position?: { x: number; y: number };
  className?: string;
}

/**
 * Glassmorphism styled chart tooltip
 * Requirements: 6.2
 */
export function ChartTooltip({
  title,
  data,
  visible = true,
  position,
  className,
}: ChartTooltipProps) {
  if (!visible || data.length === 0) return null;

  const style: React.CSSProperties = position
    ? {
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        marginTop: -8,
      }
    : {};

  return (
    <div
      className={cn(
        "glass-tooltip px-3 py-2 min-w-[120px] animate-fade-in pointer-events-none z-50",
        className
      )}
      style={style}
    >
      {title && (
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 border-b border-white/10 pb-1.5">
          {title}
        </div>
      )}

      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {item.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple tooltip for single value display
 */
export function SimpleTooltip({
  label,
  value,
  color,
  visible = true,
  className,
}: {
  label: string;
  value: string | number;
  color?: string;
  visible?: boolean;
  className?: string;
}) {
  if (!visible) return null;

  return (
    <div className={cn("glass-tooltip px-3 py-2 animate-fade-in", className)}>
      <div className="flex items-center gap-2">
        {color && (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

export default ChartTooltip;
