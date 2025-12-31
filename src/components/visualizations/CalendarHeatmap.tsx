import { useState, useMemo } from "react";

interface HeatmapData {
  date: string; // ISO date string
  value: number;
}

interface CalendarHeatmapProps {
  data: HeatmapData[];
  title?: string;
  startDate?: Date;
  endDate?: Date;
  colorScale?: string[];
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  onDateClick?: (date: string, value: number) => void;
}

export function CalendarHeatmap({
  data,
  title,
  startDate,
  endDate,
  colorScale = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  showMonthLabels = true,
  showWeekdayLabels = true,
  onDateClick,
}: CalendarHeatmapProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = endDate || new Date();
    const start =
      startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    return { start, end };
  }, [startDate, endDate]);

  // Create data map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      const dateKey = d.date.split("T")[0];
      map.set(dateKey, d.value);
    });
    return map;
  }, [data]);

  // Calculate max value for color scaling
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  // Generate weeks and days
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: Date; value: number }>> = [];
    const current = new Date(dateRange.start);
    current.setHours(0, 0, 0, 0);

    // Start from Sunday
    while (current.getDay() !== 0) {
      current.setDate(current.getDate() - 1);
    }

    let currentWeek: Array<{ date: Date; value: number }> = [];

    while (current <= dateRange.end) {
      const dateKey = current.toISOString().split("T")[0];
      const value = dataMap.get(dateKey) || 0;

      currentWeek.push({
        date: new Date(current),
        value,
      });

      if (current.getDay() === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [dateRange, dataMap]);

  // Get color for value
  const getColor = (value: number): string => {
    if (value === 0) return colorScale[0];
    const index = Math.min(
      Math.ceil((value / maxValue) * (colorScale.length - 1)),
      colorScale.length - 1
    );
    return colorScale[index];
  };

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.date.getMonth() !== lastMonth) {
        lastMonth = firstDay.date.getMonth();
        labels.push({
          month: firstDay.date.toLocaleString("default", { month: "short" }),
          weekIndex,
        });
      }
    });

    return labels;
  }, [weeks]);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cellSize = 12;
  const cellGap = 2;

  return (
    <div className="w-full overflow-x-auto">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {title}
        </h3>
      )}

      <div className="inline-block">
        {/* Month labels */}
        {showMonthLabels && (
          <div
            className="flex mb-1"
            style={{ marginLeft: showWeekdayLabels ? 30 : 0 }}
          >
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-gray-400"
                style={{
                  position: "relative",
                  left: label.weekIndex * (cellSize + cellGap),
                }}
              >
                {label.month}
              </div>
            ))}
          </div>
        )}

        <div className="flex">
          {/* Weekday labels */}
          {showWeekdayLabels && (
            <div className="flex flex-col mr-1">
              {weekdays.map((day, i) => (
                <div
                  key={day}
                  className="text-xs text-gray-400"
                  style={{
                    height: cellSize + cellGap,
                    lineHeight: `${cellSize + cellGap}px`,
                    visibility: i % 2 === 1 ? "visible" : "hidden",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Calendar grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => {
                  const dateKey = day.date.toISOString().split("T")[0];
                  const isInRange =
                    day.date >= dateRange.start && day.date <= dateRange.end;

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        rounded-sm cursor-pointer transition-all
                        ${
                          isInRange
                            ? "hover:ring-1 hover:ring-gray-400"
                            : "opacity-30"
                        }
                      `}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isInRange
                          ? getColor(day.value)
                          : "#f3f4f6",
                      }}
                      onMouseEnter={() => setHoveredDate(dateKey)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() =>
                        isInRange && onDateClick?.(dateKey, day.value)
                      }
                      title={`${dateKey}: ${day.value}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400">
          <span>Less</span>
          {colorScale.map((color, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDate && (
        <div className="fixed pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 z-50">
          {hoveredDate}: {dataMap.get(hoveredDate) || 0} contributions
        </div>
      )}
    </div>
  );
}

export default CalendarHeatmap;
