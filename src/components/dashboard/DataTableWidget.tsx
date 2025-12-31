import { WidgetConfig } from "@/lib/config/dashboards/types";

interface DataTableWidgetProps {
  widget: WidgetConfig;
}

function formatValue(
  value: unknown,
  format?: string,
  colorClass?: string,
): JSX.Element {
  const className = colorClass || "text-gray-700 dark:text-gray-300";

  if (format === "currency" && typeof value === "number") {
    const formatted =
      value >= 1000
        ? `$${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`
        : `$${value}`;
    return <span className={className}>{formatted}</span>;
  }

  if (format === "percent" && typeof value === "number") {
    return <span className={className}>{value}%</span>;
  }

  if (format === "rating" && typeof value === "number") {
    return (
      <span className={colorClass || "text-yellow-600 dark:text-yellow-400"}>
        ★ {value}
      </span>
    );
  }

  if (format === "number" && typeof value === "number") {
    return <span className={className}>{value.toLocaleString()}</span>;
  }

  return <span className={className}>{String(value)}</span>;
}

export function DataTableWidget({ widget }: DataTableWidgetProps) {
  if (!widget.columns || widget.data.length === 0) {
    return <div className="text-gray-500">No data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {widget.columns.map((col) => (
              <th
                key={col.key}
                className={`pb-3 font-medium text-gray-600 dark:text-gray-400 ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {widget.data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-100 dark:border-gray-800"
            >
              {widget.columns!.map((col) => (
                <td
                  key={col.key}
                  className={`py-3 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : ""
                  } ${col.key === "page" ? "font-mono text-xs" : ""}`}
                >
                  {col.key === "name" ||
                  col.key === "product" ||
                  col.key === "page" ? (
                    <span className="text-gray-900 dark:text-white">
                      {String(row[col.key])}
                    </span>
                  ) : (
                    formatValue(row[col.key], col.format, col.colorClass)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTableWidget;
