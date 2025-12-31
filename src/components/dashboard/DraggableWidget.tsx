import React, { useState, useRef, useCallback } from "react";
import { Widget, GridPosition, GridSize } from "@/lib/dashboard/types";

interface DraggableWidgetProps {
  widget: Widget;
  gridCellWidth: number;
  gridCellHeight: number;
  onPositionChange?: (widgetId: string, position: GridPosition) => void;
  onSizeChange?: (widgetId: string, size: GridSize) => void;
  onSelect?: (widgetId: string) => void;
  isSelected?: boolean;
  children?: React.ReactNode;
}

export function DraggableWidget({
  widget,
  gridCellWidth,
  gridCellHeight,
  onPositionChange,
  onSizeChange,
  onSelect,
  isSelected = false,
  children,
}: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: "absolute",
    left: widget.position.x * gridCellWidth,
    top: widget.position.y * gridCellHeight,
    width: widget.size.width * gridCellWidth,
    height: widget.size.height * gridCellHeight,
    transition: isDragging || isResizing ? "none" : "all 0.2s ease-out",
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging || isResizing ? 100 : isSelected ? 10 : 1,
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains("resize-handle")) {
        return;
      }

      e.preventDefault();
      setIsDragging(true);

      const rect = widgetRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      onSelect?.(widget.id);
    },
    [widget.id, onSelect]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !widgetRef.current) return;

      const parent = widgetRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;

      // Snap to grid
      const gridX = Math.round(newX / gridCellWidth);
      const gridY = Math.round(newY / gridCellHeight);

      if (gridX !== widget.position.x || gridY !== widget.position.y) {
        onPositionChange?.(widget.id, { x: gridX, y: gridY });
      }
    },
    [
      isDragging,
      dragOffset,
      gridCellWidth,
      gridCellHeight,
      widget.id,
      widget.position,
      onPositionChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handling
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      onSelect?.(widget.id);
    },
    [widget.id, onSelect]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !widgetRef.current) return;

      const parent = widgetRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const widgetLeft = widget.position.x * gridCellWidth;
      const widgetTop = widget.position.y * gridCellHeight;

      const newWidth = e.clientX - parentRect.left - widgetLeft;
      const newHeight = e.clientY - parentRect.top - widgetTop;

      // Snap to grid (minimum 1 cell)
      const gridWidth = Math.max(1, Math.round(newWidth / gridCellWidth));
      const gridHeight = Math.max(1, Math.round(newHeight / gridCellHeight));

      if (
        gridWidth !== widget.size.width ||
        gridHeight !== widget.size.height
      ) {
        onSizeChange?.(widget.id, { width: gridWidth, height: gridHeight });
      }
    },
    [
      isResizing,
      gridCellWidth,
      gridCellHeight,
      widget.id,
      widget.position,
      widget.size,
      onSizeChange,
    ]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Attach global mouse listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div
      ref={widgetRef}
      style={style}
      onMouseDown={handleMouseDown}
      className={`
        rounded-lg border bg-white dark:bg-gray-800 shadow-sm
        ${
          isSelected
            ? "ring-2 ring-blue-500 border-blue-500"
            : "border-gray-200 dark:border-gray-700"
        }
        ${isDragging ? "shadow-lg opacity-90" : ""}
        overflow-hidden
      `}
      data-widget-id={widget.id}
    >
      {/* Widget Header */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {widget.title}
        </h3>
      </div>

      {/* Widget Content */}
      <div className="p-4 h-[calc(100%-40px)] overflow-auto">{children}</div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M14 14H10V10H14V14ZM14 8H12V6H14V8ZM8 14H6V12H8V14Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default DraggableWidget;
