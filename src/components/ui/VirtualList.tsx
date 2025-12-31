import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { cn } from "../../lib/utils/cn";

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  threshold?: number;
  className?: string;
  containerHeight?: number | string;
  getItemKey?: (item: T, index: number) => string | number;
}

interface VisibleRange {
  start: number;
  end: number;
}

/**
 * VirtualList - Renders only visible items for performance
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={largeArray}
 *   itemHeight={50}
 *   renderItem={(item, index) => <div>{item.name}</div>}
 *   threshold={50}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  threshold = 50,
  className,
  containerHeight = 400,
  getItemKey,
}: VirtualListProps<T>): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Determine if virtualization should be enabled
  const shouldVirtualize = items.length > threshold;

  // Calculate visible range
  const visibleRange = useMemo((): VisibleRange => {
    if (!shouldVirtualize) {
      return { start: 0, end: items.length };
    }

    const containerHeightNum =
      typeof containerHeight === "number"
        ? containerHeight
        : parseInt(containerHeight, 10) || 400;

    const visibleCount = Math.ceil(containerHeightNum / itemHeight);
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [
    scrollTop,
    itemHeight,
    items.length,
    overscan,
    shouldVirtualize,
    containerHeight,
  ]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll when items change significantly
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  // Total height for scroll area
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  // Get visible items
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  // Default key function
  const defaultGetKey = (_item: T, index: number) => visibleRange.start + index;
  const keyFn = getItemKey || defaultGetKey;

  if (!shouldVirtualize) {
    // Render all items without virtualization
    return (
      <div
        ref={containerRef}
        className={cn("overflow-auto", className)}
        style={{ height: containerHeight }}
        role="list"
      >
        {items.map((item, index) => (
          <div
            key={keyFn(item, index)}
            style={{ height: itemHeight }}
            role="listitem"
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-rowcount={items.length}
    >
      {/* Spacer for total scroll height */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Visible items container */}
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={keyFn(item, actualIndex)}
                style={{ height: itemHeight }}
                role="listitem"
                aria-rowindex={actualIndex + 1}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get virtualization stats (for testing/debugging)
 */
export function useVirtualListStats<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan: number
): {
  totalItems: number;
  visibleItems: number;
  renderedItems: number;
  scrollProgress: number;
} {
  const totalItems = items.length;
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const renderedItems = Math.min(totalItems, visibleItems + overscan * 2);
  const maxScroll = Math.max(0, totalItems * itemHeight - containerHeight);
  const scrollProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;

  return {
    totalItems,
    visibleItems,
    renderedItems,
    scrollProgress,
  };
}

export default VirtualList;
