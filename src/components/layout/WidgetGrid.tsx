import React from "react";
import { cn } from "../../lib/utils/cn";

export interface WidgetGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Responsive Widget Grid Layout
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function WidgetGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "md",
  className,
}: WidgetGridProps) {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4 md:gap-6",
    lg: "gap-6 md:gap-8",
  };

  // Generate responsive grid columns
  const getGridCols = () => {
    const cols: string[] = [];

    if (columns.sm) cols.push(`grid-cols-${columns.sm}`);
    if (columns.md) cols.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) cols.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) cols.push(`xl:grid-cols-${columns.xl}`);

    return cols.join(" ");
  };

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-out",
        getGridCols(),
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

export interface GridItemProps {
  children: React.ReactNode;
  colSpan?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  rowSpan?: number;
  className?: string;
}

/**
 * Grid Item with span support
 */
export function GridItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
}: GridItemProps) {
  const getColSpanClasses = () => {
    if (typeof colSpan === "number") {
      return `col-span-${colSpan}`;
    }

    const spans: string[] = [];
    if (colSpan.sm) spans.push(`col-span-${colSpan.sm}`);
    if (colSpan.md) spans.push(`md:col-span-${colSpan.md}`);
    if (colSpan.lg) spans.push(`lg:col-span-${colSpan.lg}`);
    if (colSpan.xl) spans.push(`xl:col-span-${colSpan.xl}`);

    return spans.join(" ");
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out",
        getColSpanClasses(),
        rowSpan > 1 && `row-span-${rowSpan}`,
        className
      )}
    >
      {children}
    </div>
  );
}

export default WidgetGrid;
